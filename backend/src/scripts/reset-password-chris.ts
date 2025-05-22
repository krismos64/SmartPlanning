/**
 * Script de réinitialisation de mot de passe pour un utilisateur spécifique
 *
 * Ce script permet de réinitialiser manuellement le mot de passe d'un utilisateur
 * dans la base de données MongoDB en utilisant son adresse email comme identifiant.
 *
 * Utilisation : npm run reset-chris
 */

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.model";

// Charger les variables d'environnement
dotenv.config();

// Configuration
const TARGET_EMAIL = "christophe.mostefaoui.dev@gmail.com";
const NEW_PASSWORD = "ChrisTest@2024";
const SALT_ROUNDS = 10;

/**
 * Fonction principale asynchrone pour exécuter le script
 */
async function resetPassword() {
  try {
    // Se connecter à MongoDB en utilisant l'URI depuis les variables d'environnement
    console.log("Connexion à MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/smartplanning"
    );
    console.log("✅ Connecté à MongoDB");

    // Rechercher l'utilisateur par son email
    console.log(`Recherche de l'utilisateur avec l'email: ${TARGET_EMAIL}`);
    const user = await User.findOne({ email: TARGET_EMAIL });

    // Vérifier si l'utilisateur existe
    if (!user) {
      console.error("❌ Utilisateur introuvable");
      process.exit(1);
    }

    console.log(
      `✅ Utilisateur trouvé: ${user.firstName} ${user.lastName} (ID: ${user._id})`
    );

    // Hasher le nouveau mot de passe manuellement
    console.log("Hashage du nouveau mot de passe...");
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

    // Mise à jour directe dans la base de données pour éviter un double hashage
    console.log("Mise à jour directe dans la base de données...");
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    console.log("✅ Mot de passe réinitialisé avec succès");
    console.log(
      `Le mot de passe pour ${TARGET_EMAIL} a été modifié à: ${NEW_PASSWORD}`
    );
    console.log("Hash stocké en base:", hashedPassword);
    console.log(
      "⚠️ Veuillez noter ce mot de passe et le supprimer des logs après utilisation"
    );

    // Vérification finale
    const updatedUser = await User.findOne({ email: TARGET_EMAIL }).select(
      "+password"
    );
    console.log("Hash vérifié en base:", updatedUser?.password);
    console.log(
      "Hashage manuel correct:",
      updatedUser?.password === hashedPassword ? "✅ Oui" : "❌ Non"
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la réinitialisation du mot de passe:",
      error
    );
    process.exit(1);
  } finally {
    // Fermer proprement la connexion à MongoDB
    if (mongoose.connection.readyState) {
      console.log("Fermeture de la connexion MongoDB...");
      await mongoose.disconnect();
      console.log("✅ Connexion MongoDB fermée");
    }
    process.exit(0);
  }
}

// Exécution de la fonction principale
resetPassword().catch((error) => {
  console.error("❌ Erreur non gérée:", error);
  process.exit(1);
});
