/**
 * Script de migration pour ajouter un champ email vide ("") aux employés existants.
 * Usage : npm run migrate:employees
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import EmployeeModel from "../src/models/Employee.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function migrateAddEmptyEmailToEmployees() {
  try {
    console.log("🚀 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("🔍 Recherche des employés sans email...");
    const result = await EmployeeModel.updateMany(
      { email: { $exists: false } },
      { $set: { email: "" } }
    );

    console.log(
      `✅ Migration terminée : ${result.modifiedCount} employés mis à jour.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

migrateAddEmptyEmailToEmployees();
