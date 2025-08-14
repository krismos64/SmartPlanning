/**
 * Script de vérification des plannings générés
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

async function checkSchedules(): Promise<void> {
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

    console.log(chalk.yellow("📊 Vérification des plannings..."));

    // Compter les plannings
    const totalSchedules = await WeeklySchedule.countDocuments();
    console.log(chalk.green(`✅ Total des plannings: ${totalSchedules}`));

    // Vérifier par semaine
    const schedulesByWeek = await WeeklySchedule.aggregate([
      {
        $group: {
          _id: { year: "$year", weekNumber: "$weekNumber" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.weekNumber": 1 }
      }
    ]);

    console.log(chalk.cyan("📅 Plannings par semaine:"));
    schedulesByWeek.forEach(week => {
      console.log(chalk.gray(`  • Semaine ${week._id.weekNumber}/${week._id.year}: ${week.count} plannings`));
    });

    // Vérifier un exemple de planning
    const sampleSchedule = await WeeklySchedule.findOne();
    if (sampleSchedule) {
      const employee = await Employee.findById(sampleSchedule.employeeId);
      console.log(chalk.cyan("\n📋 Exemple de planning:"));
      console.log(chalk.gray(`  • Employé: ${employee?.firstName} ${employee?.lastName}`));
      console.log(chalk.gray(`  • Semaine: ${sampleSchedule.weekNumber}/${sampleSchedule.year}`));
      console.log(chalk.gray(`  • Heures totales: ${Math.round(sampleSchedule.totalWeeklyMinutes / 60)}h`));
      console.log(chalk.gray(`  • Statut: ${sampleSchedule.status}`));
      
      // Afficher les horaires de quelques jours
      const scheduleData = sampleSchedule.scheduleData;
      console.log(chalk.gray("  • Horaires:"));
      if (scheduleData instanceof Map) {
        for (const [day, hours] of scheduleData.entries()) {
          if (hours.length > 0) {
            console.log(chalk.gray(`    - ${day}: ${hours.join(', ')}`));
          }
        }
      } else {
        // Si c'est un objet ordinaire
        for (const [day, hours] of Object.entries(scheduleData)) {
          if (hours.length > 0) {
            console.log(chalk.gray(`    - ${day}: ${hours.join(', ')}`));
          }
        }
      }
    }

    // Vérifier les équipes
    const teams = await Team.find({});
    console.log(chalk.cyan(`\n👥 Équipes: ${teams.length}`));
    
    for (const team of teams) {
      const teamSchedules = await WeeklySchedule.find({
        employeeId: { $in: team.employeeIds }
      }).countDocuments();
      console.log(chalk.gray(`  • ${team.name}: ${teamSchedules} plannings`));
    }

  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la vérification:"),
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
checkSchedules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(chalk.red("❌ Erreur non gérée:"), error);
    process.exit(1);
  });