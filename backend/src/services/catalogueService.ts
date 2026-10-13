import { prisma } from '../config/prisma';
import { cache } from '../config/cache';
import { PlanTier, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface CatalogueFilterOptions {
  page: number;
  limit: number;
  search?: string;
  genre?: string;
  tier?: PlanTier;
  sortBy: 'trending' | 'rating' | 'year' | 'views' | 'newest';
}

export class CatalogueService {
  async getGenres() {
    const cacheKey = 'catalogue:genres:all';
    const cached = await cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Cache miss
      }
    }

    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { videos: true },
        },
      },
    });

    const result = genres.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      videoCount: g._count.videos,
    }));

    // Cache for 1 hour
    await cache.set(cacheKey, JSON.stringify(result), 3600);
    return result;
  }

  async listVideos(options: CatalogueFilterOptions, userId?: string) {
    const { page, limit, search, genre, tier, sortBy } = options;
    const skip = (page - 1) * limit;

    // Cache key for non-user-specific searches
    const cacheKey = `catalogue:videos:p${page}:l${limit}:s${search || ''}:g${genre || ''}:t${tier || ''}:sort${sortBy}`;
    
    // Only use cache if no search term or if pure catalogue browsing
    if (!search) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // If userId provided, augment with watchlist status dynamically
          if (userId) {
            return this.augmentVideosWithUserData(parsed, userId);
          }
          return parsed;
        } catch {
          // ignore
        }
      }
    }

    // Build Prisma where clause
    const where: Prisma.VideoWhereInput = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cast: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (genre) {
      where.genres = {
        some: {
          genre: {
            slug: genre,
          },
        },
      };
    }

    if (tier) {
      where.minimumPlanTier = tier;
    }

    // Build orderBy
    let orderBy: Prisma.VideoOrderByWithRelationInput = { isTrending: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'year') {
      orderBy = { releaseYear: 'desc' };
    } else if (sortBy === 'views') {
      orderBy = { viewCount: 'desc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, videos] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          genres: {
            include: {
              genre: true,
            },
          },
        },
      }),
    ]);

    const formattedVideos = videos.map((v) => ({
      id: v.id,
      title: v.title,
      slug: v.slug,
      description: v.description,
      posterUrl: v.posterUrl,
      thumbnailUrl: v.thumbnailUrl,
      trailerUrl: v.trailerUrl,
      durationSeconds: v.durationSeconds,
      releaseYear: v.releaseYear,
      maturityRating: v.maturityRating,
      rating: v.rating,
      isFeatured: v.isFeatured,
      isTrending: v.isTrending,
      minimumPlanTier: v.minimumPlanTier,
      director: v.director,
      cast: v.cast,
      genres: v.genres.map((g) => ({
        id: g.genre.id,
        name: g.genre.name,
        slug: g.genre.slug,
      })),
      inWatchlist: false,
    }));

    const response = {
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache if general query
    if (!search) {
      await cache.set(cacheKey, JSON.stringify(response), 300); // 5 min TTL
    }

    if (userId) {
      return this.augmentVideosWithUserData(response, userId);
    }

    return response;
  }

  private async augmentVideosWithUserData(response: any, userId: string) {
    const videoIds = response.videos.map((v: any) => v.id);
    if (videoIds.length === 0) return response;

    const [watchlistItems, progressItems] = await Promise.all([
      prisma.watchlistItem.findMany({
        where: {
          userId,
          videoId: { in: videoIds },
        },
        select: { videoId: true },
      }),
      prisma.playbackProgress.findMany({
        where: {
          userId,
          videoId: { in: videoIds },
        },
        select: {
          videoId: true,
          positionSeconds: true,
          durationSeconds: true,
          completed: true,
        },
      }),
    ]);

    const watchlistSet = new Set(watchlistItems.map((w) => w.videoId));
    const progressMap = new Map(progressItems.map((p) => [p.videoId, p]));

    return {
      ...response,
      videos: response.videos.map((v: any) => ({
        ...v,
        inWatchlist: watchlistSet.has(v.id),
        playbackProgress: progressMap.get(v.id) || null,
      })),
    };
  }

  async getVideoById(idOrSlug: string, userId?: string) {
    const video = await prisma.video.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isPublished: true,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        mediaAssets: {
          select: {
            id: true,
            quality: true,
            format: true,
            status: true,
          },
        },
      },
    });

    if (!video) {
      throw new AppError('Video title not found.', 404, 'NOT_FOUND');
    }

    let inWatchlist = false;
    let playbackProgress = null;

    if (userId) {
      const [watchlistItem, progress] = await Promise.all([
        prisma.watchlistItem.findUnique({
          where: {
            userId_videoId: { userId, videoId: video.id },
          },
        }),
        prisma.playbackProgress.findUnique({
          where: {
            userId_videoId: { userId, videoId: video.id },
          },
        }),
      ]);

      inWatchlist = !!watchlistItem;
      playbackProgress = progress;
    }

    return {
      id: video.id,
      title: video.title,
      slug: video.slug,
      description: video.description,
      posterUrl: video.posterUrl,
      thumbnailUrl: video.thumbnailUrl,
      trailerUrl: video.trailerUrl,
      durationSeconds: video.durationSeconds,
      releaseYear: video.releaseYear,
      maturityRating: video.maturityRating,
      rating: video.rating,
      isFeatured: video.isFeatured,
      isTrending: video.isTrending,
      viewCount: video.viewCount,
      minimumPlanTier: video.minimumPlanTier,
      director: video.director,
      cast: video.cast,
      genres: video.genres.map((g) => ({
        id: g.genre.id,
        name: g.genre.name,
        slug: g.genre.slug,
      })),
      availableQualities: video.mediaAssets.map((a) => a.quality),
      inWatchlist,
      playbackProgress,
    };
  }
}

export const catalogueService = new CatalogueService();
