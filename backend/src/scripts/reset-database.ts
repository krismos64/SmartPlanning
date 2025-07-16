/**
 * Script de réinitialisation complète de la base de données
 * 
 * Ce script supprime toutes les données de toutes les collections
 * et recrée un utilisateur administrateur avec les informations spécifiées.
 * 
 * Usage : ts-node src/scripts/reset-database.ts
 */

import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User.model";
import Company from "../models/Company.model";
import Team from "../models/Team.model";
import WeeklySchedule from "../models/WeeklySchedule.model";
import GeneratedSchedule from "../models/GeneratedSchedule.model";
import VacationRequest from "../models/VacationRequest.model";
import Task from "../models/Task.model";
import Incident from "../models/Incident.model";
import Event from "../models/Event.model";
import ChatbotInteraction from "../models/ChatbotInteraction.model";
import ChatbotSettings from "../models/ChatbotSettings.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Configuration du nouvel admin
const ADMIN_EMAIL = "christophe.mostefaoui.dev@gmail.com";
const ADMIN_PASSWORD = "Mostefaoui2@@";
const ADMIN_FIRSTNAME = "Christophe";
const ADMIN_LASTNAME = "Mostefaoui";

// Vérifier la présence de l'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error(
    chalk.red("❌ Erreur: Variable d'environnement MONGODB_URI non définie")
  );
  console.error(chalk.red("Veuillez définir MONGODB_URI dans le fichier .env"));
  process.exit(1);
}

/**
 * Fonction pour vider toutes les collections
 */
async function clearAllCollections(): Promise<void> {
  console.log(chalk.yellow("🗑️ Suppression de toutes les données..."));
  
  // Liste des modèles à vider
  const models = [
    { name: "Users", model: User },
    { name: "Companies", model: Company },
    { name: "Teams", model: Team },
    { name: "WeeklySchedules", model: WeeklySchedule },
    { name: "GeneratedSchedules", model: GeneratedSchedule },
    { name: "VacationRequests", model: VacationRequest },
    { name: "Tasks", model: Task },
    { name: "Incidents", model: Incident },
    { name: "Events", model: Event },
    { name: "ChatbotInteractions", model: ChatbotInteraction },
    { name: "ChatbotSettings", model: ChatbotSettings },
  ];

  for (const { name, model } of models) {
    try {
      const result = await (model as any).deleteMany({});
      console.log(chalk.gray(`  - ${name}: ${result.deletedCount} documents supprimés`));
    } catch (error) {
      console.log(chalk.gray(`  - ${name}: Collection vide ou erreur`));
    }
  }
  
  console.log(chalk.green("✅ Toutes les données ont été supprimées"));
}

/**
 * Fonction pour créer l'utilisateur admin
 */
async function createAdminUser(): Promise<void> {
  console.log(chalk.yellow("👤 Création de l'utilisateur administrateur..."));
  
  // Vérifier si l'utilisateur admin existe déjà (normalement non après le clear)
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  
  if (existingAdmin) {
    console.log(
      chalk.yellow(`⚠️ Un utilisateur avec l'email ${ADMIN_EMAIL} existe déjà`)
    );
    return;
  }

  // Créer l'utilisateur admin
  const adminUser = new User({
    firstName: ADMIN_FIRSTNAME,
    lastName: ADMIN_LASTNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // Password brut, sera hashé par le hook pre('save')
    role: "admin",
    status: "active",
    isEmailVerified: true,
  });

  // Sauvegarder l'utilisateur avec le hook de hashage
  await adminUser.save();

  console.log(
    chalk.green(`✅ Utilisateur administrateur créé avec succès: ${ADMIN_EMAIL}`)
  );
  console.log(chalk.green(`   - Prénom: ${ADMIN_FIRSTNAME}`));
  console.log(chalk.green(`   - Nom: ${ADMIN_LASTNAME}`));
  console.log(chalk.green(`   - Rôle: admin`));
}

/**
 * Fonction principale de réinitialisation
 */
async function resetDatabase(): Promise<void> {
  let connection: typeof mongoose | undefined;

  try {
    // Connexion à MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(chalk.blue("🔄 Connexion à la base de données établie"));

    // Confirmation de l'action
    console.log(chalk.red("⚠️  ATTENTION: Cette action va supprimer TOUTES les données!"));
    console.log(chalk.yellow("🔄 Démarrage de la réinitialisation..."));

    // Vider toutes les collections
    await clearAllCollections();

    // Créer le nouvel utilisateur admin
    await createAdminUser();

    console.log(chalk.green("🎉 Réinitialisation de la base de données terminée avec succès!"));
    
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la réinitialisation de la base de données:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB
    if (connection) {
      await mongoose.disconnect();
      console.log(chalk.blue("🔌 Connexion à la base de données fermée"));
    }
  }
}

// Exécution de la fonction principale
resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      chalk.red("❌ Erreur non gérée:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });