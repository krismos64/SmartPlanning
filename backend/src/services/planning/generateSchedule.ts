/**
 * Service de génération automatique de planning hebdomadaire
 * 
 * Ce service utilise jsLPSolver pour résoudre les contraintes de planification
 * et générer un planning optimal pour chaque employé en respectant :
 * - Les heures contractuelles
 * - Les exceptions (congés, absences)
 * - Les préférences des employés
 * - Les contraintes de l'entreprise
 * 
 * @author SmartPlanning Team
 * @version 1.0.0
 */

import * as solver from 'javascript-lp-solver';

// Interface pour les paramètres d'entrée du générateur de planning
interface GeneratePlanningInput {
  employees: {
    _id: string;
    contractHoursPerWeek: number;
    exceptions?: {
      date: string; // ISO format (YYYY-MM-DD)
      type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
    }[];
    preferences?: {
      preferredDays?: string[]; // ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
      preferredHours?: string[]; // ["09:00-17:00", "14:00-22:00"]
    };
  }[];
  weekNumber: number;
  year: number;
  companyConstraints?: {
    openDays?: string[]; // Jours d'ouverture de l'entreprise
    openHours?: string[]; // Heures d'ouverture (format "HH:MM-HH:MM")
    minEmployeesPerSlot?: number; // Nombre minimum d'employés par créneau
  };
}

// Interface pour le planning généré
interface GeneratedPlanning {
  [employeeId: string]: {
    [day: string]: {
      start: string; // Format "HH:MM"
      end: string;   // Format "HH:MM"
    }[];
  };
}

// Interface pour les créneaux horaires
interface TimeSlot {
  start: string;
  end: string;
  duration: number; // en heures
}

// Jours de la semaine dans l'ordre
const DAYS_OF_WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Créneaux horaires par défaut (8h-12h et 14h-18h)
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '08:00', end: '12:00', duration: 4 },
  { start: '14:00', end: '18:00', duration: 4 }
];

/**
 * Génère un planning hebdomadaire optimal pour tous les employés
 * @param input Paramètres de génération du planning
 * @returns Planning généré par employé et par jour
 */
export function generatePlanning(input: GeneratePlanningInput): GeneratedPlanning {
  try {
    // Validation des paramètres d'entrée
    if (!input.employees || input.employees.length === 0) {
      throw new Error('Aucun employé fourni pour la génération du planning');
    }

    // Calcul des dates de la semaine à partir du numéro de semaine
    const weekDates = getWeekDates(input.weekNumber, input.year);
    
    // Génération des créneaux horaires disponibles
    const availableSlots = generateTimeSlots(input.companyConstraints);
    
    // Préparation des données pour le solveur
    const solverModel = buildSolverModel(input.employees, weekDates, availableSlots, input.companyConstraints);
    
    // Résolution du problème d'optimisation
    const solution = solver.Solve(solverModel);
    
    // Conversion de la solution en planning lisible
    if (solution.feasible) {
      return buildPlanningFromSolution(solution, input.employees, availableSlots);
    } else {
      // Fallback : génération d'un planning simple sans optimisation
      console.warn('Aucune solution optimale trouvée, utilisation du fallback');
      return generateFallbackPlanning(input.employees, availableSlots, weekDates);
    }
    
  } catch (error) {
    console.error('Erreur lors de la génération du planning:', error);
    // Fallback en cas d'erreur
    return generateFallbackPlanning(input.employees, DEFAULT_TIME_SLOTS, getWeekDates(input.weekNumber, input.year));
  }
}

/**
 * Calcule les dates de la semaine à partir du numéro de semaine et de l'année
 * @param weekNumber Numéro de la semaine (1-53)
 * @param year Année
 * @returns Tableau des dates de la semaine
 */
function getWeekDates(weekNumber: number, year: number): Date[] {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7;
  const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  
  // Ajustement pour commencer le lundi
  const dayOfWeek = weekStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
}

/**
 * Génère les créneaux horaires disponibles selon les contraintes de l'entreprise
 * @param constraints Contraintes de l'entreprise
 * @returns Tableau des créneaux disponibles
 */
function generateTimeSlots(constraints?: GeneratePlanningInput['companyConstraints']): TimeSlot[] {
  if (!constraints?.openHours || constraints.openHours.length === 0) {
    return DEFAULT_TIME_SLOTS;
  }
  
  const slots: TimeSlot[] = [];
  
  for (const hourRange of constraints.openHours) {
    const [start, end] = hourRange.split('-');
    const startHour = parseFloat(start.replace(':', '.'));
    const endHour = parseFloat(end.replace(':', '.'));
    const duration = endHour - startHour;
    
    if (duration > 0) {
      slots.push({
        start,
        end,
        duration
      });
    }
  }
  
  return slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
}

/**
 * Construit le modèle pour le solveur linéaire
 * @param employees Liste des employés
 * @param weekDates Dates de la semaine
 * @param timeSlots Créneaux horaires disponibles
 * @param constraints Contraintes de l'entreprise
 * @returns Modèle pour le solveur
 */
function buildSolverModel(
  employees: GeneratePlanningInput['employees'],
  weekDates: Date[],
  timeSlots: TimeSlot[],
  constraints?: GeneratePlanningInput['companyConstraints']
): any {
  const model: any = {
    optimize: 'satisfaction',
    opType: 'max',
    constraints: {},
    variables: {}
  };
  
  // Génération des variables de décision
  for (const employee of employees) {
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
      const day = DAYS_OF_WEEK[dayIndex];
      const date = weekDates[dayIndex];
      
      // Vérification des exceptions (congés, absences)
      const hasException = employee.exceptions?.some(exception => {
        const exceptionDate = new Date(exception.date);
        return (
          exceptionDate.toDateString() === date.toDateString() &&
          ['vacation', 'sick', 'unavailable'].includes(exception.type)
        );
      });
      
      if (hasException) {
        continue; // Skip ce jour pour cet employé
      }
      
      // Vérification des jours d'ouverture de l'entreprise
      if (constraints?.openDays && !constraints.openDays.includes(day)) {
        continue; // Skip ce jour si l'entreprise est fermée
      }
      
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const slot = timeSlots[slotIndex];
        const varName = `assign_${employee._id}_${day}_${slotIndex}`;
        
        // Coefficient de satisfaction (préférence)
        let satisfaction = 1;
        
        // Bonus si c'est un jour préféré
        if (employee.preferences?.preferredDays?.includes(day)) {
          satisfaction += 2;
        }
        
        // Bonus si c'est une heure préférée
        if (employee.preferences?.preferredHours?.some(preferred => {
          const [prefStart] = preferred.split('-');
          return prefStart === slot.start;
        })) {
          satisfaction += 1;
        }
        
        model.variables[varName] = {
          satisfaction: satisfaction,
          [varName]: 1 // Coefficient dans les contraintes
        };
      }
    }
  }
  
  // Contraintes d'heures contractuelles par employé
  for (const employee of employees) {
    const constraintName = `hours_${employee._id}`;
    model.constraints[constraintName] = {
      max: employee.contractHoursPerWeek,
      min: Math.max(0, employee.contractHoursPerWeek - 4) // Tolérance de 4h
    };
    
    // Ajout des variables correspondantes à cette contrainte
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
      const day = DAYS_OF_WEEK[dayIndex];
      
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const varName = `assign_${employee._id}_${day}_${slotIndex}`;
        if (model.variables[varName]) {
          model.constraints[constraintName][varName] = timeSlots[slotIndex].duration;
        }
      }
    }
  }
  
  // Contrainte de nombre minimum d'employés par créneau
  if (constraints?.minEmployeesPerSlot && constraints.minEmployeesPerSlot > 0) {
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
      const day = DAYS_OF_WEEK[dayIndex];
      
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        const constraintName = `min_employees_${day}_${slotIndex}`;
        model.constraints[constraintName] = {
          min: constraints.minEmployeesPerSlot
        };
        
        // Ajout de tous les employés disponibles pour ce créneau
        for (const employee of employees) {
          const varName = `assign_${employee._id}_${day}_${slotIndex}`;
          if (model.variables[varName]) {
            model.constraints[constraintName][varName] = 1;
          }
        }
      }
    }
  }
  
  return model;
}

/**
 * Construit le planning final à partir de la solution du solveur
 * @param solution Solution du solveur
 * @param employees Liste des employés
 * @param timeSlots Créneaux horaires
 * @returns Planning généré
 */
function buildPlanningFromSolution(
  solution: any,
  employees: GeneratePlanningInput['employees'],
  timeSlots: TimeSlot[]
): GeneratedPlanning {
  const planning: GeneratedPlanning = {};
  
  // Initialisation du planning pour chaque employé
  for (const employee of employees) {
    planning[employee._id] = {};
    for (const day of DAYS_OF_WEEK) {
      planning[employee._id][day] = [];
    }
  }
  
  // Parcours de la solution pour construire le planning
  for (const [varName, value] of Object.entries(solution)) {
    if (typeof value === 'number' && value > 0.5 && varName.startsWith('assign_')) {
      const parts = varName.split('_');
      if (parts.length === 4) {
        const [, employeeId, day, slotIndexStr] = parts;
        const slotIndex = parseInt(slotIndexStr, 10);
        
        if (slotIndex < timeSlots.length) {
          const slot = timeSlots[slotIndex];
          planning[employeeId][day].push({
            start: slot.start,
            end: slot.end
          });
        }
      }
    }
  }
  
  return planning;
}

/**
 * Génère un planning de fallback simple sans optimisation
 * @param employees Liste des employés
 * @param timeSlots Créneaux horaires disponibles
 * @param weekDates Dates de la semaine
 * @returns Planning de fallback
 */
function generateFallbackPlanning(
  employees: GeneratePlanningInput['employees'],
  timeSlots: TimeSlot[],
  weekDates: Date[]
): GeneratedPlanning {
  const planning: GeneratedPlanning = {};
  
  for (const employee of employees) {
    planning[employee._id] = {};
    let remainingHours = employee.contractHoursPerWeek;
    
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length && remainingHours > 0; dayIndex++) {
      const day = DAYS_OF_WEEK[dayIndex];
      const date = weekDates[dayIndex];
      
      planning[employee._id][day] = [];
      
      // Vérification des exceptions
      const hasException = employee.exceptions?.some(exception => {
        const exceptionDate = new Date(exception.date);
        return (
          exceptionDate.toDateString() === date.toDateString() &&
          ['vacation', 'sick', 'unavailable'].includes(exception.type)
        );
      });
      
      if (hasException) {
        continue;
      }
      
      // Attribution des créneaux jusqu'à épuisement des heures
      for (const slot of timeSlots) {
        if (remainingHours >= slot.duration) {
          planning[employee._id][day].push({
            start: slot.start,
            end: slot.end
          });
          remainingHours -= slot.duration;
        }
      }
    }
  }
  
  return planning;
}