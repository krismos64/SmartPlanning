import axiosInstance from '../api/axiosInstance';
import { PricingPlan } from '../config/stripe.config';

// Types pour les réponses API
export interface SubscriptionData {
  id: string;
  companyId: string;
  plan: PricingPlan;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentData {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded' | 'partially_refunded';
  type: 'subscription' | 'setup' | 'invoice' | 'one_time';
  description?: string;
  receiptUrl?: string;
  createdAt: Date;
}

export interface BillingInfo {
  company: {
    name: string;
    plan: PricingPlan;
  };
  subscription: SubscriptionData | null;
  nextPayment: Date | null;
  paymentStats: {
    totalRevenue: number;
    totalRefunded: number;
    totalPayments: number;
  };
}

export interface CheckoutSessionResponse {
  success: boolean;
  sessionId: string;
  url: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class StripeService {
  
  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(
    plan: PricingPlan,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<CheckoutSessionResponse> {
    try {
      const response = await axiosInstance.post('/stripe/create-checkout-session', {
        plan,
        successUrl,
        cancelUrl,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la création de la session');
      }

      return response.data;
    } catch (error: any) {
      console.error('Erreur création session checkout:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de créer la session de paiement'
      );
    }
  }

  /**
   * Récupère l'abonnement actuel
   */
  async getCurrentSubscription(): Promise<SubscriptionData | null> {
    try {
      const response = await axiosInstance.get('/stripe/subscription');
      
      if (response.data.success && response.data.subscription) {
        // Convertir les dates string en objets Date
        const subscription = response.data.subscription;
        return {
          ...subscription,
          currentPeriodStart: subscription.currentPeriodStart 
            ? new Date(subscription.currentPeriodStart) 
            : undefined,
          currentPeriodEnd: subscription.currentPeriodEnd 
            ? new Date(subscription.currentPeriodEnd) 
            : undefined,
          canceledAt: subscription.canceledAt 
            ? new Date(subscription.canceledAt) 
            : undefined,
          trialEnd: subscription.trialEnd 
            ? new Date(subscription.trialEnd) 
            : undefined,
          createdAt: new Date(subscription.createdAt),
          updatedAt: new Date(subscription.updatedAt),
        };
      }

      return null;
    } catch (error: any) {
      console.error('Erreur récupération abonnement:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de récupérer l\'abonnement'
      );
    }
  }

  /**
   * Met à jour l'abonnement (changement de plan)
   */
  async updateSubscription(
    plan: PricingPlan,
    cancelAtPeriodEnd: boolean = false
  ): Promise<SubscriptionData> {
    try {
      const response = await axiosInstance.put('/stripe/subscription', {
        plan,
        cancelAtPeriodEnd,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

      const subscription = response.data.subscription;
      return {
        ...subscription,
        currentPeriodStart: subscription.currentPeriodStart 
          ? new Date(subscription.currentPeriodStart) 
          : undefined,
        currentPeriodEnd: subscription.currentPeriodEnd 
          ? new Date(subscription.currentPeriodEnd) 
          : undefined,
        canceledAt: subscription.canceledAt 
          ? new Date(subscription.canceledAt) 
          : undefined,
        trialEnd: subscription.trialEnd 
          ? new Date(subscription.trialEnd) 
          : undefined,
        createdAt: new Date(subscription.createdAt),
        updatedAt: new Date(subscription.updatedAt),
      };
    } catch (error: any) {
      console.error('Erreur mise à jour abonnement:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de mettre à jour l\'abonnement'
      );
    }
  }

  /**
   * Annule l'abonnement
   */
  async cancelSubscription(
    cancelAtPeriodEnd: boolean = true,
    reason?: string
  ): Promise<SubscriptionData> {
    try {
      const response = await axiosInstance.delete('/stripe/subscription', {
        data: {
          cancelAtPeriodEnd,
          cancelationReason: reason,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de l\'annulation');
      }

      const subscription = response.data.subscription;
      return {
        ...subscription,
        currentPeriodStart: subscription.currentPeriodStart 
          ? new Date(subscription.currentPeriodStart) 
          : undefined,
        currentPeriodEnd: subscription.currentPeriodEnd 
          ? new Date(subscription.currentPeriodEnd) 
          : undefined,
        canceledAt: subscription.canceledAt 
          ? new Date(subscription.canceledAt) 
          : undefined,
        trialEnd: subscription.trialEnd 
          ? new Date(subscription.trialEnd) 
          : undefined,
        createdAt: new Date(subscription.createdAt),
        updatedAt: new Date(subscription.updatedAt),
      };
    } catch (error: any) {
      console.error('Erreur annulation abonnement:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible d\'annuler l\'abonnement'
      );
    }
  }

  /**
   * Récupère l'historique des paiements
   */
  async getPaymentHistory(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
  }): Promise<{
    payments: PaymentData[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    try {
      const response = await axiosInstance.get('/stripe/payments', { params });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération');
      }

      const payments = response.data.payments.map((payment: any) => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
      }));

      return {
        payments,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error('Erreur historique paiements:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de récupérer l\'historique des paiements'
      );
    }
  }

  /**
   * Synchronise les données depuis Stripe
   */
  async syncSubscription(): Promise<SubscriptionData | null> {
    try {
      const response = await axiosInstance.post('/stripe/sync');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la synchronisation');
      }

      if (!response.data.subscription) {
        return null;
      }

      const subscription = response.data.subscription;
      return {
        ...subscription,
        currentPeriodStart: subscription.currentPeriodStart 
          ? new Date(subscription.currentPeriodStart) 
          : undefined,
        currentPeriodEnd: subscription.currentPeriodEnd 
          ? new Date(subscription.currentPeriodEnd) 
          : undefined,
        canceledAt: subscription.canceledAt 
          ? new Date(subscription.canceledAt) 
          : undefined,
        trialEnd: subscription.trialEnd 
          ? new Date(subscription.trialEnd) 
          : undefined,
        createdAt: new Date(subscription.createdAt),
        updatedAt: new Date(subscription.updatedAt),
      };
    } catch (error: any) {
      console.error('Erreur synchronisation:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de synchroniser les données'
      );
    }
  }

  /**
   * Récupère les informations de facturation complètes
   */
  async getBillingInfo(): Promise<BillingInfo> {
    try {
      const response = await axiosInstance.get('/stripe/billing');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la récupération');
      }

      const billing = response.data.billing;
      
      return {
        company: billing.company,
        subscription: billing.subscription ? {
          ...billing.subscription,
          currentPeriodStart: billing.subscription.currentPeriodStart 
            ? new Date(billing.subscription.currentPeriodStart) 
            : undefined,
          currentPeriodEnd: billing.subscription.currentPeriodEnd 
            ? new Date(billing.subscription.currentPeriodEnd) 
            : undefined,
          canceledAt: billing.subscription.canceledAt 
            ? new Date(billing.subscription.canceledAt) 
            : undefined,
          trialEnd: billing.subscription.trialEnd 
            ? new Date(billing.subscription.trialEnd) 
            : undefined,
          createdAt: new Date(billing.subscription.createdAt),
          updatedAt: new Date(billing.subscription.updatedAt),
        } : null,
        nextPayment: billing.nextPayment ? new Date(billing.nextPayment) : null,
        paymentStats: billing.paymentStats,
      };
    } catch (error: any) {
      console.error('Erreur informations facturation:', error);
      throw new Error(
        error.response?.data?.message || 
        'Impossible de récupérer les informations de facturation'
      );
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;