/**
 * Script d'initialisation de la base de données MongoDB pour SmartPlanning
 *
 * Ce script se connecte à MongoDB et insère des données de test pour chaque collection.
 * Il évite les doublons en vérifiant l'existence avant chaque insertion.
 *
 * Utilisation: ts-node src/scripts/init-db.ts
 */

import { hashSync } from "bcrypt";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import * as path from "path";

// Importer tous les modèles
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
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Vérifier si l'URI MongoDB est définie
const MONGODB_URI: string = process.env.MONGODB_URI || "";
if (!MONGODB_URI) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "❌ Erreur: Variable d'environnement MONGODB_URI non définie"
  );
  console.error("Veuillez définir MONGODB_URI dans le fichier .env");
  process.exit(1);
}

/**
 * Fonction principale d'initialisation de la base de données
 */
async function initializeDatabase() {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "🚀 Démarrage de l'initialisation de la base de données..."
  );

  try {
    // Connexion à MongoDB
    console.log("\x1b[33m%s\x1b[0m", "⏳ Connexion à MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log(
      "\x1b[32m%s\x1b[0m",
      "✅ Connexion à MongoDB établie avec succès"
    );

    // Initialiser les collections
    const adminUser = await initializeUsers();
    const company = await initializeCompanies();
    await initializeTeams(company._id, adminUser._id);
    const employee = await initializeEmployees(company._id);
    await initializeWeeklySchedules(employee._id);
    await initializeGeneratedSchedules(employee._id);
    await initializeVacationRequests(employee._id, adminUser._id);
    await initializeTasks(employee._id);
    await initializeIncidents(employee._id, adminUser._id);
    await initializeEvents(company._id, adminUser._id, [employee._id]);
    await initializeChatbotSettings(company._id);
    await initializeChatbotInteractions(company._id, adminUser._id);

    console.log(
      "\x1b[32m%s\x1b[0m",
      "✅ Initialisation de la base de données terminée avec succès"
    );
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Erreur lors de l'initialisation de la base de données:"
    );
    console.error(error);
    process.exit(1);
  } finally {
    // Fermer la connexion MongoDB
    if (mongoose.connection.readyState === 1) {
      console.log(
        "\x1b[33m%s\x1b[0m",
        "⏳ Fermeture de la connexion à MongoDB..."
      );
      await mongoose.connection.close();
      console.log("\x1b[32m%s\x1b[0m", "✅ Connexion fermée");
    }
  }
}

/**
 * Initialisation des utilisateurs
 */
async function initializeUsers() {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des utilisateurs...");

  // Vérifier si l'utilisateur admin existe déjà
  const existingAdmin = await UserModel.findOne({
    email: "admin@smartplanning.fr",
  });
  if (existingAdmin) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'utilisateur admin existe déjà, réutilisation..."
    );
    return existingAdmin;
  }

  // Créer un utilisateur admin
  const adminUser = await UserModel.create({
    email: "admin@smartplanning.fr",
    password: hashSync("Admin123!", 10),
    role: "admin",
    firstName: "Admin",
    lastName: "SmartPlanning",
    isActive: true,
    emailVerified: true,
    loginHistory: [
      {
        ip: "127.0.0.1",
        date: new Date(),
        status: "success",
      },
    ],
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Utilisateur admin créé avec l'ID: ${adminUser._id}`
  );
  return adminUser;
}

/**
 * Initialisation des entreprises
 */
async function initializeCompanies() {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des entreprises...");

  // Vérifier si l'entreprise de test existe déjà
  const existingCompany = await CompanyModel.findOne({
    name: "SmartPlanning SAS",
  });
  if (existingCompany) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'entreprise de test existe déjà, réutilisation..."
    );
    return existingCompany;
  }

  // Créer une entreprise de test
  const company = await CompanyModel.create({
    name: "SmartPlanning SAS",
    logoUrl: "https://example.com/logo.png",
    subscription: {
      plan: "free",
      employeeLimit: 10,
      managerLimit: 2,
    },
    contactEmail: "contact@smartplanning.fr",
    contactPhone: "+33123456789",
    settings: {
      theme: "light",
    },
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Entreprise créée avec l'ID: ${company._id}`
  );
  return company;
}

/**
 * Initialisation des équipes
 */
async function initializeTeams(
  companyId: mongoose.Types.ObjectId,
  managerId: mongoose.Types.ObjectId
) {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des équipes...");

  // Vérifier si l'équipe de test existe déjà
  const existingTeam = await TeamModel.findOne({
    name: "Équipe Développement",
    companyId,
  });
  if (existingTeam) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'équipe de test existe déjà, réutilisation..."
    );
    return existingTeam;
  }

  // Créer une équipe de test
  const team = await TeamModel.create({
    companyId,
    name: "Équipe Développement",
    managerIds: [managerId],
    employeeIds: [],
    description: "Équipe de développement logiciel",
  });

  console.log("\x1b[32m%s\x1b[0m", `✅ Équipe créée avec l'ID: ${team._id}`);
  return team;
}

/**
 * Initialisation des employés
 */
async function initializeEmployees(companyId: mongoose.Types.ObjectId) {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des employés...");

  // Obtenir l'équipe de test
  const team = await TeamModel.findOne({ companyId });
  if (!team) {
    throw new Error("Aucune équipe trouvée pour créer l'employé");
  }

  // Vérifier si l'employé de test existe déjà
  const existingEmployee = await EmployeeModel.findOne({
    firstName: "Jean",
    lastName: "Dupont",
    companyId,
  });
  if (existingEmployee) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'employé de test existe déjà, réutilisation..."
    );

    // S'assurer que l'employé est dans l'équipe
    if (!team.employeeIds.includes(existingEmployee._id)) {
      team.employeeIds.push(existingEmployee._id);
      await team.save();
    }

    return existingEmployee;
  }

  // Créer un employé de test
  const employee = await EmployeeModel.create({
    companyId,
    teamId: team._id,
    firstName: "Jean",
    lastName: "Dupont",
    status: "actif",
    contractHoursPerWeek: 35,
    startDate: new Date("2023-01-15"),
    preferences: {
      preferredDays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
      preferredHours: ["09:00-17:00"],
    },
  });

  // Ajouter l'employé à l'équipe
  team.employeeIds.push(employee._id);
  await team.save();

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Employé créé avec l'ID: ${employee._id}`
  );
  return employee;
}

/**
 * Initialisation des plannings hebdomadaires
 */
async function initializeWeeklySchedules(employeeId: mongoose.Types.ObjectId) {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "📝 Initialisation des plannings hebdomadaires..."
  );

  // Vérifier si un planning de test existe déjà
  const currentYear = new Date().getFullYear();
  const existingSchedule = await WeeklyScheduleModel.findOne({
    employeeId,
    year: currentYear,
    weekNumber: 1,
  });

  if (existingSchedule) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Le planning hebdomadaire de test existe déjà, réutilisation..."
    );
    return existingSchedule;
  }

  // Obtenir l'utilisateur admin
  const admin = await UserModel.findOne({ email: "admin@smartplanning.fr" });
  if (!admin) {
    throw new Error("Utilisateur admin non trouvé");
  }

  // Créer un planning hebdomadaire de test
  const scheduleData = new Map<string, string[]>();
  scheduleData.set("lundi", ["09:00-12:00", "13:00-17:00"]);
  scheduleData.set("mardi", ["09:00-12:00", "13:00-17:00"]);
  scheduleData.set("mercredi", ["09:00-12:00", "13:00-17:00"]);
  scheduleData.set("jeudi", ["09:00-12:00", "13:00-17:00"]);
  scheduleData.set("vendredi", ["09:00-12:00", "13:00-16:00"]);

  const weeklySchedule = await WeeklyScheduleModel.create({
    employeeId,
    year: currentYear,
    weekNumber: 1,
    scheduleData,
    status: "approved",
    updatedBy: admin._id,
    notes: "Planning initial de test",
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Planning hebdomadaire créé avec l'ID: ${weeklySchedule._id}`
  );
  return weeklySchedule;
}

/**
 * Initialisation des plannings générés
 */
async function initializeGeneratedSchedules(
  employeeId: mongoose.Types.ObjectId
) {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "📝 Initialisation des plannings générés..."
  );

  // Vérifier si un planning généré de test existe déjà
  const existingSchedule = await GeneratedScheduleModel.findOne({ employeeId });
  if (existingSchedule) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Le planning généré de test existe déjà, réutilisation..."
    );
    return existingSchedule;
  }

  // Créer un planning généré de test
  const scheduleData = {
    lundi: ["09:00-12:00", "13:00-17:00"],
    mardi: ["09:00-12:00", "13:00-17:00"],
    mercredi: ["09:00-12:00", "13:00-17:00"],
    jeudi: ["09:00-12:00", "13:00-17:00"],
    vendredi: ["09:00-12:00", "13:00-16:00"],
  };

  const generatedSchedule = await GeneratedScheduleModel.create({
    employeeId,
    scheduleData,
    generatedBy: "AI",
    timestamp: new Date(),
    status: "draft",
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Planning généré créé avec l'ID: ${generatedSchedule._id}`
  );
  return generatedSchedule;
}

/**
 * Initialisation des demandes de congés
 */
async function initializeVacationRequests(
  employeeId: mongoose.Types.ObjectId,
  requestedById: mongoose.Types.ObjectId
) {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "📝 Initialisation des demandes de congés..."
  );

  // Vérifier si une demande de congés de test existe déjà
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 1);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 5);

  const existingRequest = await VacationRequestModel.findOne({
    employeeId,
    startDate: { $gte: startDate, $lte: endDate },
  });

  if (existingRequest) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ La demande de congés de test existe déjà, réutilisation..."
    );
    return existingRequest;
  }

  // Créer une demande de congés de test
  const vacationRequest = await VacationRequestModel.create({
    employeeId,
    startDate,
    endDate,
    status: "pending",
    requestedBy: requestedById,
    reason: "Congés annuels",
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Demande de congés créée avec l'ID: ${vacationRequest._id}`
  );
  return vacationRequest;
}

/**
 * Initialisation des tâches
 */
async function initializeTasks(employeeId: mongoose.Types.ObjectId) {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des tâches...");

  // Vérifier si une tâche de test existe déjà
  const existingTask = await TaskModel.findOne({
    employeeId,
    title: "Compléter le rapport hebdomadaire",
  });

  if (existingTask) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ La tâche de test existe déjà, réutilisation..."
    );
    return existingTask;
  }

  // Créer une tâche de test
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);

  const task = await TaskModel.create({
    employeeId,
    title: "Compléter le rapport hebdomadaire",
    dueDate,
    status: "pending",
  });

  console.log("\x1b[32m%s\x1b[0m", `✅ Tâche créée avec l'ID: ${task._id}`);
  return task;
}

/**
 * Initialisation des incidents
 */
async function initializeIncidents(
  employeeId: mongoose.Types.ObjectId,
  reportedById: mongoose.Types.ObjectId
) {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des incidents...");

  // Vérifier si un incident de test existe déjà
  const existingIncident = await IncidentModel.findOne({
    employeeId,
    type: "retard",
  });

  if (existingIncident) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'incident de test existe déjà, réutilisation..."
    );
    return existingIncident;
  }

  // Créer un incident de test
  const incidentDate = new Date();
  incidentDate.setDate(incidentDate.getDate() - 2);

  const incident = await IncidentModel.create({
    employeeId,
    type: "retard",
    description: "Retard de 30 minutes dû à un problème de transport",
    date: incidentDate,
    status: "pending",
    reportedBy: reportedById,
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Incident créé avec l'ID: ${incident._id}`
  );
  return incident;
}

/**
 * Initialisation des événements
 */
async function initializeEvents(
  companyId: mongoose.Types.ObjectId,
  createdById: mongoose.Types.ObjectId,
  participantIds: mongoose.Types.ObjectId[]
) {
  console.log("\x1b[36m%s\x1b[0m", "📝 Initialisation des événements...");

  // Vérifier si un événement de test existe déjà
  const existingEvent = await EventModel.findOne({
    companyId,
    title: "Réunion d'équipe mensuelle",
  });

  if (existingEvent) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'événement de test existe déjà, réutilisation..."
    );
    return existingEvent;
  }

  // Créer un événement de test
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7);

  const event = await EventModel.create({
    companyId,
    title: "Réunion d'équipe mensuelle",
    description: "Revue des objectifs et des plannings du mois",
    date: eventDate,
    location: "Salle de conférence principale",
    participants: participantIds,
    createdBy: createdById,
  });

  console.log("\x1b[32m%s\x1b[0m", `✅ Événement créé avec l'ID: ${event._id}`);
  return event;
}

/**
 * Initialisation des paramètres du chatbot
 */
async function initializeChatbotSettings(companyId: mongoose.Types.ObjectId) {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "📝 Initialisation des paramètres du chatbot..."
  );

  // Vérifier si des paramètres de chatbot existent déjà
  const existingSettings = await ChatbotSettingsModel.findOne({ companyId });
  if (existingSettings) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ Les paramètres du chatbot existent déjà, réutilisation..."
    );
    return existingSettings;
  }

  // Créer des paramètres de chatbot de test
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);

  const chatbotSettings = await ChatbotSettingsModel.create({
    companyId,
    enabled: true,
    monthlyQueriesLimit: 100,
    monthlySchedulesLimit: 20,
    resetDate,
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Paramètres du chatbot créés avec l'ID: ${chatbotSettings._id}`
  );
  return chatbotSettings;
}

/**
 * Initialisation des interactions avec le chatbot
 */
async function initializeChatbotInteractions(
  companyId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "📝 Initialisation des interactions avec le chatbot..."
  );

  // Vérifier si une interaction de test existe déjà
  const existingInteraction = await ChatbotInteractionModel.findOne({
    companyId,
    action: "info_query",
  });

  if (existingInteraction) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "⚠️ L'interaction avec le chatbot existe déjà, réutilisation..."
    );
    return existingInteraction;
  }

  // Créer une interaction de test
  const chatbotInteraction = await ChatbotInteractionModel.create({
    companyId,
    userId,
    action: "info_query",
    input: "Quels sont les congés prévus pour la semaine prochaine?",
    output:
      "Jean Dupont sera en congé du lundi au mercredi de la semaine prochaine.",
    timestamp: new Date(),
  });

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Interaction avec le chatbot créée avec l'ID: ${chatbotInteraction._id}`
  );
  return chatbotInteraction;
}

// Exécuter la fonction principale
initializeDatabase();
