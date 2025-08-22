# 🧪 Guide de Test - Intégration Stripe SmartPlanning

## 📋 Pré-requis

- [ ] Produits et prix créés dans Stripe Dashboard
- [ ] IDs de prix mis à jour dans `.env`
- [ ] Stripe CLI installé : `brew install stripe/stripe-cli/stripe`
- [ ] Webhook secret configuré
- [ ] Serveurs backend et frontend démarrés

## 🚀 Procédure de Test Complète

### 1. **Démarrage des Services**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - Webhook Listener
stripe listen --forward-to localhost:5050/api/stripe/webhook
```

### 2. **Test du Flow Utilisateur**

#### **Étape 1 : Inscription**
- [ ] Aller sur `http://localhost:5173/inscription`
- [ ] Créer un nouveau compte test
- [ ] Vérifier la redirection vers `/complete-profile`

#### **Étape 2 : Complétion du Profil**
- [ ] Remplir les informations de profil
- [ ] Vérifier la redirection vers `/choose-plan`

#### **Étape 3 : Sélection du Plan**
- [ ] Vérifier l'affichage des 4 plans (Free, Starter 39€, Professional 89€, Enterprise 179€)
- [ ] Vérifier le design futuriste cohérent avec la landing page
- [ ] Cliquer sur "Choisir" pour un plan payant

#### **Étape 4 : Paiement Stripe**
- [ ] Vérifier la redirection vers Stripe Checkout
- [ ] Utiliser les données de test Stripe :
  - **Carte valide** : 4242 4242 4242 4242
  - **Carte déclinée** : 4000 0000 0000 0002
  - **Date** : n'importe quelle date future
  - **CVC** : n'importe quel 3 chiffres

#### **Étape 5 : Retour et Webhook**
- [ ] Vérifier le retour sur `/dashboard` après paiement réussi
- [ ] Vérifier dans le terminal webhook la réception des événements
- [ ] Vérifier en base que la subscription est créée

### 3. **Vérifications en Base de Données**

```javascript
// Dans MongoDB Compass ou via CLI
use smartplanning

// Vérifier la subscription créée
db.subscriptions.find().pretty()

// Vérifier le payment enregistré  
db.payments.find().pretty()

// Vérifier la company mise à jour
db.companies.find({subscriptionPlan: {$ne: "free"}}).pretty()
```

### 4. **Test des Fonctionnalités Billing**

#### **Dashboard Billing**
- [ ] Aller sur `/dashboard/billing`
- [ ] Vérifier l'affichage du plan actuel
- [ ] Vérifier l'historique des paiements
- [ ] Vérifier la date de prochain prélèvement

#### **Changement de Plan**
- [ ] Tester la montée de plan (Standard → Premium)
- [ ] Tester la descente de plan (Premium → Standard)
- [ ] Vérifier que les changements sont effectifs immédiatement

#### **Annulation**
- [ ] Tester l'annulation de l'abonnement
- [ ] Vérifier que `cancelAtPeriodEnd = true`
- [ ] Vérifier que l'accès reste jusqu'à la fin de période

### 5. **Test des Cartes de Test Stripe**

| Numéro de Carte | Résultat Attendu |
|------------------|------------------|
| 4242 4242 4242 4242 | Paiement réussi |
| 4000 0000 0000 0002 | Carte déclinée |
| 4000 0000 0000 9995 | Fonds insuffisants |
| 4000 0000 0000 9987 | Code CVC incorrect |
| 4242 4242 4242 4241 | Numéro invalide |

### 6. **Événements Webhook à Surveiller**

Dans le terminal Stripe CLI, vérifiez ces événements :

- [ ] `customer.created` - Client créé
- [ ] `checkout.session.completed` - Paiement réussi
- [ ] `invoice.payment_succeeded` - Facture payée
- [ ] `customer.subscription.created` - Abonnement créé
- [ ] `customer.subscription.updated` - Abonnement modifié
- [ ] `customer.subscription.deleted` - Abonnement annulé

### 7. **Tests d'Erreur**

#### **Erreurs de Configuration**
- [ ] Tester avec un mauvais price_id
- [ ] Tester avec un webhook secret incorrect
- [ ] Tester avec des clés API expirées

#### **Erreurs de Paiement**
- [ ] Carte expirée
- [ ] Carte déclinée
- [ ] Montant insuffisant
- [ ] Vérifier la gestion d'erreur côté frontend

### 8. **Validation Final**

#### **Base de Données**
- [ ] Aucune subscription orpheline
- [ ] Cohérence entre Company.subscriptionPlan et Subscription.plan
- [ ] Historique des payments complet

#### **Interface Utilisateur**
- [ ] Toutes les informations s'affichent correctement
- [ ] Animations et design cohérents
- [ ] Messages d'erreur informatifs
- [ ] Redirections fluides

#### **Logs et Monitoring**
- [ ] Aucune erreur dans les logs backend
- [ ] Aucune erreur dans la console browser
- [ ] Webhooks traités sans erreur
- [ ] Métriques Stripe correctes

## 🐛 Résolution de Problèmes

### **Webhook ne fonctionne pas**
```bash
# Vérifier que Stripe CLI écoute
stripe listen --forward-to localhost:5050/api/stripe/webhook

# Vérifier le secret dans .env
echo $STRIPE_WEBHOOK_SECRET
```

### **Paiement échoue**
```bash
# Vérifier les prix dans le dashboard Stripe
stripe prices list

# Vérifier les logs de l'API
tail -f backend/logs/app.log
```

### **Subscription non créée**
```javascript
// Vérifier dans MongoDB
db.subscriptions.find({companyId: ObjectId("COMPANY_ID")})

// Vérifier les webhooks Stripe
// Dashboard → Développeurs → Webhooks → Voir les tentatives
```

## ✅ Checklist de Validation

- [ ] Inscription → Profil → Plan → Paiement → Dashboard (flow complet)
- [ ] Webhooks reçus et traités correctement
- [ ] Base de données cohérente
- [ ] Interface utilisateur sans erreur
- [ ] Tests avec cartes valides et invalides
- [ ] Gestion d'erreurs fonctionnelle
- [ ] Performance acceptable (<2s pour checkout)
- [ ] Design cohérent avec l'identité visuelle

## 📊 Métriques à Surveiller

- **Temps de réponse** API Stripe < 1s
- **Taux de succès** webhooks > 99%
- **Temps de redirection** Checkout < 2s
- **Cohérence** données 100%

---

🎯 **Objectif** : Validation complète de l'intégration Stripe avant mise en production