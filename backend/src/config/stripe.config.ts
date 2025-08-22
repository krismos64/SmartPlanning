import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Vérification des variables d'environnement requises
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

// Configuration Stripe avec validation stricte
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil', // Version API Stripe actuelle
  maxNetworkRetries: 3,
  timeout: 10000, // 10 secondes
  telemetry: true, // Pour améliorer les performances API
  appInfo: {
    name: 'SmartPlanning SaaS',
    version: '2.0.0',
    url: 'https://smartplanning.fr',
  },
});

// Configuration des prix par plan
export const STRIPE_PRICES = {
  FREE: process.env.STRIPE_PRICE_FREE || '',
  STANDARD: process.env.STRIPE_PRICE_STANDARD || '',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || '',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || '',
} as const;

// Mapping des plans SmartPlanning vers les prix Stripe
export const PLAN_TO_PRICE: Record<string, string> = {
  free: STRIPE_PRICES.FREE,
  standard: STRIPE_PRICES.STANDARD,
  premium: STRIPE_PRICES.PREMIUM,
  enterprise: STRIPE_PRICES.ENTERPRISE,
};

// Configuration des webhooks
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Clé publique pour le frontend
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// Types de plans supportés
export type StripePlan = keyof typeof STRIPE_PRICES;

// Validation de la configuration
export const validateStripeConfig = (): boolean => {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`❌ Variable d'environnement manquante: ${varName}`);
      return false;
    }
  }

  console.log('✅ Configuration Stripe validée');
  return true;
};

export default stripe;