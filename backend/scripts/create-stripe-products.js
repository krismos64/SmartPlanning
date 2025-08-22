#!/usr/bin/env node

/**
 * Script pour créer automatiquement les produits et prix Stripe
 * SmartPlanning v2.0.0 - Nouveaux tarifs
 */

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialisation Stripe avec les clés de test
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

console.log(`
🚀 Création automatique des produits Stripe
===========================================

Configuration SmartPlanning v2.0.0 :
✅ Starter: 39€/mois
✅ Professional: 89€/mois  
✅ Enterprise: 179€/mois

Création en cours...
`);

const products = [
  {
    name: 'SmartPlanning Starter',
    description: 'Planification intelligente pour petites équipes - Jusqu\'à 25 employés',
    price: 3900, // 39€ en centimes
    envKey: 'STRIPE_PRICE_STANDARD',
    features: [
      'Jusqu\'à 25 employés',
      'Planning automatique IA',
      'Gestion des congés',
      'Support prioritaire',
      'Rapports avancés'
    ]
  },
  {
    name: 'SmartPlanning Professional', 
    description: 'Fonctionnalités avancées pour moyennes entreprises - Jusqu\'à 100 employés',
    price: 8900, // 89€ en centimes
    envKey: 'STRIPE_PRICE_PREMIUM',
    features: [
      'Jusqu\'à 100 employés',
      'Toutes les fonctionnalités Starter',
      'API complète',
      'Intégrations avancées',
      'Formation personnalisée',
      'Support téléphonique'
    ]
  },
  {
    name: 'SmartPlanning Enterprise',
    description: 'Solution complète pour grandes organisations - Employés illimités',
    price: 17900, // 179€ en centimes
    envKey: 'STRIPE_PRICE_ENTERPRISE', 
    features: [
      'Employés illimités',
      'Toutes les fonctionnalités Professional',
      'Déploiement sur site',
      'SLA garanti',
      'Support dédié',
      'Développements sur mesure'
    ]
  }
];

async function createStripeProducts() {
  const results = [];
  
  for (const productData of products) {
    try {
      console.log(`\n📦 Création du produit: ${productData.name}`);
      
      // 1. Créer le produit
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          app: 'SmartPlanning',
          version: '2.0.0',
          features: productData.features.join(', ')
        }
      });
      
      console.log(`   ✅ Produit créé: ${product.id}`);
      
      // 2. Créer le prix récurrent
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: 'eur',
        recurring: {
          interval: 'month',
          interval_count: 1
        },
        metadata: {
          plan: productData.envKey.replace('STRIPE_PRICE_', '').toLowerCase(),
          app: 'SmartPlanning'
        }
      });
      
      console.log(`   ✅ Prix créé: ${price.id} (${productData.price/100}€/mois)`);
      
      results.push({
        product,
        price,
        envKey: productData.envKey,
        priceId: price.id
      });
      
    } catch (error) {
      console.error(`   ❌ Erreur pour ${productData.name}:`, error.message);
    }
  }
  
  return results;
}

async function updateEnvFile(results) {
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log(`\n🔧 Mise à jour du fichier .env...`);
  
  results.forEach(result => {
    const regex = new RegExp(`${result.envKey}=.*`, 'g');
    envContent = envContent.replace(regex, `${result.envKey}=${result.priceId}`);
    console.log(`   ✅ ${result.envKey}=${result.priceId}`);
  });
  
  fs.writeFileSync(envPath, envContent);
  console.log(`   ✅ Fichier .env mis à jour`);
}

async function main() {
  try {
    // Vérifier les clés Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY manquante dans .env');
    }
    
    // Créer les produits et prix
    const results = await createStripeProducts();
    
    if (results.length === 0) {
      console.log('❌ Aucun produit créé');
      process.exit(1);
    }
    
    // Mettre à jour le .env
    await updateEnvFile(results);
    
    console.log(`
✅ Configuration Stripe terminée !

📋 Résumé des produits créés :
${results.map(r => `• ${r.product.name}: ${r.priceId}`).join('\n')}

🚀 Prochaines étapes :
1. Redémarrez vos serveurs backend et frontend
2. Configurez le webhook : stripe listen --forward-to localhost:5050/api/stripe/webhook
3. Testez un paiement complet

🎯 Votre SaaS SmartPlanning est maintenant prêt pour la monétisation !
`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    process.exit(1);
  }
}

main();