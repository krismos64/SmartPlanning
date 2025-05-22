import bcrypt from "bcrypt";
import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ADMIN_EMAIL = "admin@smartplanning.fr";
const NEW_PASSWORD = "Admin123!";

async function resetAdminPassword(): Promise<void> {
  try {
    if (!process.env.MONGODB_URI) {
      console.error(
        chalk.red("❌ MONGODB_URI non défini dans le fichier .env")
      );
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.blue("🔌 Connexion à MongoDB établie"));

    const user = await User.findOne({ email: ADMIN_EMAIL }).select("+password");
    if (!user) {
      console.log(chalk.red(`❌ Utilisateur ${ADMIN_EMAIL} introuvable`));
      return;
    }

    // Option 1: Utiliser directement updateOne pour éviter le hook pre('save')
    await User.updateOne(
      { _id: user._id },
      { $set: { password: await bcrypt.hash(NEW_PASSWORD, 10) } }
    );

    console.log(
      chalk.blue(
        `💡 Mot de passe hashé manuellement et mis à jour directement en base`
      )
    );

    // Option 2 (commentée): Laisser le hook pre('save') gérer le hashage
    // Risque potentiel de double hashage si le développeur n'est pas conscient du fonctionnement
    //
    // user.password = NEW_PASSWORD;
    // await user.save();
  } catch (error) {
    console.error(
      chalk.red("❌ Erreur lors de la mise à jour du mot de passe :"),
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log(chalk.blue("🔌 Connexion MongoDB fermée"));
  }
}

resetAdminPassword();
