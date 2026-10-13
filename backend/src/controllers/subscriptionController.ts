import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { paymentService } from '../services/paymentService';

export class SubscriptionController {
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await subscriptionService.getPlans();
      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMySubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionService.getUserActiveSubscription(req.user!.userId);
      res.status(200).json({
        success: true,
        data: sub,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId, paymentMethod, idempotencyKey, simulateFailure } = req.body;
      const result = await paymentService.processCheckout({
        userId: req.user!.userId,
        planId,
        paymentMethod,
        idempotencyKey,
        simulateFailure,
      });

      res.status(result.success === false ? 400 : 200).json({
        success: result.success !== false,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await subscriptionService.cancelSubscription(req.user!.userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await paymentService.getPaymentHistory(req.user!.userId);
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const rawBody = JSON.stringify(req.body);
      const result = await paymentService.handleWebhook(signature, req.body, rawBody);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
