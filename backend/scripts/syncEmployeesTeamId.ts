/**
 * Script syncEmployeesTeamId.ts
 *
 * Ce script synchronise automatiquement les employés avec leur équipe appropriée
 * en se basant sur les données de la collection teams. Pour chaque équipe,
 * les employés listés dans employeeIds auront leur teamId mis à jour.
 *
 * Usage: npx ts-node backend/scripts/syncEmployeesTeamId.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Import des modèles
import EmployeeModel from "../src/models/Employee.model";
import TeamModel from "../src/models/Team.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Fonction principale qui synchronise les employés avec leur équipe
 */
async function syncEmployeesTeamId(): Promise<void> {
  // Statistiques pour le rapport final
  let totalEmployeesUpdated = 0;
  let totalErrors = 0;
  let totalTeams = 0;
  let totalTeamsWithoutEmployees = 0;

  try {
    // Se connecter à MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb+srv://krismos:0dYH74uq8MU8xtX8a@smartplanningcluster.u62vb66.mongodb.net/smartplanning";
    console.log(`Connexion à MongoDB: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log("Connecté à MongoDB avec succès");

    // Récupérer toutes les équipes
    const teams = await TeamModel.find();
    totalTeams = teams.length;
    console.log(`${teams.length} équipes trouvées dans la base de données`);

    // Traiter chaque équipe
    for (const team of teams) {
      const teamId = team._id;
      console.log(`\nTraitement de l'équipe: ${team.name} (${teamId})`);

      // Vérifier si l'équipe a des employés
      if (!team.employeeIds || team.employeeIds.length === 0) {
        console.log(`Aucun employé assigné à l'équipe ${team.name}`);
        totalTeamsWithoutEmployees++;
        continue;
      }

      console.log(
        `${team.employeeIds.length} employés à synchroniser pour cette équipe`
      );

      // Utiliser Promise.all pour mettre à jour tous les employés en parallèle
      const updatePromises = team.employeeIds.map(async (employeeId) => {
        try {
          // Vérifier si l'employé existe
          const employeeExists = await EmployeeModel.exists({
            _id: employeeId,
          });

          if (!employeeExists) {
            console.log(
              `⚠️ Employé ${employeeId} non trouvé dans la base de données`
            );
            totalErrors++;
            return;
          }

          // Mettre à jour uniquement le champ teamId
          const result = await EmployeeModel.updateOne(
            { _id: employeeId },
            { $set: { teamId: teamId } }
          );

          if (result.modifiedCount > 0) {
            console.log(`✓ Employé ${employeeId} assigné à l'équipe ${teamId}`);
            totalEmployeesUpdated++;
          } else if (result.matchedCount > 0) {
            console.log(`ℹ️ Employé ${employeeId} déjà assigné à cette équipe`);
          } else {
            console.log(`⚠️ Employé ${employeeId} introuvable`);
            totalErrors++;
          }
        } catch (error) {
          console.error(
            `❌ Erreur lors de la mise à jour de l'employé ${employeeId}:`,
            error
          );
          totalErrors++;
        }
      });

      // Attendre la fin de toutes les mises à jour pour cette équipe
      await Promise.all(updatePromises);
    }

    // Afficher le rapport final
    console.log("\n📊 RAPPORT FINAL 📊");
    console.log("-------------------");
    console.log(`Total des équipes: ${totalTeams}`);
    console.log(`Équipes sans employés: ${totalTeamsWithoutEmployees}`);
    console.log(`Employés mis à jour: ${totalEmployeesUpdated}`);
    console.log(`Erreurs rencontrées: ${totalErrors}`);
    console.log("-------------------");
  } catch (error) {
    console.error("❌ Erreur globale lors de l'exécution du script:", error);
    process.exit(1);
  } finally {
    // Déconnecter proprement de MongoDB
    await mongoose.disconnect();
    console.log("📡 Déconnexion de MongoDB");
  }
}

// Exécuter la fonction principale
syncEmployeesTeamId()
  .then(() => {
    console.log("✅ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur non gérée:", error);
    process.exit(1);
  });
