/**
 * Script de test pour vérifier la récupération des plannings IA
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5050/api';
const TEST_USER_EMAIL = 'directeur@test.fr'; // Utiliser le directeur pour les tests
const TEST_USER_PASSWORD = 'Test123!'; // Mot de passe du directeur

async function testPlanningValidation() {
  try {
    console.log('🔐 Connexion en tant que directeur...');
    
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
    
    console.log('📋 Réponse API:', {
      success: planningsResponse.data.success,
      message: planningsResponse.data.message,
      dataLength: planningsResponse.data.data ? planningsResponse.data.data.length : 0
    });
    
    if (planningsResponse.data.success) {
      console.log('✅ Plannings récupérés:', planningsResponse.data.data.length);
      
      if (planningsResponse.data.data.length > 0) {
        console.log('📋 Premier planning:', {
          id: planningsResponse.data.data[0]._id,
          employeeName: `${planningsResponse.data.data[0].employee.firstName} ${planningsResponse.data.data[0].employee.lastName}`,
          status: planningsResponse.data.data[0].status,
          teamName: planningsResponse.data.data[0].teamName
        });
      } else {
        console.log('⚠️ Aucun planning trouvé');
        
        // 3. Vérifier s'il y a des plannings IA dans la base
        console.log('🔍 Vérification des plannings IA en base...');
        
        const allPlanningsResponse = await axios.get(`${API_BASE_URL}/ai/generated-schedules`, {
          headers
        });
        
        console.log('📋 Tous les plannings IA:', {
          success: allPlanningsResponse.data.success,
          count: allPlanningsResponse.data.data ? allPlanningsResponse.data.data.length : 0
        });
      }
    } else {
      console.error('❌ Erreur API:', planningsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Réponse du serveur:', error.response.data);
    }
  }
}

// Exécuter le test
testPlanningValidation();