import { loadStripe, Stripe } from '@stripe/stripe-js';

// Récupération de la clé publique Stripe depuis les variables d'environnement
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('❌ VITE_STRIPE_PUBLISHABLE_KEY is required');
}

// Instance Stripe (chargée de manière lazy)
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialise et retourne l'instance Stripe
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Configuration des URLs de redirection
export const STRIPE_URLS = {
  success: `${window.location.origin}/dashboard/billing?success=true`,
  cancel: `${window.location.origin}/dashboard/billing?canceled=true`,
};

// Plans disponibles avec leurs informations d'affichage
export const PRICING_PLANS = {
  free: {
    name: 'Gratuit',
    description: 'Pour commencer',
    price: 0,
    currency: '€',
    interval: 'mois',
    features: [
      'Jusqu\'à 5 employés',
      'Planning manuel',
      'Support email',
      'Fonctionnalités de base',
    ],
    popular: false,
    stripePriceId: null,
  },
  standard: {
    name: 'Standard',
    description: 'Pour les petites équipes',
    price: 29,
    currency: '€',
    interval: 'mois',
    features: [
      'Jusqu\'à 25 employés',
      'Planning automatique IA',
      'Gestion des congés',
      'Support prioritaire',
      'Rapports avancés',
    ],
    popular: true,
    stripePriceId: 'price_standard_plan_id',
  },
  premium: {
    name: 'Premium',
    description: 'Pour les moyennes entreprises',
    price: 79,
    currency: '€',
    interval: 'mois',
    features: [
      'Jusqu\'à 100 employés',
      'Toutes les fonctionnalités Standard',
      'API complète',
      'Intégrations avancées',
      'Formation personnalisée',
      'Support téléphonique',
    ],
    popular: false,
    stripePriceId: 'price_premium_plan_id',
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Pour les grandes organisations',
    price: 199,
    currency: '€',
    interval: 'mois',
    features: [
      'Employés illimités',
      'Toutes les fonctionnalités Premium',
      'Déploiement sur site',
      'SLA garanti',
      'Support dédié',
      'Développements sur mesure',
    ],
    popular: false,
    stripePriceId: 'price_enterprise_plan_id',
  },
} as const;

// Types TypeScript
export type PricingPlan = keyof typeof PRICING_PLANS;

/**
 * Vérifie si un plan est un plan payant
 */
export const isPaidPlan = (plan: PricingPlan): boolean => {
  return plan !== 'free';
};

/**
 * Retourne les informations d'un plan
 */
export const getPlanInfo = (plan: PricingPlan) => {
  return PRICING_PLANS[plan];
};

/**
 * Formate le prix d'un plan
 */
export const formatPlanPrice = (plan: PricingPlan): string => {
  const planInfo = PRICING_PLANS[plan];
  if (planInfo.price === 0) {
    return 'Gratuit';
  }
  return `${planInfo.price}${planInfo.currency}/${planInfo.interval}`;
};

export default getStripe;