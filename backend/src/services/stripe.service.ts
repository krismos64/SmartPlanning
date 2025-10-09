import Stripe from 'stripe';
import { stripe, PLAN_TO_PRICE } from '../config/stripe.config';
import { Company, Subscription, Payment } from '@prisma/client';
import prisma from '../config/prisma';

type SubscriptionPlan = 'free' | 'standard' | 'premium' | 'enterprise';

export class StripeService {

  /**
   * Crée ou récupère un client Stripe pour une entreprise
   */
  async createOrGetCustomer(company: Company, email: string): Promise<Stripe.Customer> {
    try {
      // Vérifier si un abonnement existe déjà avec un customer ID
      const existingSubscription = await prisma.subscription.findFirst({
        where: { companyId: company.id }
      });

      if (existingSubscription?.stripeCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
          if (customer && !customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (error) {
          console.warn(`Customer Stripe non trouvé: ${existingSubscription.stripeCustomerId}`);
        }
      }

      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email,
        name: company.name,
        metadata: {
          companyId: company.id,
          plan: company.plan,
          environment: process.env.NODE_ENV || 'development',
        },
      });

      return customer;
    } catch (error) {
      console.error('Erreur lors de la création du client Stripe:', error);
      throw new Error('Impossible de créer le client Stripe');
    }
  }

  /**
   * Crée une session de checkout Stripe
   */
  async createCheckoutSession(
    companyId: number,
    plan: SubscriptionPlan,
    email: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      if (plan === 'free') {
        throw new Error('Le plan gratuit ne nécessite pas de paiement');
      }

      const priceId = PLAN_TO_PRICE[plan];
      if (!priceId) {
        throw new Error(`Prix Stripe non configuré pour le plan: ${plan}`);
      }

      const customer = await this.createOrGetCustomer(company, email);

      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard/billing?success=true`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard/billing?canceled=true`,
        metadata: {
          companyId: companyId,
          plan: plan,
        },
        subscription_data: {
          metadata: {
            companyId: companyId,
            plan: plan,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      });

      return session;
    } catch (error) {
      console.error('Erreur lors de la création de la session checkout:', error);
      throw new Error('Impossible de créer la session de paiement');
    }
  }

  /**
   * Met à jour un abonnement existant
   */
  async updateSubscription(
    companyId: number,
    newPlan: SubscriptionPlan,
    cancelAtPeriodEnd: boolean = false
  ): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { companyId }
      });
      if (!subscription) {
        throw new Error('Abonnement non trouvé');
      }

      if (newPlan === 'free') {
        // Annuler l'abonnement Stripe pour passer au plan gratuit
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        }

        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            plan: 'free',
            status: 'canceled',
            canceledAt: new Date(),
            stripeSubscriptionId: null,
            stripePriceId: null,
          }
        });

        return updatedSubscription;
      } else {
        const newPriceId = PLAN_TO_PRICE[newPlan];
        if (!newPriceId) {
          throw new Error(`Prix Stripe non configuré pour le plan: ${newPlan}`);
        }

        if (subscription.stripeSubscriptionId) {
          // Mettre à jour l'abonnement Stripe existant
          const stripeSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              items: [
                {
                  id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
                  price: newPriceId,
                },
              ],
              cancel_at_period_end: cancelAtPeriodEnd,
              proration_behavior: 'create_prorations',
            }
          );

          const updatedSubscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              plan: newPlan,
              stripePriceId: newPriceId,
              status: stripeSubscription.status as any,
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
              currentPeriodStart: new Date(((stripeSubscription as any).current_period_start || 0) * 1000),
              currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end || 0) * 1000),
            }
          });

          // Mettre à jour le plan de la company
          await prisma.company.update({
            where: { id: companyId },
            data: { plan: newPlan }
          });

          return updatedSubscription;
        }
      }

      throw new Error('Impossible de mettre à jour l\'abonnement');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      throw new Error('Impossible de mettre à jour l\'abonnement');
    }
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(companyId: number, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { companyId }
      });
      if (!subscription) {
        throw new Error('Abonnement non trouvé');
      }

      if (subscription.stripeSubscriptionId) {
        if (cancelAtPeriodEnd) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

          return await prisma.subscription.update({
            where: { id: subscription.id },
            data: { cancelAtPeriodEnd: true }
          });
        } else {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

          return await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'canceled',
              canceledAt: new Date()
            }
          });
        }
      }

      return subscription;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw new Error('Impossible d\'annuler l\'abonnement');
    }
  }

  /**
   * Synchronise les données depuis Stripe
   */
  async syncFromStripe(companyId: number): Promise<Subscription | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: { companyId }
      });
      if (!subscription?.stripeSubscriptionId) {
        return null;
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status as any,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
          currentPeriodStart: new Date(((stripeSubscription as any).current_period_start || 0) * 1000),
          currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end || 0) * 1000),
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
        }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      throw new Error('Impossible de synchroniser les données');
    }
  }

  /**
   * Traite les webhooks Stripe
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Webhook non géré: ${event.type}`);
      }
    } catch (error) {
      console.error(`Erreur lors du traitement du webhook ${event.type}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const companyId = stripeSubscription.metadata.companyId;
    if (!companyId) return;

    const existingSubscription = await prisma.subscription.findFirst({
      where: { companyId }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          status: stripeSubscription.status as any,
          currentPeriodStart: new Date(((stripeSubscription as any).current_period_start || 0) * 1000),
          currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end || 0) * 1000),
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          companyId,
          stripeCustomerId: stripeSubscription.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          plan: stripeSubscription.metadata.plan || 'standard',
          status: stripeSubscription.status,
          currentPeriodStart: new Date(((stripeSubscription as any).current_period_start || 0) * 1000),
          currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end || 0) * 1000),
        }
      });
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status as any,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
          currentPeriodStart: new Date(((stripeSubscription as any).current_period_start || 0) * 1000),
          currentPeriodEnd: new Date(((stripeSubscription as any).current_period_end || 0) * 1000),
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
        }
      });
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        }
      });

      // Repasser la company en plan gratuit
      await prisma.company.update({
        where: { id: subscription.companyId },
        data: { plan: 'free' }
      });
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: (invoice as any).subscription }
    });

    if (subscription && (invoice as any).payment_intent) {
      await prisma.payment.create({
        data: {
          companyId: subscription.companyId,
          subscriptionId: subscription.id,
          stripePaymentIntentId: (invoice as any).payment_intent as string,
          stripeCustomerId: invoice.customer as string,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          type: 'subscription',
          description: invoice.description || `Paiement abonnement ${subscription.plan}`,
          receiptUrl: invoice.hosted_invoice_url,
          stripeCreatedAt: new Date(invoice.created * 1000),
        }
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!(invoice as any).subscription) return;

    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: (invoice as any).subscription }
    });

    if (subscription && (invoice as any).payment_intent) {
      await prisma.payment.create({
        data: {
          companyId: subscription.companyId,
          subscriptionId: subscription.id,
          stripePaymentIntentId: (invoice as any).payment_intent as string,
          stripeCustomerId: invoice.customer as string,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          type: 'subscription',
          description: invoice.description || `Échec paiement abonnement ${subscription.plan}`,
          failureReason: 'Paiement refusé',
          stripeCreatedAt: new Date(invoice.created * 1000),
        }
      });
    }
  }
}

export const stripeService = new StripeService();
