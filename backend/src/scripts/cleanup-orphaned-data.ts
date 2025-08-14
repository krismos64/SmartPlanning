/**
 * Script de nettoyage des données orphelines
 * 
 * Ce script identifie et supprime les données orphelines dans la base de données
 * qui résultent de suppressions incomplètes ou d'erreurs passées.
 * 
 * Usage : ts-node src/scripts/cleanup-orphaned-data.ts
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
import VacationRequest from "../models/VacationRequest.model";
import Task from "../models/Task.model";
import Incident from "../models/Incident.model";
import Event from "../models/Event.model";
import ChatbotInteraction from "../models/ChatbotInteraction.model";
import ChatbotSettings from "../models/ChatbotSettings.model";

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Vérifier la présence de l'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error(
    chalk.red("❌ Erreur: Variable d'environnement MONGODB_URI non définie")
  );
  console.error(chalk.red("Veuillez définir MONGODB_URI dans le fichier .env"));
  process.exit(1);
}

interface CleanupStats {
  usersOrphaned: number;
  employeesOrphaned: number;
  teamsOrphaned: number;
  weeklySchedulesOrphaned: number;
  vacationRequestsOrphaned: number;
  tasksOrphaned: number;
  incidentsOrphaned: number;
  eventsOrphaned: number;
  chatbotInteractionsOrphaned: number;
  chatbotSettingsOrphaned: number;
  teamManagersFixed: number;
  teamEmployeesFixed: number;
  userTeamIdsFixed: number;
}

/**
 * Fonction pour nettoyer les User orphelins
 */
async function cleanupOrphanedUsers(): Promise<number> {
  console.log(chalk.yellow("🔍 Nettoyage des User orphelins..."));
  
  // Trouver les users avec des companyId inexistants
  const usersWithInvalidCompany = await User.find({
    companyId: { $exists: true, $ne: null }
  });
  
  let orphanedCount = 0;
  
  for (const user of usersWithInvalidCompany) {
    if (user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company) {
        // Supprimer companyId orpheline
        await User.findByIdAndUpdate(user._id, { $unset: { companyId: 1 } });
        orphanedCount++;
        console.log(chalk.gray(`  - User ${user.email}: companyId ${user.companyId} supprimé`));
      }
    }
  }
  
  // Nettoyer les teamIds orphelins
  const usersWithTeams = await User.find({
    teamIds: { $exists: true, $ne: [] }
  });
  
  for (const user of usersWithTeams) {
    if (user.teamIds && user.teamIds.length > 0) {
      const validTeamIds = [];
      
      for (const teamId of user.teamIds) {
        const team = await Team.findById(teamId);
        if (team) {
          validTeamIds.push(teamId);
        } else {
          orphanedCount++;
          console.log(chalk.gray(`  - User ${user.email}: teamId ${teamId} supprimé`));
        }
      }
      
      if (validTeamIds.length !== user.teamIds.length) {
        await User.findByIdAndUpdate(user._id, { teamIds: validTeamIds });
      }
    }
  }
  
  return orphanedCount;
}

/**
 * Fonction pour nettoyer les Employee orphelins
 */
async function cleanupOrphanedEmployees(): Promise<number> {
  console.log(chalk.yellow("🔍 Nettoyage des Employee orphelins..."));
  
  let orphanedCount = 0;
  
  // Trouver les employees avec des companyId inexistants
  const employeesWithInvalidCompany = await Employee.find({
    companyId: { $exists: true, $ne: null }
  });
  
  for (const employee of employeesWithInvalidCompany) {
    const company = await Company.findById(employee.companyId);
    if (!company) {
      await Employee.findByIdAndDelete(employee._id);
      orphanedCount++;
      console.log(chalk.gray(`  - Employee ${employee.firstName} ${employee.lastName}: companyId ${employee.companyId} inexistant`));
    }
  }
  
  // Trouver les employees avec des userId inexistants
  const employeesWithUser = await Employee.find({
    userId: { $exists: true, $ne: null }
  });
  
  for (const employee of employeesWithUser) {
    if (employee.userId) {
      const user = await User.findById(employee.userId);
      if (!user) {
        await Employee.findByIdAndUpdate(employee._id, { $unset: { userId: 1 } });
        orphanedCount++;
        console.log(chalk.gray(`  - Employee ${employee.firstName} ${employee.lastName}: userId ${employee.userId} supprimé`));
      }
    }
  }
  
  // Trouver les employees avec des teamId inexistants
  const employeesWithTeam = await Employee.find({
    teamId: { $exists: true, $ne: null }
  });
  
  for (const employee of employeesWithTeam) {
    if (employee.teamId) {
      const team = await Team.findById(employee.teamId);
      if (!team) {
        await Employee.findByIdAndUpdate(employee._id, { $unset: { teamId: 1 } });
        orphanedCount++;
        console.log(chalk.gray(`  - Employee ${employee.firstName} ${employee.lastName}: teamId ${employee.teamId} supprimé`));
      }
    }
  }
  
  return orphanedCount;
}

/**
 * Fonction pour nettoyer les Team orphelines
 */
async function cleanupOrphanedTeams(): Promise<number> {
  console.log(chalk.yellow("🔍 Nettoyage des Team orphelines..."));
  
  let orphanedCount = 0;
  
  // Trouver les teams avec des companyId inexistants
  const teamsWithInvalidCompany = await Team.find({
    companyId: { $exists: true, $ne: null }
  });
  
  for (const team of teamsWithInvalidCompany) {
    const company = await Company.findById(team.companyId);
    if (!company) {
      await Team.findByIdAndDelete(team._id);
      orphanedCount++;
      console.log(chalk.gray(`  - Team ${team.name}: companyId ${team.companyId} inexistant`));
    }
  }
  
  return orphanedCount;
}

/**
 * Fonction pour nettoyer les références dans les Team
 */
async function cleanupTeamReferences(): Promise<{ managers: number; employees: number }> {
  console.log(chalk.yellow("🔍 Nettoyage des références dans les Team..."));
  
  let managersFixed = 0;
  let employeesFixed = 0;
  
  const teams = await Team.find({});
  
  for (const team of teams) {
    let updated = false;
    
    // Nettoyer les managerIds
    if (team.managerIds && team.managerIds.length > 0) {
      const validManagerIds = [];
      
      for (const managerId of team.managerIds) {
        const user = await User.findById(managerId);
        if (user) {
          validManagerIds.push(managerId);
        } else {
          managersFixed++;
          console.log(chalk.gray(`  - Team ${team.name}: managerId ${managerId} supprimé`));
        }
      }
      
      if (validManagerIds.length !== team.managerIds.length) {
        team.managerIds = validManagerIds;
        updated = true;
      }
    }
    
    // Nettoyer les employeeIds
    if (team.employeeIds && team.employeeIds.length > 0) {
      const validEmployeeIds = [];
      
      for (const employeeId of team.employeeIds) {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          validEmployeeIds.push(employeeId);
        } else {
          employeesFixed++;
          console.log(chalk.gray(`  - Team ${team.name}: employeeId ${employeeId} supprimé`));
        }
      }
      
      if (validEmployeeIds.length !== team.employeeIds.length) {
        team.employeeIds = validEmployeeIds;
        updated = true;
      }
    }
    
    if (updated) {
      await team.save();
    }
  }
  
  return { managers: managersFixed, employees: employeesFixed };
}

/**
 * Fonction pour nettoyer les documents liés aux Employee
 */
async function cleanupEmployeeRelatedDocuments(): Promise<{ schedules: number; vacations: number; tasks: number; incidents: number }> {
  console.log(chalk.yellow("🔍 Nettoyage des documents liés aux Employee..."));
  
  let schedulesOrphaned = 0;
  let vacationsOrphaned = 0;
  let tasksOrphaned = 0;
  let incidentsOrphaned = 0;
  
  // Nettoyer WeeklySchedule
  const schedules = await WeeklySchedule.find({});
  for (const schedule of schedules) {
    const employee = await Employee.findById(schedule.employeeId);
    if (!employee) {
      await WeeklySchedule.findByIdAndDelete(schedule._id);
      schedulesOrphaned++;
      console.log(chalk.gray(`  - WeeklySchedule: employeeId ${schedule.employeeId} inexistant`));
    }
  }
  
  // Nettoyer VacationRequest
  const vacations = await VacationRequest.find({});
  for (const vacation of vacations) {
    const employee = await Employee.findById(vacation.employeeId);
    if (!employee) {
      await VacationRequest.findByIdAndDelete(vacation._id);
      vacationsOrphaned++;
      console.log(chalk.gray(`  - VacationRequest: employeeId ${vacation.employeeId} inexistant`));
    }
  }
  
  // Nettoyer Task
  const tasks = await Task.find({});
  for (const task of tasks) {
    const employee = await Employee.findById(task.employeeId);
    if (!employee) {
      await Task.findByIdAndDelete(task._id);
      tasksOrphaned++;
      console.log(chalk.gray(`  - Task: employeeId ${task.employeeId} inexistant`));
    }
  }
  
  // Nettoyer Incident
  const incidents = await Incident.find({});
  for (const incident of incidents) {
    const employee = await Employee.findById(incident.employeeId);
    if (!employee) {
      await Incident.findByIdAndDelete(incident._id);
      incidentsOrphaned++;
      console.log(chalk.gray(`  - Incident: employeeId ${incident.employeeId} inexistant`));
    }
  }
  
  return { schedules: schedulesOrphaned, vacations: vacationsOrphaned, tasks: tasksOrphaned, incidents: incidentsOrphaned };
}

/**
 * Fonction pour synchroniser User.teamIds avec Employee.teamId
 */
async function syncUserTeamIds(): Promise<number> {
  console.log(chalk.yellow("🔍 Synchronisation des User.teamIds..."));
  
  let fixedCount = 0;
  
  const users = await User.find({});
  
  for (const user of users) {
    // Récupérer toutes les teams de cet utilisateur via ses employés
    const employees = await Employee.find({ 
      userId: user._id, 
      teamId: { $exists: true, $ne: null } 
    });
    
    const actualTeamIds = employees.map(emp => emp.teamId).filter(id => id !== null && id !== undefined);
    const currentTeamIds = user.teamIds || [];
    
    // Comparer les arrays
    const areEqual = actualTeamIds.length === currentTeamIds.length && 
                     actualTeamIds.every(id => currentTeamIds.some(cid => cid.equals(id)));
    
    if (!areEqual) {
      await User.findByIdAndUpdate(user._id, { teamIds: actualTeamIds });
      fixedCount++;
      console.log(chalk.gray(`  - User ${user.email}: teamIds synchronisés`));
    }
  }
  
  return fixedCount;
}

/**
 * Fonction principale de nettoyage
 */
async function cleanupOrphanedData(): Promise<void> {
  let connection: typeof mongoose | undefined;

  try {
    // Connexion à MongoDB
    connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(chalk.blue("🔄 Connexion à la base de données établie"));

    console.log(chalk.yellow("🧹 Démarrage du nettoyage des données orphelines..."));
    
    const stats: CleanupStats = {
      usersOrphaned: 0,
      employeesOrphaned: 0,
      teamsOrphaned: 0,
      weeklySchedulesOrphaned: 0,
      vacationRequestsOrphaned: 0,
      tasksOrphaned: 0,
      incidentsOrphaned: 0,
      eventsOrphaned: 0,
      chatbotInteractionsOrphaned: 0,
      chatbotSettingsOrphaned: 0,
      teamManagersFixed: 0,
      teamEmployeesFixed: 0,
      userTeamIdsFixed: 0
    };

    // Nettoyer dans l'ordre de dépendance
    stats.usersOrphaned = await cleanupOrphanedUsers();
    stats.employeesOrphaned = await cleanupOrphanedEmployees();
    stats.teamsOrphaned = await cleanupOrphanedTeams();
    
    const teamRefs = await cleanupTeamReferences();
    stats.teamManagersFixed = teamRefs.managers;
    stats.teamEmployeesFixed = teamRefs.employees;
    
    const employeeRefs = await cleanupEmployeeRelatedDocuments();
    stats.weeklySchedulesOrphaned = employeeRefs.schedules;
    stats.vacationRequestsOrphaned = employeeRefs.vacations;
    stats.tasksOrphaned = employeeRefs.tasks;
    stats.incidentsOrphaned = employeeRefs.incidents;
    
    stats.userTeamIdsFixed = await syncUserTeamIds();

    // Résumé des résultats
    console.log(chalk.green("\n🎉 Nettoyage terminé avec succès!"));
    console.log(chalk.blue("\n📊 Résumé des corrections:"));
    console.log(chalk.gray(`  • Users orphelins corrigés: ${stats.usersOrphaned}`));
    console.log(chalk.gray(`  • Employees orphelins supprimés: ${stats.employeesOrphaned}`));
    console.log(chalk.gray(`  • Teams orphelines supprimées: ${stats.teamsOrphaned}`));
    console.log(chalk.gray(`  • WeeklySchedules orphelins supprimés: ${stats.weeklySchedulesOrphaned}`));
    console.log(chalk.gray(`  • VacationRequests orphelins supprimés: ${stats.vacationRequestsOrphaned}`));
    console.log(chalk.gray(`  • Tasks orphelines supprimées: ${stats.tasksOrphaned}`));
    console.log(chalk.gray(`  • Incidents orphelins supprimés: ${stats.incidentsOrphaned}`));
    console.log(chalk.gray(`  • Références managers corrigées: ${stats.teamManagersFixed}`));
    console.log(chalk.gray(`  • Références employees corrigées: ${stats.teamEmployeesFixed}`));
    console.log(chalk.gray(`  • User.teamIds synchronisés: ${stats.userTeamIdsFixed}`));
    
    const total = Object.values(stats).reduce((sum, val) => sum + val, 0);
    console.log(chalk.green(`\n✅ Total: ${total} corrections appliquées`));
    
  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors du nettoyage des données orphelines:"),
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
cleanupOrphanedData()
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