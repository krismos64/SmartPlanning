# Intégration Stripe - SmartPlanning v2.0.0

## 📊 Vue d'ensemble

L'intégration Stripe dans SmartPlanning permet la gestion complète des abonnements SaaS avec paiements récurrents, gestion des plans, et webhooks pour la synchronisation automatique.

### ✅ Fonctionnalités implémentées

- **Checkout Sessions** : Paiement sécurisé via Stripe Checkout
- **Gestion d'abonnements** : Création, mise à jour, annulation
- **Plans tarifaires** : Free, Standard, Premium, Enterprise
- **Webhooks** : Synchronisation automatique des événements Stripe
- **Historique des paiements** : Suivi complet des transactions
- **Dashboard de facturation** : Interface utilisateur complète
- **Validation Zod** : Validation stricte des données de paiement

## 🏗️ Architecture

### Backend (Node.js + TypeScript)

```
backend/src/
├── config/
│   └── stripe.config.ts         # Configuration Stripe + validation
├── models/
│   ├── Subscription.model.ts    # Modèle des abonnements
│   └── Payment.model.ts         # Modèle des paiements
├── schemas/
│   └── payment.schemas.ts       # Validation Zod
├── services/
│   └── stripe.service.ts        # Logique métier Stripe
├── controllers/
│   └── stripe.controller.ts     # Contrôleurs API
└── routes/
    └── stripe.routes.ts         # Routes API
```

### Frontend (React + TypeScript)

```
frontend/src/
├── config/
│   └── stripe.config.ts         # Configuration client + plans
├── services/
│   └── stripe.service.ts        # API calls vers le backend
└── components/billing/
    ├── BillingDashboard.tsx     # Dashboard principal
    ├── PricingCard.tsx          # Cartes de prix
    └── PaymentHistory.tsx       # Historique des paiements
```

## 🔧 Configuration

### Variables d'environnement Backend

```bash
# STRIPE CONFIGURATION
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_FREE=price_free_plan_id
STRIPE_PRICE_STANDARD=price_standard_plan_id
STRIPE_PRICE_PREMIUM=price_premium_plan_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_plan_id
```

### Variables d'environnement Frontend

```bash
# STRIPE CONFIGURATION
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 📦 Modèles de données

### Subscription Model

```typescript
interface ISubscription {
  companyId: ObjectId;           // Référence vers l'entreprise
  stripeCustomerId: string;      // ID client Stripe
  stripeSubscriptionId?: string; // ID abonnement Stripe
  stripePriceId?: string;        // ID prix Stripe
  plan: 'free' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | ...;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
}
```

### Payment Model

```typescript
interface IPayment {
  companyId: ObjectId;
  subscriptionId?: ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amount: number;                // Montant en centimes
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | ...;
  type: 'subscription' | 'setup' | 'invoice' | 'one_time';
  description?: string;
  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
  stripeCreatedAt: Date;
}
```

## 🛣️ Routes API

### Routes protégées (authentification requise)

```
POST   /api/stripe/create-checkout-session  # Créer session checkout
GET    /api/stripe/subscription             # Récupérer abonnement actuel
PUT    /api/stripe/subscription             # Mettre à jour abonnement
DELETE /api/stripe/subscription             # Annuler abonnement
GET    /api/stripe/payments                 # Historique des paiements
POST   /api/stripe/sync                     # Synchroniser depuis Stripe
GET    /api/stripe/billing                  # Informations de facturation
```

### Routes publiques (Webhooks)

```
POST   /api/stripe/webhook                  # Traitement des webhooks Stripe
```

## 🔄 Webhooks Stripe

### Événements gérés

- `customer.subscription.created` : Création d'abonnement
- `customer.subscription.updated` : Mise à jour d'abonnement
- `customer.subscription.deleted` : Suppression d'abonnement
- `invoice.payment_succeeded` : Paiement réussi
- `invoice.payment_failed` : Paiement échoué

### Configuration Webhook

1. **Créer l'endpoint** dans le dashboard Stripe :
   ```
   URL: https://votre-domaine.com/api/stripe/webhook
   ```

2. **Événements à écouter** :
   ```
   customer.subscription.created
   customer.subscription.updated
   customer.subscription.deleted
   invoice.payment_succeeded
   invoice.payment_failed
   ```

3. **Récupérer le secret** et l'ajouter à `STRIPE_WEBHOOK_SECRET`

## 💳 Plans tarifaires

```typescript
export const PRICING_PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    features: ['Jusqu\'à 5 employés', 'Planning manuel', ...]
  },
  standard: {
    name: 'Standard', 
    price: 29,
    features: ['Jusqu\'à 25 employés', 'Planning IA', ...]
  },
  premium: {
    name: 'Premium',
    price: 79,
    features: ['Jusqu\'à 100 employés', 'API complète', ...]
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    features: ['Employés illimités', 'Support dédié', ...]
  }
};
```

## 🔐 Sécurité

### Validation des données

- **Validation Zod** : Toutes les données d'entrée sont validées
- **Signature des webhooks** : Vérification automatique avec le secret Stripe
- **Authentification** : Toutes les routes (sauf webhooks) nécessitent une authentification
- **Isolation des données** : Chaque entreprise ne peut voir que ses propres données

### Bonnes pratiques implémentées

- **Gestion d'erreurs** : Try-catch complets avec logs détaillés
- **Types TypeScript** : Typage strict pour éviter les erreurs
- **Validation côté client et serveur** : Double validation pour la sécurité
- **Pas de stockage de données sensibles** : Seuls les IDs Stripe sont stockés

## 🚀 Utilisation

### 1. Créer une session de checkout

```typescript
// Frontend
const session = await stripeService.createCheckoutSession('premium');
const stripe = await getStripe();
await stripe.redirectToCheckout({ sessionId: session.sessionId });
```

### 2. Récupérer l'abonnement actuel

```typescript
const subscription = await stripeService.getCurrentSubscription();
```

### 3. Mettre à jour le plan

```typescript
await stripeService.updateSubscription('enterprise');
```

### 4. Annuler l'abonnement

```typescript
await stripeService.cancelSubscription(true); // Annule à la fin de la période
```

## 🧪 Tests et développement

### Tests locaux avec Stripe CLI

1. **Installer Stripe CLI**
2. **Se connecter** : `stripe login`
3. **Redirection des webhooks** :
   ```bash
   stripe listen --forward-to localhost:5050/api/stripe/webhook
   ```
4. **Trigger des événements de test** :
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Variables de test

```bash
# Clés de test Stripe (commencent par sk_test_ et pk_test_)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📈 Monitoring et observabilité

### Logs disponibles

- **Création de sessions** : Log avec ID de session et plan choisi
- **Webhooks** : Log de tous les événements reçus et traités
- **Erreurs** : Logs détaillés avec stack traces
- **Synchronisation** : Logs des opérations de sync

### Métriques collectées

- **Revenus totaux** par entreprise
- **Nombre de paiements** réussis/échoués
- **Taux de conversion** par plan
- **Abandons de checkout** (via webhooks)

## 🔧 Maintenance et déploiement

### Mise à jour des prix

1. **Modifier les prix** dans le dashboard Stripe
2. **Mettre à jour** les variables d'environnement `STRIPE_PRICE_*`
3. **Redéployer** l'application

### Migration de données

- **Cascade deletion** : Suppression automatique des abonnements et paiements lors de la suppression d'une entreprise
- **Validation des références** : Vérification de l'intégrité des données lors des opérations

### Gestion des erreurs courantes

- **Webhook dupliqués** : Idempotence automatique
- **Timeouts** : Retry automatique avec backoff
- **Échecs de paiement** : Notification et gestion gracieuse

## 🎯 Prochaines améliorations possibles

- [ ] **Coupons et promotions** : Gestion des codes promo
- [ ] **Essais gratuits** : Périodes d'essai configurables
- [ ] **Facturation par usage** : Facturation basée sur le nombre d'employés
- [ ] **Multi-devises** : Support international
- [ ] **Rapports avancés** : Analytics détaillés des revenus
- [ ] **API publique** : Endpoints pour intégrations tierces

---

## ✅ Réalisation validée par Context7

✅ **Réponse validée via Context7** (documentation officielle Stripe Node.js v18)

Cette intégration suit les **bonnes pratiques Stripe 2025** avec :
- API version `2025-07-30.basil` (dernière version stable)
- Gestion moderne des webhooks
- Checkout Sessions pour les abonnements
- Validation complète des signatures
- Architecture découplée optimale