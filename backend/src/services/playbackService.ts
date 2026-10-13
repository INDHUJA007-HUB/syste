import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { subscriptionService, TIER_HIERARCHY } from './subscriptionService';
import { generateSignedMediaToken } from '../utils/mediaSigning';
import { PlanTier, SubscriptionStatus, ViewingEventType } from '@prisma/client';

export class PlaybackService {
  /**
   * Section 7 Playback Authorization Workflow
   */
  async createPlaybackSession(userId: string, videoId: string, ipAddress?: string, userAgent?: string) {
    // 1. Confirm video exists and is published
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { mediaAssets: true },
    });

    if (!video || !video.isPublished) {
      throw new AppError('Requested video is unavailable or does not exist.', 404, 'VIDEO_NOT_FOUND');
    }

    // 2. Retrieve user and active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { plan: { tierLevel: 'desc' } },
    });

    // Determine user's current effective tier level
    let userTierLevel = 0;
    let userTierName: PlanTier = PlanTier.FREE;

    if (activeSub) {
      userTierLevel = activeSub.plan.tierLevel;
      userTierName = activeSub.plan.tierName;
    } else {
      // Check if user has free entitlement
      userTierLevel = 0;
      userTierName = PlanTier.FREE;
    }

    const requiredTierLevel = TIER_HIERARCHY[video.minimumPlanTier] ?? 0;

    // 3. Check entitlement permission
    if (userTierLevel < requiredTierLevel) {
      // Find the minimum plan needed for this video
      const requiredPlan = await prisma.subscriptionPlan.findFirst({
        where: { tierName: video.minimumPlanTier },
      });

      throw new AppError(
        `Playback denied: "${video.title}" requires a ${video.minimumPlanTier} plan. Your current active tier is ${userTierName}.`,
        403,
        'UPGRADE_REQUIRED',
        {
          videoTitle: video.title,
          currentTier: userTierName,
          requiredTier: video.minimumPlanTier,
          requiredPlanName: requiredPlan?.name || `${video.minimumPlanTier} Plan`,
          requiredPlanPriceCents: requiredPlan?.priceCents || 0,
        }
      );
    }

    // 4. Create active PlaybackSession with 4-hour validity
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const session = await prisma.playbackSession.create({
      data: {
        userId,
        videoId: video.id,
        sessionToken,
        ipAddress,
        userAgent,
        expiresAt,
        isActive: true,
      },
    });

    // 5. Generate secure signed media token for streaming
    const signedToken = generateSignedMediaToken({
      userId,
      videoId: video.id,
      sessionId: session.id,
    });

    // 6. Record viewing START event
    await prisma.viewingEvent.create({
      data: {
        userId,
        videoId: video.id,
        eventType: ViewingEventType.START,
        positionSeconds: 0,
      },
    });

    // Increment video view count
    await prisma.video.update({
      where: { id: video.id },
      data: { viewCount: { increment: 1 } },
    });

    // 7. Retrieve last saved progress if any
    const lastProgress = await prisma.playbackProgress.findUnique({
      where: { userId_videoId: { userId, videoId: video.id } },
    });

    return {
      sessionId: session.id,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      video: {
        id: video.id,
        title: video.title,
        durationSeconds: video.durationSeconds,
        posterUrl: video.posterUrl,
      },
      media: {
        // Direct stream / HLS endpoint protected with signed token
        streamUrl: `/api/media/stream/${video.id}?token=${signedToken}`,
        hlsManifestUrl: video.hlsManifestUrl
          ? `/api/media/stream/${video.id}?token=${signedToken}&format=hls`
          : undefined,
        directFallbackUrl: video.videoUrl, // Permitted sample public media
        signedToken,
        maxResolution: activeSub?.plan.maxResolution || '480p',
      },
      resumePositionSeconds: lastProgress ? lastProgress.positionSeconds : 0,
    };
  }

  async updateProgress(
    sessionId: string,
    userId: string,
    positionSeconds: number,
    durationSeconds: number,
    completed: boolean = false,
    clientTimestamp?: number
  ) {
    const session = await prisma.playbackSession.findFirst({
      where: {
        id: sessionId,
        userId,
        isActive: true,
      },
    });

    if (!session) {
      throw new AppError('Playback session expired or invalid.', 401, 'SESSION_EXPIRED');
    }

    if (new Date() > session.expiresAt) {
      await prisma.playbackSession.update({
        where: { id: session.id },
        data: { isActive: false },
      });
      throw new AppError('Playback session has expired. Please re-authenticate.', 401, 'SESSION_EXPIRED');
    }

    // Touch heartbeat
    await prisma.playbackSession.update({
      where: { id: session.id },
      data: { lastHeartbeatAt: new Date() },
    });

    const isCompleted = completed || (durationSeconds > 0 && positionSeconds >= durationSeconds * 0.95);

    // Fetch existing progress to guard against stale out-of-order updates
    const existing = await prisma.playbackProgress.findUnique({
      where: {
        userId_videoId: { userId, videoId: session.videoId },
      },
    });

    if (existing) {
      // If client timestamp was sent and is older than last write time, ignore stale async update
      if (clientTimestamp && existing.lastWatchedAt && clientTimestamp < existing.lastWatchedAt.getTime()) {
        return existing;
      }
    }


    const timestamp = clientTimestamp ? new Date(clientTimestamp) : new Date();

    // Upsert PlaybackProgress
    const progress = await prisma.playbackProgress.upsert({
      where: {
        userId_videoId: { userId, videoId: session.videoId },
      },
      update: {
        positionSeconds,
        durationSeconds,
        completed: isCompleted,
        lastWatchedAt: timestamp,
      },
      create: {
        userId,
        videoId: session.videoId,
        positionSeconds,
        durationSeconds,
        completed: isCompleted,
        lastWatchedAt: timestamp,
      },
    });


    // Record heartbeat event
    await prisma.viewingEvent.create({
      data: {
        userId,
        videoId: session.videoId,
        eventType: ViewingEventType.HEARTBEAT,
        positionSeconds,
      },
    });

    return progress;
  }

  async getResume(userId: string, videoId: string) {
    return prisma.playbackProgress.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });
  }

  async getContinueWatching(userId: string) {
    const progressItems = await prisma.playbackProgress.findMany({
      where: {
        userId,
        completed: false,
        positionSeconds: { gt: 5 }, // Watched more than 5 seconds
      },
      orderBy: { lastWatchedAt: 'desc' },
      take: 12,
      include: {
        video: {
          include: {
            genres: {
              include: { genre: true },
            },
          },
        },
      },
    });

    return progressItems.map((item) => ({
      id: item.id,
      positionSeconds: item.positionSeconds,
      durationSeconds: item.durationSeconds,
      percentWatched: item.durationSeconds > 0 ? Math.min(100, Math.round((item.positionSeconds / item.durationSeconds) * 100)) : 0,
      lastWatchedAt: item.lastWatchedAt,
      video: {
        id: item.video.id,
        title: item.video.title,
        slug: item.video.slug,
        description: item.video.description,
        posterUrl: item.video.posterUrl,
        thumbnailUrl: item.video.thumbnailUrl,
        trailerUrl: item.video.trailerUrl,
        durationSeconds: item.video.durationSeconds,
        releaseYear: item.video.releaseYear,
        maturityRating: item.video.maturityRating,
        rating: item.video.rating,
        isFeatured: item.video.isFeatured,
        isTrending: item.video.isTrending,
        minimumPlanTier: item.video.minimumPlanTier,
        director: item.video.director,
        cast: item.video.cast,
        inWatchlist: false,
        playbackProgress: {
          positionSeconds: item.positionSeconds,
          durationSeconds: item.durationSeconds,
          completed: item.completed,
        },
        genres: item.video.genres.map((g) => ({
          id: g.genre.id,
          name: g.genre.name,
          slug: g.genre.slug,
        })),
      },
    }));
  }
}

export const playbackService = new PlaybackService();
