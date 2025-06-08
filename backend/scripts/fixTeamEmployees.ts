/**
 * Script pour corriger la synchronisation des employés avec leurs équipes
 *
 * Ce script corrige deux problèmes :
 * 1. Employés qui ont un teamId mais ne sont pas dans le tableau employeeIds de l'équipe
 * 2. Équipes qui ont des employés dans employeeIds mais ces employés n'ont pas le bon teamId
 *
 * Usage: npx ts-node backend/scripts/fixTeamEmployees.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Import des modèles
import EmployeeModel from "../src/models/Employee.model";
import TeamModel from "../src/models/Team.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function fixTeamEmployees(): Promise<void> {
  console.log(
    "🔧 Début de la synchronisation des employés avec les équipes...\n"
  );

  let totalEmployeesUpdated = 0;
  let totalTeamsUpdated = 0;
  let totalErrors = 0;

  try {
    // Connecter à MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI n'est pas défini dans les variables d'environnement"
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connecté à MongoDB\n");

    // 1. Récupérer tous les employés qui ont un teamId
    console.log("📋 Récupération des employés avec teamId...");
    const employeesWithTeam = await EmployeeModel.find({
      teamId: { $ne: null },
    }).lean();

    console.log(`Trouvé ${employeesWithTeam.length} employés avec un teamId\n`);

    // 2. Pour chaque employé, vérifier qu'il est dans l'équipe correspondante
    console.log("🔍 Vérification des employés dans les équipes...");
    for (const employee of employeesWithTeam) {
      try {
        const team = await TeamModel.findById(employee.teamId);

        if (!team) {
          console.log(
            `⚠️ Équipe ${employee.teamId} introuvable pour l'employé ${employee.firstName} ${employee.lastName}`
          );
          // Remettre le teamId à null pour cet employé
          await EmployeeModel.findByIdAndUpdate(employee._id, { teamId: null });
          totalEmployeesUpdated++;
          continue;
        }

        // Vérifier si l'employé est dans le tableau employeeIds de l'équipe
        const isInTeam = team.employeeIds.some(
          (empId) => empId.toString() === employee._id.toString()
        );

        if (!isInTeam) {
          console.log(
            `➕ Ajout de ${employee.firstName} ${employee.lastName} à l'équipe ${team.name}`
          );
          await TeamModel.findByIdAndUpdate(team._id, {
            $addToSet: { employeeIds: employee._id },
          });
          totalTeamsUpdated++;
        }
      } catch (error) {
        console.error(
          `❌ Erreur pour l'employé ${employee.firstName} ${employee.lastName}:`,
          error
        );
        totalErrors++;
      }
    }

    // 3. Récupérer toutes les équipes et vérifier la cohérence inverse
    console.log("\n🔍 Vérification des équipes...");
    const teams = await TeamModel.find({}).lean();

    for (const team of teams) {
      try {
        if (!team.employeeIds || team.employeeIds.length === 0) {
          console.log(`ℹ️ Équipe ${team.name} sans employés`);
          continue;
        }

        // Vérifier chaque employé dans l'équipe
        for (const employeeId of team.employeeIds) {
          const employee = await EmployeeModel.findById(employeeId);

          if (!employee) {
            console.log(
              `⚠️ Employé ${employeeId} introuvable, suppression de l'équipe ${team.name}`
            );
            await TeamModel.findByIdAndUpdate(team._id, {
              $pull: { employeeIds: employeeId },
            });
            totalTeamsUpdated++;
            continue;
          }

          // Vérifier si l'employé a le bon teamId
          if (
            !employee.teamId ||
            employee.teamId.toString() !== team._id.toString()
          ) {
            console.log(
              `🔄 Mise à jour du teamId de ${employee.firstName} ${employee.lastName} vers l'équipe ${team.name}`
            );
            await EmployeeModel.findByIdAndUpdate(employee._id, {
              teamId: team._id,
            });
            totalEmployeesUpdated++;
          }
        }
      } catch (error) {
        console.error(`❌ Erreur pour l'équipe ${team.name}:`, error);
        totalErrors++;
      }
    }

    // 4. Rapport final
    console.log("\n📊 RAPPORT FINAL:");
    console.log(`✅ Employés mis à jour: ${totalEmployeesUpdated}`);
    console.log(`✅ Équipes mises à jour: ${totalTeamsUpdated}`);
    console.log(`❌ Erreurs: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log("\n🎉 Synchronisation terminée avec succès !");
    } else {
      console.log(
        `\n⚠️ Synchronisation terminée avec ${totalErrors} erreur(s)`
      );
    }
  } catch (error) {
    console.error("❌ Erreur fatale:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Déconnecté de MongoDB");
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  fixTeamEmployees().catch(console.error);
}

export default fixTeamEmployees;
