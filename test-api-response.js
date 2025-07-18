/**
 * Script pour tester la réponse de l'API des plannings IA
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5050/api';
const TEST_USER_EMAIL = 'admin@smartplanning.fr'; // Utiliser l'admin car on sait qu'il fonctionne
const TEST_USER_PASSWORD = 'Admin123!'; // Mot de passe de l'admin

async function testApiResponse() {
  try {
    console.log('🔐 Connexion en tant qu\'admin...');
    
    // 1. Connexion
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Échec de la connexion: ' + loginResponse.data.message);
    }
    
    console.log('✅ Connexion réussie:', loginResponse.data.user.role);
    
    // 2. Récupération des plannings IA
    const token = loginResponse.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('📊 Récupération des plannings IA...');
    
    const planningsResponse = await axios.get(`${API_BASE_URL}/ai/generated-schedules`, {
      params: { status: 'draft' },
      headers
    });
    
    console.log('📋 Structure de la réponse:');
    console.log(JSON.stringify(planningsResponse.data, null, 2));
    
    if (planningsResponse.data.success && planningsResponse.data.data.length > 0) {
      console.log('\n📋 Structure du premier planning:');
      console.log(JSON.stringify(planningsResponse.data.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Réponse du serveur:', error.response.data);
    }
  }
}

// Exécuter le test
testApiResponse();