/**
 * Script de création d'un utilisateur administrateur
 *
 * Ce script vérifie si un utilisateur avec l'email admin@smartplanning.fr existe
 * et le crée s'il n'existe pas encore.
 *
 * Usage : ts-node src/scripts/create-admin-user.ts
 */

import bcrypt from "bcrypt";
import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Configuration
const ADMIN_EMAIL = "admin@smartplanning.fr";
const ADMIN_PASSWORD = "Admin123!";
const SALT_ROUNDS = 10;

// Vérifier la présence de l'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error(
    chalk.red("❌ Erreur: Variable d'environnement MONGODB_URI non définie")
  );
  console.error(chalk.red("Veuillez définir MONGODB_URI dans le fichier .env"));
  process.exit(1);
}

/**
 * Fonction principale pour créer l'utilisateur admin
 */
async function createAdminUser(): Promise<void> {
  let connection: typeof mongoose | undefined;

  try {
    // Connexion à MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(chalk.blue("🔄 Connexion à la base de données établie"));

    // Vérifier si l'utilisateur admin existe déjà
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(
        chalk.yellow(
          `⚠️ Un utilisateur avec l'email ${ADMIN_EMAIL} existe déjà`
        )
      );
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    // Créer l'utilisateur admin
    const adminUser = new User({
      firstName: "Admin",
      lastName: "SmartPlanning",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      status: "active",
      isEmailVerified: true,
    });

    // Sauvegarder l'utilisateur
    await adminUser.save();

    console.log(
      chalk.green(
        `✅ Utilisateur administrateur créé avec succès: ${ADMIN_EMAIL}`
      )
    );
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la création de l'utilisateur admin:"),
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
createAdminUser()
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
