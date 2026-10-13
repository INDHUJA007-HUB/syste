import { prisma } from '../config/prisma';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export const TIER_HIERARCHY: Record<PlanTier, number> = {
  FREE: 0,
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
};

export class SubscriptionService {
  async getPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { tierLevel: 'asc' },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      billingInterval: p.billingInterval,
      maxResolution: p.maxResolution,
      maxScreens: p.maxScreens,
      tierLevel: p.tierLevel,
      tierName: p.tierName,
      features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
    }));
  }

  async getUserActiveSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        plan: true,
      },
      orderBy: {
        plan: {
          tierLevel: 'desc',
        },
      },
    });

    if (!subscription) {
      // Return Free tier fallback
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { slug: 'free' },
      });

      return {
        isActive: false,
        tierName: PlanTier.FREE,
        tierLevel: 0,
        planName: freePlan ? freePlan.name : 'Free Tier',
        maxResolution: freePlan ? freePlan.maxResolution : '480p',
        maxScreens: 1,
        subscription: null,
      };
    }

    return {
      isActive: true,
      tierName: subscription.plan.tierName,
      tierLevel: subscription.plan.tierLevel,
      planName: subscription.plan.name,
      maxResolution: subscription.plan.maxResolution,
      maxScreens: subscription.plan.maxScreens,
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    };
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    const sub = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId, // Enforce cross-user security!
      },
    });

    if (!sub) {
      throw new AppError('Subscription not found or access denied.', 404, 'NOT_FOUND');
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new AppError('Only active subscriptions can be cancelled.', 400, 'BAD_REQUEST');
    }

    // Set cancelAtPeriodEnd so the user retains access until currentPeriodEnd
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: true,
      },
      include: { plan: true },
    });

    return {
      id: updated.id,
      status: updated.status,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd,
      message: `Your subscription to ${updated.plan.name} has been cancelled. You retain full access until ${updated.currentPeriodEnd.toLocaleDateString()}.`,
    };
  }

  canAccessTier(userTierLevel: number, requiredTier: PlanTier): boolean {
    const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;
    return userTierLevel >= requiredLevel;
  }
}

export const subscriptionService = new SubscriptionService();
