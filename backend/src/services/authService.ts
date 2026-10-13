import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/tokens';
import { PlanTier, Role, SubscriptionStatus } from '@prisma/client';

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'DUPLICATE_EMAIL');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and initial Free tier subscription in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: Role.USER,
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=181e30,232b42&textColor=ffffff`,
        },
      });

      // Find Free plan
      const freePlan = await tx.subscriptionPlan.findUnique({
        where: { slug: 'free' },
      });

      if (freePlan) {
        const now = new Date();
        const oneYearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        await tx.subscription.create({
          data: {
            userId: newUser.id,
            planId: freePlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: oneYearAhead,
          },
        });
      }

      return newUser;
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshData = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshData.tokenHash,
        expiresAt: refreshData.expiresAt,
      },
    });

    const userProfile = await this.getMe(user.id);

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken: refreshData.token,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshData = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshData.tokenHash,
        expiresAt: refreshData.expiresAt,
      },
    });

    const userProfile = await this.getMe(user.id);

    return {
      user: userProfile,
      tokens: {
        accessToken,
        refreshToken: refreshData.token,
      },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      throw new AppError('Refresh token is invalid or has been revoked.', 401, 'TOKEN_REVOKED');
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Mark as revoked
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });
      throw new AppError('Refresh token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }

    // Revoke old token and issue a new pair (Rotation strategy)
    const newRefresh = generateRefreshToken();

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          tokenHash: newRefresh.tokenHash,
          expiresAt: newRefresh.expiresAt,
        },
      }),
    ]);

    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefresh.token,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { gte: new Date() },
          },
          include: { plan: true },
          orderBy: { plan: { tierLevel: 'desc' } },
          take: 1,
        },
        _count: {
          select: {
            watchlist: true,
            playbackProgress: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const activeSubscription = user.subscriptions[0] || null;
    const planTier: PlanTier = activeSubscription?.plan.tierName || PlanTier.FREE;
    const tierLevel: number = activeSubscription?.plan.tierLevel ?? 0;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      subscription: activeSubscription
        ? {
            id: activeSubscription.id,
            planId: activeSubscription.planId,
            planName: activeSubscription.plan.name,
            tierName: activeSubscription.plan.tierName,
            tierLevel: activeSubscription.plan.tierLevel,
            maxResolution: activeSubscription.plan.maxResolution,
            maxScreens: activeSubscription.plan.maxScreens,
            status: activeSubscription.status,
            currentPeriodEnd: activeSubscription.currentPeriodEnd,
            cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
          }
        : null,
      entitlement: {
        tierName: planTier,
        tierLevel,
        maxResolution: activeSubscription?.plan.maxResolution || '480p',
        maxScreens: activeSubscription?.plan.maxScreens || 1,
      },
      stats: {
        watchlistCount: user._count.watchlist,
        continueWatchingCount: user._count.playbackProgress,
      },
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
    });

    return this.getMe(updated.id);
  }
}

export const authService = new AuthService();
