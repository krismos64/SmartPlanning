/**
 * Script de génération de plannings réalistes pour SuperMarché Plus
 * 
 * Contraintes :
 * - Magasin ouvert 8h30-19h30 du lundi au samedi
 * - Magasin ouvert 8h30-13h le dimanche
 * - Au moins 2 membres de chaque équipe pendant les heures d'ouverture
 * - Seulement 2 personnes par équipe le dimanche
 * - Samedi : tout le monde présent
 * - Chaque employé a un jour de repos entre lundi et vendredi
 * - Contrats : 35h ou 30h par semaine
 * - Coupures d'au moins 2h le midi possibles
 * 
 * Usage : npx ts-node src/scripts/generate-realistic-schedules.ts
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

// Vérifier la présence de l'URI MongoDB
if (!process.env.MONGODB_URI) {
  console.error(chalk.red("❌ Erreur: Variable d'environnement MONGODB_URI non définie"));
  process.exit(1);
}

// Types pour les plannings
interface EmployeeSchedule {
  employeeId: string;
  teamId: string;
  firstName: string;
  lastName: string;
  contractHours: number;
  dayOff: string; // jour de repos en semaine
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

// Créneaux horaires standards
const TIME_SLOTS = {
  MORNING: { start: "08:30", end: "12:30" },
  AFTERNOON: { start: "14:30", end: "19:30" },
  FULL_DAY: { start: "08:30", end: "19:30" },
  SUNDAY: { start: "08:30", end: "13:00" },
  BREAK: { start: "12:30", end: "14:30" }
};

// Jours de la semaine (clés anglaises pour compatibilité frontend)
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Mapping pour les jours français utilisés dans les jours de repos
const FRENCH_DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const FRENCH_TO_ENGLISH: Record<string, string> = {
  "lundi": "monday",
  "mardi": "tuesday", 
  "mercredi": "wednesday",
  "jeudi": "thursday",
  "vendredi": "friday",
  "samedi": "saturday",
  "dimanche": "sunday"
};

/**
 * Calculer le numéro de semaine ISO
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Calculer les heures travaillées dans une journée
 */
function calculateDayHours(slots: TimeSlot[]): number {
  let totalMinutes = 0;
  for (const slot of slots) {
    const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
    const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
    totalMinutes += endMinutes - startMinutes;
  }
  return totalMinutes / 60;
}

/**
 * Générer un planning pour une équipe sur une journée
 */
function generateTeamDaySchedule(employees: EmployeeSchedule[], day: string): Map<string, TimeSlot[]> {
  const schedule = new Map<string, TimeSlot[]>();
  
  // Filtrer les employés disponibles (pas de jour de repos)
  const availableEmployees = employees.filter(emp => FRENCH_TO_ENGLISH[emp.dayOff] !== day);
  
  if (day === "sunday") {
    // Dimanche : seulement 2 personnes, 8h30-13h (4h30)
    const selectedEmployees = availableEmployees.slice(0, 2);
    selectedEmployees.forEach(emp => {
      schedule.set(emp.employeeId, [TIME_SLOTS.SUNDAY]);
    });
  } else if (day === "saturday") {
    // Samedi : tout le monde présent (11h maximum)
    employees.forEach(emp => {
      if (emp.contractHours === 35) {
        // Contrat 35h : journée complète (11h)
        schedule.set(emp.employeeId, [TIME_SLOTS.FULL_DAY]);
      } else {
        // Contrat 30h : journée réduite (7h)
        schedule.set(emp.employeeId, [TIME_SLOTS.MORNING, { start: "14:30", end: "17:30" }]);
      }
    });
  } else {
    // Jours de semaine : au moins 2 personnes, répartition équilibrée
    const minEmployees = Math.max(2, Math.floor(availableEmployees.length * 0.7));
    const selectedEmployees = availableEmployees.slice(0, minEmployees);
    
    selectedEmployees.forEach((emp, index) => {
      if (emp.contractHours === 35) {
        // Contrat 35h : 7h par jour en moyenne (35h/5 jours = 7h)
        if (index % 2 === 0) {
          // Journée avec coupure : 4h matin + 5h après-midi = 9h
          schedule.set(emp.employeeId, [TIME_SLOTS.MORNING, TIME_SLOTS.AFTERNOON]);
        } else {
          // Journée plus courte : 6h
          schedule.set(emp.employeeId, [{ start: "09:00", end: "15:00" }]);
        }
      } else {
        // Contrat 30h : 6h par jour en moyenne (30h/5 jours = 6h)
        const patterns = [
          [TIME_SLOTS.MORNING], // 4h
          [TIME_SLOTS.AFTERNOON], // 5h
          [{ start: "10:00", end: "16:00" }] // 6h
        ];
        schedule.set(emp.employeeId, patterns[index % patterns.length]);
      }
    });
  }
  
  return schedule;
}

/**
 * Générer un planning hebdomadaire pour une équipe
 */
function generateWeeklyTeamSchedule(employees: EmployeeSchedule[]): Map<string, Map<string, TimeSlot[]>> {
  const weeklySchedule = new Map<string, Map<string, TimeSlot[]>>();
  
  // Attribuer des jours de repos aléatoires (lundi à vendredi)
  const restDays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"];
  employees.forEach((emp, index) => {
    emp.dayOff = restDays[index % restDays.length];
  });
  
  // Initialiser les plannings vides
  employees.forEach(emp => {
    weeklySchedule.set(emp.employeeId, new Map());
    DAYS.forEach(day => {
      weeklySchedule.get(emp.employeeId)!.set(day, []);
    });
  });
  
  // Générer le planning pour chaque employé individuellement
  employees.forEach(emp => {
    const employeeSchedule = weeklySchedule.get(emp.employeeId)!;
    let totalHours = 0;
    const targetHours = emp.contractHours;
    
    // Samedi obligatoire pour tous
    if (emp.contractHours === 35) {
      employeeSchedule.set("saturday", [TIME_SLOTS.FULL_DAY]); // 11h
      totalHours += 11;
    } else {
      employeeSchedule.set("saturday", [TIME_SLOTS.MORNING, { start: "14:30", end: "17:30" }]); // 7h
      totalHours += 7;
    }
    
    // Dimanche : rotation (2 sur 6 employés par équipe)
    const empIndex = employees.findIndex(e => e.employeeId === emp.employeeId);
    if (empIndex < 2) {
      employeeSchedule.set("sunday", [TIME_SLOTS.SUNDAY]); // 4.5h
      totalHours += 4.5;
    }
    
    // Jours de semaine (sauf jour de repos)
    const weekDays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"].filter(d => d !== emp.dayOff);
    const weekDaysEnglish = weekDays.map(d => FRENCH_TO_ENGLISH[d]);
    const remainingHours = targetHours - totalHours;
    const dailyHours = remainingHours / weekDays.length;
    
    weekDaysEnglish.forEach(day => {
      if (dailyHours >= 8) {
        // Journée avec coupure : 4h + 5h = 9h
        employeeSchedule.set(day, [TIME_SLOTS.MORNING, TIME_SLOTS.AFTERNOON]);
      } else if (dailyHours >= 6) {
        // Journée moyenne : 6-7h
        employeeSchedule.set(day, [{ start: "09:00", end: "16:00" }]);
      } else {
        // Demi-journée : 4-5h
        employeeSchedule.set(day, [TIME_SLOTS.MORNING]);
      }
    });
  });
  
  return weeklySchedule;
}

/**
 * Convertir les créneaux en format string[]
 */
function convertSlotsToStrings(slots: TimeSlot[]): string[] {
  return slots.map(slot => `${slot.start}-${slot.end}`);
}

/**
 * Fonction principale
 */
async function generateRealisticSchedules(): Promise<void> {
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

    console.log(chalk.yellow("📅 Génération des plannings réalistes..."));

    // Récupérer les équipes et employés
    const teams = await Team.find({});
    const employees = await Employee.find({});

    if (teams.length === 0) {
      console.log(chalk.red("❌ Aucune équipe trouvée"));
      return;
    }

    // Supprimer les anciens plannings
    console.log(chalk.cyan("🗑️ Suppression des anciens plannings..."));
    await WeeklySchedule.deleteMany({});

    // Préparer les données des employés par équipe
    const employeesByTeam = new Map<string, EmployeeSchedule[]>();
    
    for (const team of teams) {
      const teamEmployees: EmployeeSchedule[] = [];
      
      for (const employeeId of team.employeeIds) {
        const employee = await Employee.findById(employeeId);
        if (employee) {
          teamEmployees.push({
            employeeId: employee._id.toString(),
            teamId: team._id.toString(),
            firstName: employee.firstName,
            lastName: employee.lastName,
            contractHours: Math.random() < 0.8 ? 35 : 30, // 80% en 35h, 20% en 30h
            dayOff: "" // Sera défini lors de la génération
          });
        }
      }
      
      employeesByTeam.set(team._id.toString(), teamEmployees);
    }

    // Générer les plannings pour 3 semaines
    const today = new Date();
    const weeks = [
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Semaine passée
      new Date(today.getTime()),                           // Semaine actuelle
      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Semaine prochaine
    ];

    let totalSchedulesCreated = 0;

    for (const weekDate of weeks) {
      const weekNumber = getWeekNumber(weekDate);
      const year = weekDate.getFullYear();
      
      console.log(chalk.cyan(`📅 Génération des plannings pour la semaine ${weekNumber}/${year}...`));

      for (const [teamId, teamEmployees] of employeesByTeam) {
        const weeklySchedule = generateWeeklyTeamSchedule(teamEmployees);
        
        for (const [employeeId, employeeWeekSchedule] of weeklySchedule) {
          const scheduleData = new Map<string, string[]>();
          const dailyDates = new Map<string, Date>();
          let totalWeeklyMinutes = 0;

          // Calculer les dates de chaque jour
          const mondayOfWeek = new Date(weekDate);
          mondayOfWeek.setDate(weekDate.getDate() - weekDate.getDay() + 1);

          DAYS.forEach((day, index) => {
            const dayDate = new Date(mondayOfWeek);
            dayDate.setDate(mondayOfWeek.getDate() + index);
            dailyDates.set(day, dayDate);

            const slots = employeeWeekSchedule.get(day) || [];
            const stringSlots = convertSlotsToStrings(slots);
            scheduleData.set(day, stringSlots);

            // Calculer les minutes travaillées
            const dayHours = calculateDayHours(slots);
            totalWeeklyMinutes += dayHours * 60;
          });

          // Créer le planning en base
          const team = teams.find(t => t._id.toString() === teamId);
          const managerId = team?.managerIds && team.managerIds.length > 0 ? team.managerIds[0] : null;
          
          await WeeklySchedule.create({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            year,
            weekNumber,
            scheduleData,
            dailyDates,
            totalWeeklyMinutes,
            status: "approved",
            updatedBy: managerId,
            notes: "Planning généré automatiquement avec contraintes réalistes"
          });

          totalSchedulesCreated++;
        }
      }
    }

    console.log(chalk.green(`✅ ${totalSchedulesCreated} plannings réalistes créés`));

    // Afficher un résumé
    console.log(chalk.blue("\n📊 Résumé des plannings générés:"));
    console.log(chalk.gray(`  • Équipes: ${teams.length}`));
    console.log(chalk.gray(`  • Employés total: ${employees.length}`));
    console.log(chalk.gray(`  • Semaines générées: 3 (passée, actuelle, prochaine)`));
    console.log(chalk.gray(`  • Plannings créés: ${totalSchedulesCreated}`));
    console.log(chalk.gray(`  • Horaires magasin: 8h30-19h30 (lun-sam), 8h30-13h (dim)`));
    console.log(chalk.gray(`  • Couverture: Min 2 personnes/équipe, tout le monde le samedi`));

  } catch (error: unknown) {
    console.error(
      chalk.red("❌ Erreur lors de la génération des plannings:"),
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
generateRealisticSchedules()
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