/**
 * Script de débogage des plannings
 */

import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import User from "../models/User.model";
import Company from "../models/Company.model";
import Team from "../models/Team.model";
import Employee from "../models/Employee.model";
import WeeklySchedule from "../models/WeeklySchedule.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function debugSchedules(): Promise<void> {
  let connection: typeof mongoose | undefined;

  try {
    // Connexion à MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(chalk.blue("🔄 Connexion à la base de données établie"));

    // Initialiser tous les modèles
    await User.countDocuments();
    await Company.countDocuments();
    await Team.countDocuments();
    await Employee.countDocuments();
    await WeeklySchedule.countDocuments();

    console.log(chalk.yellow("🔍 Débogage des plannings..."));

    // Prendre quelques plannings pour analyse
    const schedules = await WeeklySchedule.find({}).limit(3);
    
    console.log(chalk.cyan(`📋 Analyse de ${schedules.length} plannings:`));
    
    for (const schedule of schedules) {
      const employee = await Employee.findById(schedule.employeeId);
      console.log(chalk.green(`\n👤 Employé: ${employee?.firstName} ${employee?.lastName}`));
      console.log(chalk.gray(`📅 Semaine: ${schedule.weekNumber}/${schedule.year}`));
      console.log(chalk.gray(`⏰ Heures totales: ${Math.round(schedule.totalWeeklyMinutes / 60)}h`));
      console.log(chalk.gray(`📊 Statut: ${schedule.status}`));
      
      // Analyser les données de planning
      console.log(chalk.yellow("🗓️ Données de planning détaillées:"));
      console.log(chalk.gray(`Type de scheduleData: ${typeof schedule.scheduleData}`));
      console.log(chalk.gray(`Instance de Map: ${schedule.scheduleData instanceof Map}`));
      
      // Afficher la structure brute
      console.log(chalk.yellow("📄 Structure brute:"));
      console.log(schedule.scheduleData);
      
      // Tenter différentes méthodes d'accès
      console.log(chalk.yellow("🔍 Tentatives d'accès:"));
      
      if (schedule.scheduleData instanceof Map) {
        console.log(chalk.gray("✅ C'est une Map"));
        console.log(chalk.gray(`Taille: ${schedule.scheduleData.size}`));
        
        for (const [day, hours] of schedule.scheduleData.entries()) {
          console.log(chalk.gray(`  ${day}: ${JSON.stringify(hours)}`));
        }
      } else {
        console.log(chalk.gray("❌ Pas une Map, c'est un objet"));
        console.log(chalk.gray("Clés disponibles:", Object.keys(schedule.scheduleData)));
        
        for (const [day, hours] of Object.entries(schedule.scheduleData)) {
          console.log(chalk.gray(`  ${day}: ${JSON.stringify(hours)}`));
        }
      }
      
      // Vérifier les dates quotidiennes
      console.log(chalk.yellow("📅 Dates quotidiennes:"));
      if (schedule.dailyDates instanceof Map) {
        for (const [day, date] of schedule.dailyDates.entries()) {
          console.log(chalk.gray(`  ${day}: ${date}`));
        }
      } else {
        for (const [day, date] of Object.entries(schedule.dailyDates)) {
          console.log(chalk.gray(`  ${day}: ${date}`));
        }
      }
    }

    // Vérifier un planning avec le modèle Mongoose raw
    console.log(chalk.yellow("\n🔍 Analyse avec données brutes:"));
    const rawSchedule = await WeeklySchedule.collection.findOne({});
    if (rawSchedule) {
      console.log(chalk.gray("Structure MongoDB brute:"));
      console.log(JSON.stringify(rawSchedule, null, 2));
    }

  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors du débogage:"),
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    // Fermer la connexion MongoDB
    if (connection) {
      await mongoose.disconnect();
      console.log(chalk.blue("🔌 Connexion fermée"));
    }
  }
}

// Exécution
debugSchedules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red("❌ Erreur non gérée:"), error);
    process.exit(1);
  });