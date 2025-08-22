import { z } from 'zod';

// Schéma pour la création d'une session de checkout
export const createCheckoutSessionSchema = z.object({
  plan: z.enum(['standard', 'premium', 'enterprise'], {
    required_error: 'Le plan est requis',
    invalid_type_error: 'Plan invalide',
  }),
  successUrl: z.string().url({
    message: 'URL de succès invalide',
  }).optional(),
  cancelUrl: z.string().url({
    message: 'URL d\'annulation invalide',
  }).optional(),
  metadata: z.record(z.string()).optional(),
});

// Schéma pour la mise à jour d'un abonnement
export const updateSubscriptionSchema = z.object({
  plan: z.enum(['free', 'standard', 'premium', 'enterprise'], {
    required_error: 'Le plan est requis',
    invalid_type_error: 'Plan invalide',
  }),
  cancelAtPeriodEnd: z.boolean().optional(),
  metadata: z.record(z.string()).optional(),
});

// Schéma pour l'annulation d'un abonnement
export const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
  cancelationReason: z.string().max(500, {
    message: 'La raison d\'annulation ne peut pas dépasser 500 caractères',
  }).optional(),
});

// Schéma pour la validation des webhooks Stripe
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().nullable(),
    idempotency_key: z.string().nullable(),
  }).nullable(),
});

// Schéma pour les paramètres de filtre des paiements
export const paymentFilterSchema = z.object({
  status: z.enum(['pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded']).optional(),
  type: z.enum(['subscription', 'setup', 'invoice', 'one_time']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Schéma pour les métadonnées personnalisées
export const paymentMetadataSchema = z.object({
  companyName: z.string().optional(),
  planUpgrade: z.boolean().optional(),
  promotionalCode: z.string().optional(),
  source: z.enum(['dashboard', 'api', 'webhook']).optional(),
}).strict();

// Types TypeScript dérivés des schémas Zod
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
export type PaymentMetadataInput = z.infer<typeof paymentMetadataSchema>;

// Schémas pour les réponses API
export const subscriptionResponseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  plan: z.enum(['free', 'standard', 'premium', 'enterprise']),
  status: z.enum([
    'incomplete',
    'incomplete_expired', 
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  ]),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.date().nullable(),
  trialEnd: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentResponseSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded']),
  type: z.enum(['subscription', 'setup', 'invoice', 'one_time']),
  description: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  createdAt: z.date(),
});

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;