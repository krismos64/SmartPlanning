#!/usr/bin/env ts-node
/**
 * Script de migration des rôles utilisateurs du français vers l'anglais
 *
 * Ce script met à jour tous les utilisateurs ayant le rôle "employé" (français)
 * pour utiliser le rôle "employee" (anglais).
 *
 * Usage: npx ts-node backend/scripts/migrateUserRoleToEnglish.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Importer le modèle User
import User from "../src/models/User.model";

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;

// Couleurs pour les logs
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

/**
 * Fonction principale du script
 */
async function migrateUserRoleToEnglish(): Promise<void> {
  let connection: typeof mongoose | null = null;

  try {
    console.log(
      `${colors.cyan}${colors.bright}Démarrage de la migration des rôles utilisateurs de "employé" vers "employee"${colors.reset}`
    );

    // Vérifier que l'URI MongoDB est définie
    if (!MONGODB_URI) {
      throw new Error("Variable d'environnement MONGODB_URI non définie");
    }

    // Connexion à MongoDB
    console.log("Connexion à MongoDB...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log(`${colors.green}Connecté à MongoDB${colors.reset}`);

    // Rechercher tous les utilisateurs avec rôle "employé"
    const frenchRoleUsers = await User.find({ role: "employee" });
    const userCount = frenchRoleUsers.length;

    console.log(
      `${colors.cyan}${userCount} utilisateurs avec rôle "employee" trouvés${colors.reset}`
    );

    if (userCount === 0) {
      console.log(
        `${colors.yellow}Aucun utilisateur à mettre à jour, la migration est terminée${colors.reset}`
      );
      process.exit(0);
      return;
    }

    // Mettre à jour tous les utilisateurs avec rôle "employé" vers "employee"
    const result = await User.updateMany(
      { role: "employee" },
      { $set: { role: "employee" } }
    );

    const updatedCount = result.modifiedCount;

    // Afficher les résultats
    console.log(
      `${colors.green}${updatedCount} utilisateurs mis à jour avec succès${colors.reset}`
    );

    // Vérifier si tous les utilisateurs ont été mis à jour
    if (updatedCount !== userCount) {
      console.log(
        `${colors.yellow}Attention: ${
          userCount - updatedCount
        } utilisateurs n'ont pas été mis à jour${colors.reset}`
      );
    }

    // Résumé final
    console.log(`\n${colors.bright}Résumé de la migration :${colors.reset}`);
    console.log(
      `${colors.cyan}Total d'utilisateurs avec rôle "employé" : ${userCount}${colors.reset}`
    );
    console.log(
      `${colors.green}Utilisateurs mis à jour vers "employee" : ${updatedCount}${colors.reset}`
    );

    console.log(
      `\n${colors.green}${colors.bright}Migration terminée avec succès${colors.reset}`
    );

    // Terminer avec succès
    process.exit(0);
  } catch (error) {
    // Afficher l'erreur
    console.error(
      `\n${colors.red}${colors.bright}ERREUR :${colors.reset}`,
      error
    );
    console.error(`${colors.red}La migration a échoué${colors.reset}`);

    // Terminer avec un échec
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB si elle est ouverte
    if (connection) {
      await mongoose.disconnect();
      console.log("Déconnexion de MongoDB");
    }
  }
}

// Exécuter la fonction principale
migrateUserRoleToEnglish();
