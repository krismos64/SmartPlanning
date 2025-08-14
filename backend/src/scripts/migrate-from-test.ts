/**
 * Script de migration des données MongoDB de la base "test" vers "smartplanning"
 *
 * Ce script permet de migrer toutes les collections de la base de données 'test'
 * vers la base 'smartplanning' en évitant les doublons.
 *
 * Usage : ts-node src/scripts/migrate-from-test.ts
 */

import chalk from "chalk";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";

// Importer les modèles
import ChatbotInteractionModel from "../models/ChatbotInteraction.model";
import ChatbotSettingsModel from "../models/ChatbotSettings.model";
import CompanyModel from "../models/Company.model";
import EmployeeModel from "../models/Employee.model";
import EventModel from "../models/Event.model";
import GeneratedScheduleModel from "../models/GeneratedSchedule.model";
import IncidentModel from "../models/Incident.model";
import TaskModel from "../models/Task.model";
import TeamModel from "../models/Team.model";
import UserModel from "../models/User.model";
import VacationRequestModel from "../models/VacationRequest.model";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Statistiques de migration
interface MigrationStats {
  read: number;
  migrated: number;
  skipped: number;
  errors: number;
}

// Options de connexion Mongoose
const mongooseOptions: mongoose.ConnectOptions = {
  // Les options par défaut sont suffisantes pour Mongoose 6+
};

// URIs MongoDB
const sourceDbUri =
  "mongodb+srv://krismos:0dYH74uq8MU8xtX8a@smartplanningcluster.u62vb66.mongodb.net/test";
const targetDbUri =
  "mongodb+srv://krismos:0dYH74uq8MU8xtX8a@smartplanningcluster.u62vb66.mongodb.net/smartplanning";

// Connexions mongoose
let sourceDb: mongoose.Connection;
let targetDb: mongoose.Connection;

/**
 * Initialise les connexions aux bases de données source et cible
 */
async function initializeConnections(): Promise<void> {
  try {
    console.log(chalk.blue("🔄 Initialisation des connexions..."));

    sourceDb = mongoose.createConnection(sourceDbUri, mongooseOptions);
    console.log(
      chalk.green("✅ Connexion à la base de données source établie")
    );

    targetDb = mongoose.createConnection(targetDbUri, mongooseOptions);
    console.log(chalk.green("✅ Connexion à la base de données cible établie"));
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la connexion aux bases de données:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

/**
 * Ferme proprement les connexions mongoose
 */
async function closeConnections(): Promise<void> {
  try {
    await sourceDb.close();
    await targetDb.close();
    console.log(chalk.blue("🔌 Connexions fermées"));
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la fermeture des connexions:"),
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Migre une collection avec gestion des doublons basée sur une clé unique
 * @param modelName Nom du modèle Mongoose
 * @param uniqueField Champ utilisé pour identifier les doublons (ex: 'email', '_id')
 * @param sourceColl Collection source
 * @param targetColl Collection cible
 */
async function migrateCollection<T extends mongoose.Document>(
  modelName: string,
  uniqueField: string,
  sourceColl: mongoose.Model<T>,
  targetColl: mongoose.Model<T>
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    read: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    console.log(chalk.blue(`🔄 Migration de la collection ${modelName}...`));

    // Lire les documents de la source
    const sourceDocuments = await sourceColl.find({}).lean();
    stats.read = sourceDocuments.length;

    console.log(
      chalk.blue(
        `📊 ${sourceDocuments.length} documents trouvés dans ${modelName}`
      )
    );

    // Migrer chaque document
    for (const sourceDoc of sourceDocuments) {
      try {
        // Création d'un critère de recherche basé sur le champ unique
        const searchCriteria =
          uniqueField === "_id"
            ? { _id: sourceDoc._id }
            : {
                [uniqueField]: sourceDoc[uniqueField as keyof typeof sourceDoc],
              };

        // Vérifier si le document existe déjà dans la cible
        const existingDoc = await targetColl.findOne(searchCriteria).lean();

        if (!existingDoc) {
          // Créer une nouvelle instance pour bénéficier des hooks Mongoose
          const newDoc = new targetColl(sourceDoc);
          await newDoc.save();
          stats.migrated++;

          const logInfo =
            uniqueField !== "_id" &&
            sourceDoc[uniqueField as keyof typeof sourceDoc]
              ? `${uniqueField}: ${
                  (sourceDoc as Record<string, any>)[uniqueField]
                }`
              : `_id: ${sourceDoc._id}`;

          // Éviter d'afficher des informations sensibles
          const sanitizedLog = logInfo.includes("password")
            ? logInfo.replace(/password=.*?($|,)/, "password=[HIDDEN]$1")
            : logInfo;

          console.log(chalk.green(`✅ Migré: ${sanitizedLog}`));
        } else {
          stats.skipped++;
          console.log(
            chalk.yellow(`⏭️ Ignoré (existe déjà): ${sourceDoc._id}`)
          );
        }
      } catch (error: unknown) {
        stats.errors++;
        console.error(
          chalk.red(
            `❌ Erreur lors de la migration d'un document ${modelName}:`
          ),
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return stats;
  } catch (error: unknown) {
    console.error(
      chalk.red(
        `❌ Erreur lors de la migration de la collection ${modelName}:`
      ),
      error instanceof Error ? error.message : String(error)
    );
    return stats;
  }
}

/**
 * Migration des utilisateurs
 */
async function migrateUsers(): Promise<MigrationStats> {
  const sourceUserModel = sourceDb.model("User", UserModel.schema);
  const targetUserModel = targetDb.model("User", UserModel.schema);
  return migrateCollection("users", "email", sourceUserModel, targetUserModel);
}

/**
 * Migration des équipes
 */
async function migrateTeams(): Promise<MigrationStats> {
  const sourceTeamModel = sourceDb.model("Team", TeamModel.schema);
  const targetTeamModel = targetDb.model("Team", TeamModel.schema);
  return migrateCollection("teams", "name", sourceTeamModel, targetTeamModel);
}

/**
 * Migration des entreprises
 */
async function migrateCompanies(): Promise<MigrationStats> {
  const sourceCompanyModel = sourceDb.model("Company", CompanyModel.schema);
  const targetCompanyModel = targetDb.model("Company", CompanyModel.schema);
  return migrateCollection(
    "companies",
    "name",
    sourceCompanyModel,
    targetCompanyModel
  );
}

/**
 * Migration des employés
 */
async function migrateEmployees(): Promise<MigrationStats> {
  const sourceEmployeeModel = sourceDb.model("Employee", EmployeeModel.schema);
  const targetEmployeeModel = targetDb.model("Employee", EmployeeModel.schema);
  return migrateCollection(
    "employees",
    "_id",
    sourceEmployeeModel,
    targetEmployeeModel
  );
}

/**
 * Migration des tâches
 */
async function migrateTasks(): Promise<MigrationStats> {
  const sourceTaskModel = sourceDb.model("Task", TaskModel.schema);
  const targetTaskModel = targetDb.model("Task", TaskModel.schema);
  return migrateCollection("tasks", "_id", sourceTaskModel, targetTaskModel);
}

/**
 * Migration des événements
 */
async function migrateEvents(): Promise<MigrationStats> {
  const sourceEventModel = sourceDb.model("Event", EventModel.schema);
  const targetEventModel = targetDb.model("Event", EventModel.schema);
  return migrateCollection("events", "_id", sourceEventModel, targetEventModel);
}

/**
 * Migration des plannings générés
 */
async function migrateGeneratedSchedules(): Promise<MigrationStats> {
  const sourceGeneratedScheduleModel = sourceDb.model(
    "GeneratedSchedule",
    GeneratedScheduleModel.schema
  );
  const targetGeneratedScheduleModel = targetDb.model(
    "GeneratedSchedule",
    GeneratedScheduleModel.schema
  );
  return migrateCollection(
    "generatedschedules",
    "_id",
    sourceGeneratedScheduleModel,
    targetGeneratedScheduleModel
  );
}

/**
 * Migration des plannings hebdomadaires
 */
async function migrateWeeklySchedules(): Promise<MigrationStats> {
  const sourceWeeklyScheduleModel = sourceDb.model(
    "WeeklySchedule",
    WeeklyScheduleModel.schema
  );
  const targetWeeklyScheduleModel = targetDb.model(
    "WeeklySchedule",
    WeeklyScheduleModel.schema
  );
  return migrateCollection(
    "weeklySchedules",
    "_id",
    sourceWeeklyScheduleModel,
    targetWeeklyScheduleModel
  );
}

/**
 * Migration des incidents
 */
async function migrateIncidents(): Promise<MigrationStats> {
  const sourceIncidentModel = sourceDb.model("Incident", IncidentModel.schema);
  const targetIncidentModel = targetDb.model("Incident", IncidentModel.schema);
  return migrateCollection(
    "incidents",
    "_id",
    sourceIncidentModel,
    targetIncidentModel
  );
}

/**
 * Migration des demandes de congés
 */
async function migrateVacationRequests(): Promise<MigrationStats> {
  const sourceVacationRequestModel = sourceDb.model(
    "VacationRequest",
    VacationRequestModel.schema
  );
  const targetVacationRequestModel = targetDb.model(
    "VacationRequest",
    VacationRequestModel.schema
  );
  return migrateCollection(
    "vacationrequests",
    "_id",
    sourceVacationRequestModel,
    targetVacationRequestModel
  );
}

/**
 * Migration des paramètres du chatbot
 */
async function migrateChatbotSettings(): Promise<MigrationStats> {
  const sourceChatbotSettingsModel = sourceDb.model(
    "ChatbotSettings",
    ChatbotSettingsModel.schema
  );
  const targetChatbotSettingsModel = targetDb.model(
    "ChatbotSettings",
    ChatbotSettingsModel.schema
  );
  return migrateCollection(
    "chatbotsettings",
    "_id",
    sourceChatbotSettingsModel,
    targetChatbotSettingsModel
  );
}

/**
 * Migration des interactions chatbot
 */
async function migrateChatbotInteractions(): Promise<MigrationStats> {
  const sourceChatbotInteractionModel = sourceDb.model(
    "ChatbotInteraction",
    ChatbotInteractionModel.schema
  );
  const targetChatbotInteractionModel = targetDb.model(
    "ChatbotInteraction",
    ChatbotInteractionModel.schema
  );
  return migrateCollection(
    "chatbotinteractions",
    "_id",
    sourceChatbotInteractionModel,
    targetChatbotInteractionModel
  );
}

/**
 * Fonction principale qui exécute toutes les migrations
 */
async function runMigration(): Promise<void> {
  console.log(
    chalk.blue("🚀 Début de la migration de test vers smartplanning")
  );
  console.log(chalk.blue("------------------------------------------------"));

  const startTime = Date.now();

  try {
    await initializeConnections();

    // Exécution des migrations dans un ordre logique pour respecter les dépendances
    const statsCompanies = await migrateCompanies();
    const statsTeams = await migrateTeams();
    const statsUsers = await migrateUsers();
    const statsEmployees = await migrateEmployees();
    const statsTasks = await migrateTasks();
    const statsEvents = await migrateEvents();
    const statsGeneratedSchedules = await migrateGeneratedSchedules();
    const statsWeeklySchedules = await migrateWeeklySchedules();
    const statsIncidents = await migrateIncidents();
    const statsVacationRequests = await migrateVacationRequests();
    const statsChatbotSettings = await migrateChatbotSettings();
    const statsChatbotInteractions = await migrateChatbotInteractions();

    // Afficher le résumé final
    console.log(chalk.blue("\n📊 Résumé de la migration :"));
    console.log(chalk.blue("------------------------------------------------"));

    const displayStats = (name: string, stats: MigrationStats) => {
      console.log(
        chalk.blue(
          `${name} : ${stats.read} lus, ${stats.migrated} migrés, ${stats.skipped} ignorés, ${stats.errors} erreurs`
        )
      );
    };

    displayStats("Companies", statsCompanies);
    displayStats("Teams", statsTeams);
    displayStats("Users", statsUsers);
    displayStats("Employees", statsEmployees);
    displayStats("Tasks", statsTasks);
    displayStats("Events", statsEvents);
    displayStats("Generated Schedules", statsGeneratedSchedules);
    displayStats("Weekly Schedules", statsWeeklySchedules);
    displayStats("Incidents", statsIncidents);
    displayStats("Vacation Requests", statsVacationRequests);
    displayStats("Chatbot Settings", statsChatbotSettings);
    displayStats("Chatbot Interactions", statsChatbotInteractions);

    const totalMigrated =
      statsCompanies.migrated +
      statsTeams.migrated +
      statsUsers.migrated +
      statsEmployees.migrated +
      statsTasks.migrated +
      statsEvents.migrated +
      statsGeneratedSchedules.migrated +
      statsWeeklySchedules.migrated +
      statsIncidents.migrated +
      statsVacationRequests.migrated +
      statsChatbotSettings.migrated +
      statsChatbotInteractions.migrated;

    const totalRead =
      statsCompanies.read +
      statsTeams.read +
      statsUsers.read +
      statsEmployees.read +
      statsTasks.read +
      statsEvents.read +
      statsGeneratedSchedules.read +
      statsWeeklySchedules.read +
      statsIncidents.read +
      statsVacationRequests.read +
      statsChatbotSettings.read +
      statsChatbotInteractions.read;

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(chalk.blue("------------------------------------------------"));
    console.log(
      chalk.green(`✅ Migration terminée en ${elapsedTime} secondes`)
    );
    console.log(
      chalk.green(
        `✅ Total: ${totalRead} documents lus, ${totalMigrated} documents migrés vers smartplanning`
      )
    );
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la migration:"),
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    await closeConnections();
  }
}

// Exécution de la fonction principale
runMigration()
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
