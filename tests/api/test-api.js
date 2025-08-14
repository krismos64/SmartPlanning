const axios = require('axios');

// Fonction pour tester l'API
async function testAPI() {
  try {
    // Test simple du health check
    const healthResponse = await axios.get('http://localhost:5050/api/health');
    console.log('Health check OK:', healthResponse.data);
    
    // Test de l'endpoint sans auth (devrait retourner 401/403)
    try {
      const aiResponse = await axios.get('http://localhost:5050/api/ai/generated-schedules');
      console.log('AI endpoint response:', aiResponse.data);
    } catch (error) {
      console.log('AI endpoint error (attendu):', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testAPI();