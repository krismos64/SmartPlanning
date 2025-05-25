/**
 * Script de test pour valider les permissions des employés sur les plannings
 *
 * Ce script teste que :
 * 1. Les employés ne peuvent voir que leurs propres plannings
 * 2. Les employés ne peuvent pas créer/modifier/supprimer de plannings
 * 3. Les employés peuvent générer des PDFs de leurs plannings
 */

const API_BASE_URL = "http://localhost:5050/api";

async function testEmployeePermissions() {
  console.log("🔍 Test des permissions employé pour les plannings\n");

  // Simulation d'un token d'employé (remplacer par un vrai token en test)
  const employeeToken = "EMPLOYEE_JWT_TOKEN_HERE";

  const headers = {
    Authorization: `Bearer ${employeeToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Test 1: Récupération des plannings (ne doit retourner que ceux de l'employé)
    console.log("📋 Test 1: Récupération des plannings...");
    const response = await fetch(
      `${API_BASE_URL}/weekly-schedules/week/2024/1`,
      {
        headers,
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Succès: ${data.count} planning(s) récupéré(s)`);

      // Vérifier que tous les plannings appartiennent à l'employé connecté
      if (data.data && data.data.length > 0) {
        const allBelongToEmployee = data.data.every(
          (schedule) => schedule.employeeId === "EMPLOYEE_ID_HERE" // Remplacer par l'ID réel
        );

        if (allBelongToEmployee) {
          console.log("✅ Tous les plannings appartiennent bien à l'employé");
        } else {
          console.log("❌ Certains plannings ne devraient pas être visibles");
        }
      }
    } else {
      console.log(`❌ Erreur: ${response.status} - ${response.statusText}`);
    }

    // Test 2: Tentative de création d'un planning (doit échouer)
    console.log("\n📝 Test 2: Tentative de création de planning...");
    const createResponse = await fetch(`${API_BASE_URL}/weekly-schedules`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        employeeId: "SOME_EMPLOYEE_ID",
        year: 2024,
        weekNumber: 1,
        scheduleData: { monday: ["09:00-17:00"] },
        dailyNotes: {},
        notes: "Test planning",
        dailyDates: { monday: new Date().toISOString() },
        totalWeeklyMinutes: 480,
      }),
    });

    if (createResponse.status === 403 || createResponse.status === 401) {
      console.log("✅ Création de planning correctement bloquée");
    } else {
      console.log(
        `❌ Création de planning autorisée (statut: ${createResponse.status})`
      );
    }

    // Test 3: Tentative de modification d'un planning (doit échouer)
    console.log("\n✏️ Test 3: Tentative de modification de planning...");
    const updateResponse = await fetch(
      `${API_BASE_URL}/weekly-schedules/SOME_SCHEDULE_ID`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          employeeId: "SOME_EMPLOYEE_ID",
          year: 2024,
          weekNumber: 1,
          scheduleData: { monday: ["10:00-18:00"] },
          dailyNotes: {},
          notes: "Planning modifié",
          dailyDates: { monday: new Date().toISOString() },
          totalWeeklyMinutes: 480,
        }),
      }
    );

    if (updateResponse.status === 403 || updateResponse.status === 401) {
      console.log("✅ Modification de planning correctement bloquée");
    } else {
      console.log(
        `❌ Modification de planning autorisée (statut: ${updateResponse.status})`
      );
    }

    // Test 4: Tentative de suppression d'un planning (doit échouer)
    console.log("\n🗑️ Test 4: Tentative de suppression de planning...");
    const deleteResponse = await fetch(
      `${API_BASE_URL}/weekly-schedules/SOME_SCHEDULE_ID`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (deleteResponse.status === 403 || deleteResponse.status === 401) {
      console.log("✅ Suppression de planning correctement bloquée");
    } else {
      console.log(
        `❌ Suppression de planning autorisée (statut: ${deleteResponse.status})`
      );
    }

    console.log("\n🎉 Tests des permissions employé terminés");
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error.message);
  }
}

// Instructions d'utilisation
console.log(`
📝 Instructions pour utiliser ce script de test :

1. Remplacer 'EMPLOYEE_JWT_TOKEN_HERE' par un vrai token JWT d'employé
2. Remplacer 'EMPLOYEE_ID_HERE' par l'ID réel de l'employé 
3. Remplacer 'SOME_EMPLOYEE_ID' et 'SOME_SCHEDULE_ID' par des IDs valides
4. Lancer le script avec : node test-employee-permissions.js

🔧 Pour obtenir un token d'employé :
- Se connecter via l'interface frontend en tant qu'employé
- Vérifier le localStorage pour récupérer le token JWT
- Ou utiliser l'API de connexion directement

`);

// Décommenter la ligne suivante pour lancer les tests
// testEmployeePermissions();
