#!/usr/bin/env ts-node

/**
 * Script de migration: Création d'utilisateurs pour les employés existants
 *
 * Ce script parcourt tous les employés sans userId associé et crée
 * automatiquement un compte utilisateur pour chacun d'eux, puis
 * met à jour l'employé avec la référence vers le nouvel utilisateur.
 *
 * Exécution: npx ts-node backend/scripts/migrateCreateUsersFromEmployees.ts
 */

import bcrypt from "bcrypt";
import { config } from "dotenv";
import mongoose from "mongoose";
import { resolve } from "path";

// Charger les variables d'environnement
config({ path: resolve(__dirname, "../../.env") });

// Importer les modèles
import EmployeeModel from "../../backend/src/models/Employee.model";
import User from "../../backend/src/models/User.model";

// Configuration de la connexion MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning";

// Statistiques de migration
interface MigrationStats {
  totalEmployeesWithoutUser: number;
  successCount: number;
  failCount: number;
  failedEmployees: Array<{ id: string; email: string; error: string }>;
}

/**
 * Fonction principale de migration
 */
async function migrateCreateUsersFromEmployees(): Promise<void> {
  console.log(
    "🚀 Démarrage de la migration: création d'utilisateurs pour les employés existants"
  );

  // Statistiques d'exécution
  const stats: MigrationStats = {
    totalEmployeesWithoutUser: 0,
    successCount: 0,
    failCount: 0,
    failedEmployees: [],
  };

  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("📊 Connecté à MongoDB");

    // Récupérer tous les employés sans userId
    const employeesWithoutUser = await EmployeeModel.find({
      $or: [{ userId: null }, { userId: { $exists: false } }],
    });

    stats.totalEmployeesWithoutUser = employeesWithoutUser.length;
    console.log(
      `📋 Trouvé ${stats.totalEmployeesWithoutUser} employés sans compte utilisateur`
    );

    // Traiter chaque employé
    for (const employee of employeesWithoutUser) {
      // Vérification des données minimales requises
      if (!employee.email) {
        stats.failCount++;
        stats.failedEmployees.push({
          id: employee._id.toString(),
          email: employee.email || "Email manquant",
          error: "Email manquant, impossible de créer un utilisateur",
        });
        console.error(`❌ Erreur: employé ${employee._id} - email manquant`);
        continue;
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const existingUser = await User.findOne({ email: employee.email });
      if (existingUser) {
        // Si un utilisateur avec cet email existe déjà, on le lie simplement à l'employé
        console.log(
          `🔄 Utilisateur existant trouvé pour l'email ${employee.email} - association à l'employé`
        );

        try {
          await EmployeeModel.findByIdAndUpdate(employee._id, {
            userId: existingUser._id,
          });
          stats.successCount++;
          continue;
        } catch (err) {
          stats.failCount++;
          stats.failedEmployees.push({
            id: employee._id.toString(),
            email: employee.email,
            error: `Erreur lors de la mise à jour de l'employé avec user existant: ${
              err instanceof Error ? err.message : String(err)
            }`,
          });
          console.error(
            `❌ Erreur: mise à jour employé ${employee._id} avec user existant: ${err}`
          );
          continue;
        }
      }

      // Démarrer une transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Créer le mot de passe hashé - commun pour tous les employés migrés
        const hashedPassword = await bcrypt.hash("Mostefaoui1", 10);

        // Créer un nouvel utilisateur
        const newUser = await User.create(
          [
            {
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              password: hashedPassword,
              role: "employee",
              status: "active",
              isEmailVerified: true,
              companyId: employee.companyId,
            },
          ],
          { session }
        );

        // Mettre à jour l'employé avec le userId
        await EmployeeModel.findByIdAndUpdate(
          employee._id,
          { userId: newUser[0]._id },
          { session }
        );

        // Valider la transaction
        await session.commitTransaction();
        stats.successCount++;
        console.log(
          `✅ Utilisateur créé pour l'employé ${employee.firstName} ${employee.lastName} (${employee.email})`
        );
      } catch (err) {
        // Annuler la transaction en cas d'erreur
        await session.abortTransaction();

        stats.failCount++;
        stats.failedEmployees.push({
          id: employee._id.toString(),
          email: employee.email,
          error: err instanceof Error ? err.message : String(err),
        });

        console.error(
          `❌ Erreur lors de la création d'un utilisateur pour l'employé ${employee._id}: ${err}`
        );
      } finally {
        // Terminer la session
        session.endSession();
      }
    }

    // Afficher le résumé de la migration
    console.log("\n📈 Résumé de la migration:");
    console.log(
      `📊 Employés sans utilisateur trouvés: ${stats.totalEmployeesWithoutUser}`
    );
    console.log(`✅ Utilisateurs créés avec succès: ${stats.successCount}`);
    console.log(`❌ Échecs: ${stats.failCount}`);

    // Afficher les détails des échecs s'il y en a
    if (stats.failCount > 0) {
      console.log("\n❌ Détails des échecs:");
      stats.failedEmployees.forEach((failure, index) => {
        console.log(
          `${index + 1}. Employé ID: ${failure.id}, Email: ${failure.email}`
        );
        console.log(`   Erreur: ${failure.error}`);
      });
    }
  } catch (err) {
    console.error("🔥 Erreur critique lors de la migration:", err);
  } finally {
    // Fermer la connexion à MongoDB
    await mongoose.disconnect();
    console.log("👋 Déconnecté de MongoDB");
  }
}

// Exécuter la migration
migrateCreateUsersFromEmployees()
  .then(() => {
    console.log("✨ Migration terminée");
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Erreur fatale lors de la migration:", err);
    process.exit(1);
  });
