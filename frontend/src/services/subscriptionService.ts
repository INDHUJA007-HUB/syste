import { api } from './api';
import { SubscriptionPlan, PaymentRecord } from '../types';

export const subscriptionService = {
  async getPlans() {
    const res = await api.get<{ success: boolean; data: SubscriptionPlan[] }>('/subscriptions/plans');
    return res.data.data;
  },

  async getMySubscription() {
    const res = await api.get<{
      success: boolean;
      data: {
        isActive: boolean;
        tierName: string;
        tierLevel: number;
        planName: string;
        maxResolution: string;
        maxScreens: number;
        subscription: any;
      };
    }>('/subscriptions/me');
    return res.data.data;
  },

  async checkout(data: {
    planId: string;
    paymentMethod?: string;
    idempotencyKey?: string;
    simulateFailure?: boolean;
  }) {
    const res = await api.post<{ success: boolean; data: any }>('/subscriptions/checkout', data);
    return res.data.data;
  },

  async cancelSubscription(subscriptionId: string) {
    const res = await api.post<{ success: boolean; data: any }>(`/subscriptions/${subscriptionId}/cancel`);
    return res.data.data;
  },

  async getPayments() {
    const res = await api.get<{ success: boolean; data: PaymentRecord[] }>('/subscriptions/payments');
    return res.data.data;
  },
};
