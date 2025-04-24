#!/usr/bin/env ts-node
/**
 * Script de synchronisation des employés à partir des utilisateurs
 *
 * Ce script parcourt tous les utilisateurs avec le rôle "employee" et crée
 * les documents correspondants dans la collection employees s'ils n'existent pas déjà.
 *
 * Usage: ts-node syncEmployeesFromUsers.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Importer les modèles
import EmployeeModel from "../src/models/Employee.model";
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
async function syncEmployeesFromUsers(): Promise<void> {
  let connection: typeof mongoose | null = null;

  try {
    console.log(
      `${colors.cyan}${colors.bright}Démarrage de la synchronisation employés/utilisateurs${colors.reset}`
    );

    // Vérifier que l'URI MongoDB est définie
    if (!MONGODB_URI) {
      throw new Error("Variable d'environnement MONGODB_URI non définie");
    }

    // Connexion à MongoDB
    console.log("Connexion à MongoDB...");
    connection = await mongoose.connect(MONGODB_URI);
    console.log(`${colors.green}Connecté à MongoDB${colors.reset}`);

    // Rechercher tous les utilisateurs avec rôle "employee"
    const employeeUsers = await User.find({ role: "employee" });
    console.log(
      `${colors.cyan}${employeeUsers.length} utilisateurs avec rôle "employee" trouvés${colors.reset}`
    );

    // Compteur des nouvelles entrées
    let newEmployeesCount = 0;

    // Traiter chaque utilisateur
    for (const user of employeeUsers) {
      // Vérifier si un employee existe déjà pour cet utilisateur
      const existingEmployee = await EmployeeModel.findOne({
        userId: user._id,
      });

      // Si l'employee n'existe pas, le créer
      if (!existingEmployee) {
        const newEmployee = new EmployeeModel({
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          status: user.status === "active" ? "actif" : "inactif",
          contractHoursPerWeek: 35,
          teamId: null,
          source: "sync-script",
        });

        await newEmployee.save();
        newEmployeesCount++;

        console.log(
          `${colors.green}✓ Nouvel employee créé pour ${user.firstName} ${user.lastName} (ID: ${user._id})${colors.reset}`
        );
      } else {
        console.log(
          `${colors.yellow}→ Employee déjà existant pour ${user.firstName} ${user.lastName} (ID: ${user._id})${colors.reset}`
        );
      }
    }

    // Résumé final
    console.log(
      `\n${colors.bright}Résumé de la synchronisation :${colors.reset}`
    );
    console.log(
      `${colors.cyan}Total d'utilisateurs employés : ${employeeUsers.length}${colors.reset}`
    );
    console.log(
      `${colors.green}Nouveaux documents employees créés : ${newEmployeesCount}${colors.reset}`
    );
    console.log(
      `${colors.yellow}Employés déjà existants : ${
        employeeUsers.length - newEmployeesCount
      }${colors.reset}`
    );

    console.log(
      `\n${colors.green}${colors.bright}Synchronisation terminée avec succès${colors.reset}`
    );

    // Terminer avec succès
    process.exit(0);
  } catch (error) {
    // Afficher l'erreur
    console.error(
      `\n${colors.red}${colors.bright}ERREUR :${colors.reset}`,
      error
    );
    console.error(`${colors.red}La synchronisation a échoué${colors.reset}`);

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
syncEmployeesFromUsers();
