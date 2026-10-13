import { prisma } from '../config/prisma';
import { cache } from '../config/cache';
import { AppError } from '../middleware/errorHandler';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

export class AdminService {
  async getAnalytics() {
    const [
      totalUsers,
      totalVideos,
      activeSubscriptions,
      allSubscriptions,
      payments,
      topVideos,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: { gte: new Date() },
        },
      }),
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
        },
        include: { plan: true },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { name: true, email: true } },
          subscription: { include: { plan: true } },
        },
      }),
      prisma.video.findMany({
        orderBy: { viewCount: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          viewCount: true,
          rating: true,
          minimumPlanTier: true,
          posterUrl: true,
        },
      }),
    ]);

    // Calculate total revenue in cents
    const totalRevenueCents = payments
      .filter((p) => p.status === 'SUCCEEDED')
      .reduce((acc, curr) => acc + curr.amountCents, 0);

    // Group subscriptions by plan
    const subscriptionsByPlan: Record<string, number> = {};
    for (const sub of allSubscriptions) {
      const planName = sub.plan.name;
      subscriptionsByPlan[planName] = (subscriptionsByPlan[planName] || 0) + 1;
    }

    return {
      stats: {
        totalUsers,
        totalVideos,
        activeSubscriptions,
        totalRevenueCents,
        totalRevenueFormatted: `$${(totalRevenueCents / 100).toFixed(2)}`,
      },
      subscriptionsByPlan,
      topVideos,
      recentPayments: payments.map((p) => ({
        id: p.id,
        user: p.user.name,
        email: p.user.email,
        amountFormatted: `$${(p.amountCents / 100).toFixed(2)}`,
        status: p.status,
        planName: p.subscription?.plan.name || 'Direct Billing',
        date: p.createdAt,
      })),
    };
  }

  async createVideo(data: any) {
    const { genreIds, ...videoData } = data;

    // Generate unique slug
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const video = await prisma.video.create({
      data: {
        ...videoData,
        slug,
        genres: {
          create: (genreIds || []).map((genreId: string) => ({
            genre: { connect: { id: genreId } },
          })),
        },
      },
      include: {
        genres: { include: { genre: true } },
      },
    });

    // Invalidate catalogue cache
    await cache.flush();

    return video;
  }

  async updateVideo(id: string, data: any) {
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Video not found.', 404, 'NOT_FOUND');
    }

    const { genreIds, ...videoData } = data;

    const updated = await prisma.$transaction(async (tx) => {
      if (genreIds) {
        // Remove existing genre relationships
        await tx.videoGenre.deleteMany({ where: { videoId: id } });

        // Add new genres
        await tx.videoGenre.createMany({
          data: genreIds.map((genreId: string) => ({
            videoId: id,
            genreId,
          })),
        });
      }

      return tx.video.update({
        where: { id },
        data: videoData,
        include: {
          genres: { include: { genre: true } },
        },
      });
    });

    await cache.flush();
    return updated;
  }

  async deleteVideo(id: string) {
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Video not found.', 404, 'NOT_FOUND');
    }

    await prisma.video.delete({ where: { id } });
    await cache.flush();

    return { message: `Video "${existing.title}" deleted successfully.` };
  }

  async updatePlan(id: string, data: any) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Subscription plan not found.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceCents: data.priceCents,
        maxResolution: data.maxResolution,
        maxScreens: data.maxScreens,
        features: typeof data.features === 'object' ? JSON.stringify(data.features) : data.features,
        isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      },
    });

    return updated;
  }
}

export const adminService = new AdminService();
