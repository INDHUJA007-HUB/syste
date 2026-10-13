import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export class WatchlistService {
  async getWatchlist(userId: string) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        video: {
          include: {
            genres: {
              include: { genre: true },
            },
            playbackProgress: {
              where: { userId },
            },
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      addedAt: item.createdAt,
      video: {
        id: item.video.id,
        title: item.video.title,
        slug: item.video.slug,
        description: item.video.description,
        posterUrl: item.video.posterUrl,
        thumbnailUrl: item.video.thumbnailUrl,
        durationSeconds: item.video.durationSeconds,
        releaseYear: item.video.releaseYear,
        maturityRating: item.video.maturityRating,
        rating: item.video.rating,
        minimumPlanTier: item.video.minimumPlanTier,
        genres: item.video.genres.map((g) => ({
          id: g.genre.id,
          name: g.genre.name,
          slug: g.genre.slug,
        })),
        playbackProgress: item.video.playbackProgress[0] || null,
      },
    }));
  }

  async addToWatchlist(userId: string, videoId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new AppError('Video not found.', 404, 'NOT_FOUND');
    }

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    if (existing) {
      return { message: 'Video is already in your watchlist.', item: existing };
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId,
        videoId,
      },
      include: { video: true },
    });

    return { message: `"${video.title}" added to your watchlist.`, item };
  }

  async removeFromWatchlist(userId: string, videoId: string) {
    const item = await prisma.watchlistItem.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    if (!item) {
      throw new AppError('Video was not found in your watchlist.', 404, 'NOT_FOUND');
    }

    await prisma.watchlistItem.delete({
      where: { id: item.id },
    });

    return { message: 'Video removed from your watchlist.' };
  }
}

export const watchlistService = new WatchlistService();
