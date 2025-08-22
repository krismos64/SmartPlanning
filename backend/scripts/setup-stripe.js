#!/usr/bin/env node

/**
 * Script de configuration Stripe pour SmartPlanning
 * Automatise la création des produits et prix dans Stripe
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
🚀 Configuration Stripe pour SmartPlanning v2.0.0
==================================================

Ce script va vous guider pour configurer Stripe avec vos produits et prix.

1. Assurez-vous d'être connecté à votre dashboard Stripe : https://dashboard.stripe.com/test
2. Ayez vos IDs de prix sous la main
3. Installez Stripe CLI : brew install stripe/stripe-cli/stripe

`);

const questions = [
  {
    key: 'STRIPE_PRICE_STANDARD',
    question: 'ID du prix Starter (39€/mois) - commence par price_: ',
    validate: (value) => value.startsWith('price_')
  },
  {
    key: 'STRIPE_PRICE_PREMIUM', 
    question: 'ID du prix Professional (89€/mois) - commence par price_: ',
    validate: (value) => value.startsWith('price_')
  },
  {
    key: 'STRIPE_PRICE_ENTERPRISE',
    question: 'ID du prix Enterprise (179€/mois) - commence par price_: ', 
    validate: (value) => value.startsWith('price_')
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    question: 'Secret du webhook (obtenez-le via "stripe listen") - commence par whsec_: ',
    validate: (value) => value.startsWith('whsec_')
  }
];

let answers = {};
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion >= questions.length) {
    updateEnvFile();
    return;
  }

  const q = questions[currentQuestion];
  rl.question(q.question, (answer) => {
    if (!q.validate(answer)) {
      console.log(`❌ Format invalide. ${q.key} doit commencer par ${q.key.includes('WEBHOOK') ? 'whsec_' : 'price_'}`);
      askQuestion();
      return;
    }

    answers[q.key] = answer;
    currentQuestion++;
    askQuestion();
  });
}

function updateEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  Object.keys(answers).forEach(key => {
    const regex = new RegExp(`${key}=.*`, 'g');
    envContent = envContent.replace(regex, `${key}=${answers[key]}`);
  });

  fs.writeFileSync(envPath, envContent);
  
  console.log(`
✅ Configuration mise à jour dans .env

📋 Résumé :
- Starter (39€/mois): ${answers.STRIPE_PRICE_STANDARD}
- Professional (89€/mois): ${answers.STRIPE_PRICE_PREMIUM}  
- Enterprise (179€/mois): ${answers.STRIPE_PRICE_ENTERPRISE}
- Webhook: ${answers.STRIPE_WEBHOOK_SECRET}

🚀 Prochaines étapes :
1. Redémarrez votre serveur backend
2. Démarrez l'écoute des webhooks : stripe listen --forward-to localhost:5050/api/stripe/webhook
3. Testez un paiement via l'interface

`);

  rl.close();
}

askQuestion();