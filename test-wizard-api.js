/**
 * Script de test pour l'API de génération de planning
 * Test l'endpoint /api/schedules/auto-generate
 */

const axios = require('axios');

async function testPlanningGeneration() {
  const API_URL = 'http://localhost:5050/api';
  
  try {
    // 1. D'abord se connecter pour obtenir un token
    console.log('🔐 Connexion...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'christophe.mostefaoui.dev@gmail.com',
      password: 'Mostefaoui2@@'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connecté avec succès');
    
    // 2. Préparer le payload de test
    const testPayload = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: '66902b4e8c2f4a3b1c123456', // ID fictif pour le test
          firstName: 'Test',
          lastName: 'Employee',
          contractHoursPerWeek: 35,
          preferences: {
            preferredDays: ['lundi', 'mardi', 'mercredi'],
            preferredHours: ['09:00-17:00'],
            allowSplitShifts: false,
            maxConsecutiveDays: 5
          }
        }
      ],
      companyConstraints: {
        openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        openHours: ['08:00-18:00'],
        minEmployeesPerSlot: 1,
        maxHoursPerDay: 8,
        minHoursPerDay: 4,
        mandatoryLunchBreak: true,
        lunchBreakDuration: 60
      }
    };
    
    // 3. Appeler l'API de génération (PREMIER APPEL - devrait être lent)
    console.log('🚀 Génération du planning (PREMIER APPEL - cache miss)...');
    const startTime1 = Date.now();
    const generateResponse1 = await axios.post(
      `${API_URL}/schedules/auto-generate`,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const duration1 = Date.now() - startTime1;
    console.log(`⏱️  Premier appel terminé en ${duration1}ms`);

    // 4. DEUXIÈME APPEL IDENTIQUE - devrait utiliser le cache Redis
    console.log('🚀 Génération du planning (DEUXIÈME APPEL - cache hit attendu)...');
    const startTime2 = Date.now();
    const generateResponse2 = await axios.post(
      `${API_URL}/schedules/auto-generate`,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const duration2 = Date.now() - startTime2;
    console.log(`⚡ Deuxième appel terminé en ${duration2}ms`);

    // Comparer les performances
    const speedup = ((duration1 - duration2) / duration1 * 100).toFixed(1);
    console.log(`📈 Amélioration performance: ${speedup}% (${duration1}ms → ${duration2}ms)`);
    
    // Utiliser la première réponse pour l'analyse
    const generateResponse = generateResponse1;
    
    console.log('✅ Planning généré avec succès !');
    console.log('📊 Résultat:', JSON.stringify(generateResponse.data, null, 2));
    
    // 4. Vérifier la structure de la réponse
    if (generateResponse.data.success) {
      console.log('✅ Structure de réponse valide');
      console.log(`📅 Semaine ${generateResponse.data.metadata.weekNumber}/${generateResponse.data.metadata.year}`);
      console.log(`👥 ${generateResponse.data.metadata.employeeCount} employé(s)`);
      
      if (generateResponse.data.metadata.stats) {
        console.log('📈 Statistiques:');
        console.log(`  - Heures totales: ${generateResponse.data.metadata.stats.totalHoursPlanned}h`);
        console.log(`  - Moyenne par employé: ${generateResponse.data.metadata.stats.averageHoursPerEmployee}h`);
        console.log(`  - Employés avec planning complet: ${generateResponse.data.metadata.stats.employeesWithFullSchedule}`);
        console.log(`  - Jours avec activité: ${generateResponse.data.metadata.stats.daysWithActivity}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.data?.issues) {
      console.error('🔍 Erreurs de validation:');
      error.response.data.issues.forEach(issue => {
        console.error(`  - ${issue.field}: ${issue.message}`);
      });
    }
  }
}

// Exécuter le test
testPlanningGeneration();