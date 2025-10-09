import { Request, Response } from 'express';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe.config';
import { stripeService } from '../services/stripe.service';
import prisma from '../config/prisma';

/**
 * Crée une session de checkout Stripe
 */
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user?.companyId || !user.company) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const session = await stripeService.createCheckoutSession(
      user.companyId,
      plan,
      user.email,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Erreur checkout session:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur interne du serveur',
    });
  }
};

/**
 * Récupère l'abonnement actuel de l'entreprise
 */
export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: user.companyId }
    });

    if (!subscription) {
      // Créer un abonnement gratuit par défaut
      const newSubscription = await prisma.subscription.create({
        data: {
          companyId: user.companyId,
          stripeCustomerId: `temp_${user.companyId}`, // Temporaire jusqu'à création client Stripe
          plan: 'free',
          status: 'active',
        }
      });

      res.json({
        success: true,
        subscription: newSubscription,
      });
      return;
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'abonnement',
    });
  }
};

/**
 * Met à jour l'abonnement (changement de plan)
 */
export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, cancelAtPeriodEnd } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const updatedSubscription = await stripeService.updateSubscription(
      user.companyId,
      plan,
      cancelAtPeriodEnd
    );

    res.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
    });
  }
};

/**
 * Annule l'abonnement
 */
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const canceledSubscription = await stripeService.cancelSubscription(
      user.companyId,
      cancelAtPeriodEnd
    );

    res.json({
      success: true,
      subscription: canceledSubscription,
    });
  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
    });
  }
};

/**
 * Récupère l'historique des paiements
 */
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = 20, offset = 0, status, type } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const filter: any = { companyId: user.companyId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const payments = await prisma.payment.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.payment.count({ where: filter });

    res.json({
      success: true,
      payments,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + payments.length < total,
      },
    });
  } catch (error) {
    console.error('Erreur historique paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
    });
  }
};

/**
 * Synchronise les données depuis Stripe
 */
export const syncSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const subscription = await stripeService.syncFromStripe(user.companyId);

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Erreur synchronisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation',
    });
  }
};

/**
 * Traite les webhooks Stripe
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Signature manquante' });
      return;
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Erreur de vérification de signature webhook:', error);
      res.status(400).json({ error: 'Signature invalide' });
      return;
    }

    // Traiter l'événement via le service
    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    res.status(500).json({
      error: 'Erreur lors du traitement du webhook',
    });
  }
};

/**
 * Récupère les informations de facturation
 */
export const getBillingInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.companyId) {
      res.status(404).json({ message: 'Entreprise non trouvée' });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: user.companyId }
    });
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    });

    // Statistiques des paiements
    const totalSucceeded = await prisma.payment.aggregate({
      where: {
        companyId: user.companyId,
        status: 'succeeded'
      },
      _sum: { amount: true },
      _count: true,
    });

    const totalRefunded = await prisma.payment.aggregate({
      where: {
        companyId: user.companyId,
        status: 'refunded'
      },
      _sum: { amount: true },
    });

    // Prochain paiement prévu
    const nextPayment = subscription?.currentPeriodEnd && (subscription.status === 'active' || subscription.status === 'trialing')
      ? subscription.currentPeriodEnd
      : null;

    res.json({
      success: true,
      billing: {
        company: {
          name: company?.name,
          plan: company?.plan || 'free',
        },
        subscription: subscription || null,
        nextPayment,
        paymentStats: {
          totalRevenue: (totalSucceeded._sum.amount || 0) / 100, // Convertir en euros
          totalRefunded: (totalRefunded._sum.amount || 0) / 100,
          totalPayments: totalSucceeded._count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Erreur informations facturation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations de facturation',
    });
  }
};
