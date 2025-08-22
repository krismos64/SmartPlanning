import express from 'express';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  createCheckoutSession,
  getCurrentSubscription,
  updateSubscription,
  cancelSubscription,
  getPaymentHistory,
  syncSubscription,
  handleWebhook,
  getBillingInfo,
} from '../controllers/stripe.controller';
import {
  createCheckoutSessionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  paymentFilterSchema,
} from '../schemas/payment.schemas';

const router = express.Router();

// ============================================
// ROUTES PUBLIQUES (Webhooks)
// ============================================

/**
 * @route POST /api/stripe/webhook
 * @desc Traite les webhooks Stripe
 * @access Public (avec validation de signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// ============================================
// ROUTES PROTÉGÉES (Authentification requise)
// ============================================

// Middleware d'authentification pour toutes les routes suivantes
router.use(authenticateToken);

/**
 * @route POST /api/stripe/create-checkout-session
 * @desc Crée une session de checkout Stripe
 * @access Private
 */
router.post(
  '/create-checkout-session',
  validateRequest({
    body: createCheckoutSessionSchema,
    schemaName: 'stripe.createCheckoutSession',
  }),
  createCheckoutSession
);

/**
 * @route GET /api/stripe/subscription
 * @desc Récupère l'abonnement actuel de l'entreprise
 * @access Private
 */
router.get('/subscription', getCurrentSubscription);

/**
 * @route PUT /api/stripe/subscription
 * @desc Met à jour l'abonnement (changement de plan)
 * @access Private
 */
router.put(
  '/subscription',
  validateRequest({
    body: updateSubscriptionSchema,
    schemaName: 'stripe.updateSubscription',
  }),
  updateSubscription
);

/**
 * @route DELETE /api/stripe/subscription
 * @desc Annule l'abonnement
 * @access Private
 */
router.delete(
  '/subscription',
  validateRequest({
    body: cancelSubscriptionSchema,
    schemaName: 'stripe.cancelSubscription',
  }),
  cancelSubscription
);

/**
 * @route GET /api/stripe/payments
 * @desc Récupère l'historique des paiements
 * @access Private
 */
router.get(
  '/payments',
  validateRequest({
    query: paymentFilterSchema,
    schemaName: 'stripe.paymentFilter',
  }),
  getPaymentHistory
);

/**
 * @route POST /api/stripe/sync
 * @desc Synchronise les données depuis Stripe
 * @access Private
 */
router.post('/sync', syncSubscription);

/**
 * @route GET /api/stripe/billing
 * @desc Récupère les informations de facturation complètes
 * @access Private
 */
router.get('/billing', getBillingInfo);

export default router;