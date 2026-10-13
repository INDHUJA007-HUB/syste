import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { PaymentStatus, SubscriptionStatus } from '@prisma/client';

export interface CheckoutOptions {
  userId: string;
  planId: string;
  paymentMethod?: string;
  idempotencyKey?: string;
  simulateFailure?: boolean;
}

export class PaymentService {
  /**
   * Safe sandbox payment processing with idempotency support.
   */
  async processCheckout(options: CheckoutOptions) {
    const { userId, planId, paymentMethod = 'card_mock_visa_4242', idempotencyKey, simulateFailure = false } = options;

    // 1. Check idempotency if key provided
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { subscription: { include: { plan: true } } },
      });

      if (existingPayment) {
        return {
          idempotentReplay: true,
          payment: existingPayment,
          subscription: existingPayment.subscription,
          message: 'Payment already processed with this idempotency key.',
        };
      }
    }

    // 2. Fetch the requested Plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new AppError('The requested subscription plan is not available.', 404, 'PLAN_NOT_FOUND');
    }

    // Free plan zero checkout
    if (plan.priceCents === 0) {
      const now = new Date();
      const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      const [sub, pay] = await prisma.$transaction(async (tx) => {
        const freeSub = await tx.subscription.create({
          data: {
            userId,
            planId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: now,
            currentPeriodEnd: oneYear,
          },
        });

        const freePayment = await tx.payment.create({
          data: {
            userId,
            subscriptionId: freeSub.id,
            amountCents: 0,
            currency: plan.currency,
            status: PaymentStatus.SUCCEEDED,
            paymentMethod: 'free_grant',
            idempotencyKey,
            externalTransactionId: `txn_free_${Date.now()}_${userId.slice(0, 8)}`,
          },
        });

        return [freeSub, freePayment];
      });

      return {
        payment: pay,
        subscription: sub,
        plan,
        message: 'Free subscription plan activated successfully.',
      };
    }

    // 3. Simulated Mock Payment Gateway
    const externalTxnId = `txn_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (simulateFailure) {
      const failedPayment = await prisma.payment.create({
        data: {
          userId,
          amountCents: plan.priceCents,
          currency: plan.currency,
          status: PaymentStatus.FAILED,
          paymentMethod,
          idempotencyKey,
          externalTransactionId: externalTxnId,
          failureReason: 'Card was declined by simulated issuer (sandbox test code: card_declined).',
        },
      });

      return {
        payment: failedPayment,
        subscription: null,
        plan,
        error: 'Payment was declined. Please verify your payment details and retry.',
        success: false,
      };
    }

    // 4. Successful Payment Execution within Transaction
    const now = new Date();
    // 30 days period
    const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // Deactivate any previous active subscriptions for this user
      await tx.subscription.updateMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      // Activate new subscription
      const newSub = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // Record successful payment
      const payment = await tx.payment.create({
        data: {
          userId,
          subscriptionId: newSub.id,
          amountCents: plan.priceCents,
          currency: plan.currency,
          status: PaymentStatus.SUCCEEDED,
          paymentMethod,
          idempotencyKey,
          externalTransactionId: externalTxnId,
        },
      });

      return { subscription: newSub, payment };
    });

    return {
      success: true,
      payment: result.payment,
      subscription: result.subscription,
      plan,
      message: `Payment of $${(plan.priceCents / 100).toFixed(2)} confirmed. Your ${plan.name} is now active!`,
    };
  }

  /**
   * Verify and process incoming webhooks from payment providers.
   */
  async handleWebhook(signature: string, payload: any, rawBody: string) {
    // 1. Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', config.paymentWebhookSecret);
    hmac.update(rawBody);
    const expectedSig = hmac.digest('hex');

    const sigBuf = Buffer.from(signature || '');
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new AppError('Invalid webhook signature verification failed.', 401, 'INVALID_SIGNATURE');
    }

    const { event, data } = payload;

    // 2. Handle events idempotently
    switch (event) {
      case 'payment.succeeded': {
        const { externalTransactionId, subscriptionId } = data;
        if (subscriptionId) {
          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.ACTIVE },
          });
        }
        return { received: true, event: 'payment.succeeded' };
      }

      case 'payment.failed': {
        const { subscriptionId } = data;
        if (subscriptionId) {
          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.PAST_DUE },
          });
        }
        return { received: true, event: 'payment.failed' };
      }

      case 'subscription.canceled': {
        const { subscriptionId } = data;
        if (subscriptionId) {
          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.CANCELED },
          });
        }
        return { received: true, event: 'subscription.canceled' };
      }

      default:
        return { received: true, ignored: true };
    }
  }

  async getPaymentHistory(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });
  }
}

export const paymentService = new PaymentService();
