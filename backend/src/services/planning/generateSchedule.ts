/**
 * Service de génération automatique de planning hebdomadaire
 * 
 * Ce service utilise un moteur de planification personnalisé optimisé pour
 * générer un planning optimal pour chaque employé en respectant :
 * - Les heures contractuelles
 * - Les exceptions (congés, absences)
 * - Les préférences des employés
 * - Les contraintes de l'entreprise
 * - La législation du travail
 * 
 * @author SmartPlanning Team
 * @version 2.0.0 - Moteur personnalisé
 */

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
      allowSplitShifts?: boolean; // Autorise les créneaux fractionnés
      maxConsecutiveDays?: number; // Maximum de jours consécutifs
    };
  }[];
  weekNumber: number;
  year: number;
  companyConstraints?: {
    openDays?: string[]; // Jours d'ouverture de l'entreprise
    openHours?: string[]; // Heures d'ouverture (format "HH:MM-HH:MM")
    minEmployeesPerSlot?: number; // Nombre minimum d'employés par créneau
    maxHoursPerDay?: number; // Maximum d'heures par jour
    minHoursPerDay?: number; // Minimum d'heures par jour
    mandatoryLunchBreak?: boolean; // Pause déjeuner obligatoire
    lunchBreakDuration?: number; // Durée pause déjeuner en minutes
  };
}

// Interface pour le planning généré
interface GeneratedPlanning {
  [employeeId: string]: {
    [day: string]: {
      start: string; // Format "HH:MM"
      end: string;   // Format "HH:MM"
      isLunchBreak?: boolean; // Indique si c'est une pause déjeuner
    }[];
  };
}

// Interface pour les créneaux horaires
interface TimeSlot {
  start: string;
  end: string;
  duration: number; // en heures
  day: string;
  isLunchBreak?: boolean;
}

// Interface pour la validation
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Jours de la semaine dans l'ordre
const DAYS_OF_WEEK = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Créneaux horaires par défaut avec pause déjeuner
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start: '08:00', end: '12:00', duration: 4, day: 'lundi' },
  { start: '12:00', end: '13:00', duration: 1, day: 'lundi', isLunchBreak: true },
  { start: '13:00', end: '17:00', duration: 4, day: 'lundi' }
];

/**
 * Moteur de planification avancé personnalisé
 */
class AdvancedSchedulingEngine {
  private input: GeneratePlanningInput;
  private weekDates: Date[];
  private availableSlots: TimeSlot[];
  
  constructor(input: GeneratePlanningInput) {
    this.input = input;
    this.weekDates = this.getWeekDates(input.weekNumber, input.year);
    this.availableSlots = this.generateTimeSlots();
  }

  /**
   * Génère un planning optimal
   */
  generateOptimalSchedule(): GeneratedPlanning {
    try {
      // 1. Validation des paramètres d'entrée
      const validation = this.validateInput();
      if (!validation.isValid) {
        console.warn('Paramètres invalides:', validation.errors);
        return this.generateFallbackPlanning();
      }

      // 2. Génération des candidats d'horaires
      const candidateSchedules = this.generateCandidateSchedules();

      // 3. Optimisation par algorithme personnalisé
      const optimizedSchedule = this.optimizeSchedule(candidateSchedules);

      // 4. Validation finale du planning généré
      const finalValidation = this.validateGeneratedPlanning(optimizedSchedule);
      if (!finalValidation.isValid) {
        console.warn('Planning généré invalide:', finalValidation.errors);
        return this.generateFallbackPlanning();
      }

      return optimizedSchedule;

    } catch (error) {
      console.error('Erreur lors de la génération du planning:', error);
      return this.generateFallbackPlanning();
    }
  }

  /**
   * Valide les paramètres d'entrée
   */
  private validateInput(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.input.employees || this.input.employees.length === 0) {
      errors.push('Aucun employé fourni pour la génération du planning');
    }

    if (this.input.weekNumber < 1 || this.input.weekNumber > 53) {
      errors.push('Numéro de semaine invalide');
    }

    // Validation des heures contractuelles
    this.input.employees.forEach(emp => {
      if (emp.contractHoursPerWeek < 0 || emp.contractHoursPerWeek > 60) {
        warnings.push(`Heures contractuelles suspectes pour l'employé ${emp._id}: ${emp.contractHoursPerWeek}h`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Génère les créneaux horaires disponibles
   */
  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const constraints = this.input.companyConstraints;

    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
      const day = DAYS_OF_WEEK[dayIndex];
      
      // Vérifier si l'entreprise est ouverte ce jour
      if (constraints?.openDays && !constraints.openDays.includes(day)) {
        continue;
      }

      // Utiliser les heures d'ouverture spécifiées ou par défaut
      const dayHours = constraints?.openHours || ['08:00-12:00', '13:00-17:00'];
      
      for (const hourRange of dayHours) {
        const [start, end] = hourRange.split('-');
        const startTime = this.parseTimeToDecimal(start);
        const endTime = this.parseTimeToDecimal(end);
        const duration = endTime - startTime;

        if (duration > 0) {
          slots.push({
            start,
            end,
            duration,
            day
          });

          // Ajouter une pause déjeuner si nécessaire
          if (constraints?.mandatoryLunchBreak && duration >= 6) {
            const lunchStart = this.addMinutesToTime(start, duration * 60 / 2);
            const lunchEnd = this.addMinutesToTime(lunchStart, constraints.lunchBreakDuration || 60);
            
            slots.push({
              start: lunchStart,
              end: lunchEnd,
              duration: (constraints.lunchBreakDuration || 60) / 60,
              day,
              isLunchBreak: true
            });
          }
        }
      }
    }

    return slots.length > 0 ? slots : this.generateDefaultSlots();
  }

  /**
   * Génère des candidats d'horaires pour chaque employé
   */
  private generateCandidateSchedules(): Map<string, GeneratedPlanning> {
    const candidates = new Map<string, GeneratedPlanning>();
    
    for (const employee of this.input.employees) {
      // Génération de plusieurs candidats par employé
      for (let i = 0; i < 3; i++) {
        const candidate = this.generateEmployeeSchedule(employee, i);
        candidates.set(`${employee._id}_${i}`, { [employee._id]: candidate });
      }
    }

    return candidates;
  }

  /**
   * Génère un planning pour un employé spécifique
   */
  private generateEmployeeSchedule(employee: GeneratePlanningInput['employees'][0], variant: number): any {
    const schedule: any = {};
    let remainingHours = employee.contractHoursPerWeek;

    // Initialiser les jours
    for (const day of DAYS_OF_WEEK) {
      schedule[day] = [];
    }

    // Stratégies différentes selon le variant
    const strategies = [
      this.distributeEvenly.bind(this),
      this.favorPreferences.bind(this),
      this.concentrateHours.bind(this)
    ];

    return strategies[variant](employee, schedule, remainingHours);
  }

  /**
   * Stratégie 1: Distribution uniforme des heures
   */
  private distributeEvenly(employee: any, schedule: any, remainingHours: number): any {
    const workingDays = this.getAvailableDaysForEmployee(employee);
    console.log(`Jours disponibles pour ${employee._id}:`, workingDays);
    
    if (workingDays.length === 0) {
      console.log(`Aucun jour disponible pour ${employee._id}`);
      return schedule;
    }
    
    const hoursPerDay = Math.min(
      remainingHours / workingDays.length,
      this.input.companyConstraints?.maxHoursPerDay || 8
    );

    for (const day of workingDays) {
      if (remainingHours <= 0) break;
      
      if (!this.isEmployeeAvailable(employee, day)) {
        console.log(`Employé ${employee._id} non disponible le ${day}`);
        continue;
      }
      
      const daySlots = this.availableSlots.filter(slot => slot.day === day && !slot.isLunchBreak);
      let dayHours = Math.min(hoursPerDay, remainingHours);
      
      console.log(`Planification ${employee._id} le ${day}: ${dayHours}h à répartir`);

      // Créer un créneau continu si pas de créneaux fractionnés autorisés
      if (employee.preferences?.allowSplitShifts === false && dayHours > 0) {
        const maxContinuousHours = Math.min(dayHours, 8);
        schedule[day].push({
          start: '08:00',
          end: this.addHoursToTime('08:00', maxContinuousHours)
        });
        remainingHours -= maxContinuousHours;
      } else {
        // Répartir sur les créneaux disponibles
        for (const slot of daySlots) {
          if (dayHours <= 0) break;
          const hours = Math.min(slot.duration, dayHours);
          schedule[day].push({
            start: slot.start,
            end: this.addHoursToTime(slot.start, hours)
          });
          dayHours -= hours;
          remainingHours -= hours;
        }
      }
    }

    return schedule;
  }

  /**
   * Stratégie 2: Favoriser les préférences employé
   */
  private favorPreferences(employee: any, schedule: any, remainingHours: number): any {
    const preferredDays = employee.preferences?.preferredDays || DAYS_OF_WEEK;
    
    // Trier les jours par préférence
    const sortedDays = DAYS_OF_WEEK.sort((a, b) => {
      const aPreferred = preferredDays.includes(a) ? 1 : 0;
      const bPreferred = preferredDays.includes(b) ? 1 : 0;
      return bPreferred - aPreferred;
    });

    for (const day of sortedDays) {
      if (remainingHours <= 0) break;
      
      if (this.isEmployeeAvailable(employee, day)) {
        const maxDayHours = this.input.companyConstraints?.maxHoursPerDay || 8;
        let dayHours = Math.min(maxDayHours, remainingHours);

        const daySlots = this.availableSlots.filter(slot => slot.day === day && !slot.isLunchBreak);
        
        for (const slot of daySlots) {
          if (dayHours <= 0) break;
          const hours = Math.min(slot.duration, dayHours);
          schedule[day].push({
            start: slot.start,
            end: this.addHoursToTime(slot.start, hours)
          });
          dayHours -= hours;
          remainingHours -= hours;
        }
      }
    }

    return schedule;
  }

  /**
   * Stratégie 3: Concentrer les heures sur moins de jours
   */
  private concentrateHours(employee: any, schedule: any, remainingHours: number): any {
    const availableDays = this.getAvailableDaysForEmployee(employee);
    const maxDayHours = this.input.companyConstraints?.maxHoursPerDay || 8;

    for (const day of availableDays) {
      if (remainingHours <= 0) break;
      
      let dayHours = Math.min(maxDayHours, remainingHours);
      const daySlots = this.availableSlots.filter(slot => slot.day === day && !slot.isLunchBreak);

      for (const slot of daySlots) {
        if (dayHours <= 0) break;
        const hours = Math.min(slot.duration, dayHours);
        schedule[day].push({
          start: slot.start,
          end: this.addHoursToTime(slot.start, hours)
        });
        dayHours -= hours;
        remainingHours -= hours;
      }
    }

    return schedule;
  }

  /**
   * Optimise le planning en combinant les meilleurs candidats
   */
  private optimizeSchedule(candidates: Map<string, GeneratedPlanning>): GeneratedPlanning {
    const finalPlanning: GeneratedPlanning = {};

    // Pour chaque employé, choisir le meilleur candidat
    for (const employee of this.input.employees) {
      let bestCandidate = null;
      let bestScore = -1;

      for (let i = 0; i < 3; i++) {
        const candidateKey = `${employee._id}_${i}`;
        const candidate = candidates.get(candidateKey);
        
        if (candidate) {
          const score = this.scorePlanningCandidate(candidate[employee._id], employee);
          if (score > bestScore) {
            bestScore = score;
            bestCandidate = candidate[employee._id];
          }
        }
      }

      if (bestCandidate) {
        finalPlanning[employee._id] = bestCandidate;
      }
    }

    return finalPlanning;
  }

  /**
   * Évalue la qualité d'un candidat de planning
   */
  private scorePlanningCandidate(schedule: any, employee: any): number {
    let score = 0;

    // Score basé sur le respect des heures contractuelles
    const totalHours = this.calculateTotalHours(schedule);
    const targetHours = employee.contractHoursPerWeek;
    const hoursAccuracy = 1 - Math.abs(totalHours - targetHours) / targetHours;
    score += hoursAccuracy * 50;

    // Score basé sur les préférences
    if (employee.preferences?.preferredDays) {
      const workingDays = Object.keys(schedule).filter(day => schedule[day].length > 0);
      const preferredWorkingDays = workingDays.filter(day => 
        employee.preferences.preferredDays.includes(day)
      );
      score += (preferredWorkingDays.length / workingDays.length) * 30;
    }

    // Score basé sur la distribution des heures
    const dailyHours = Object.values(schedule).map((slots: any) => 
      this.calculateDayHours(slots)
    );
    const variance = this.calculateVariance(dailyHours);
    score += Math.max(0, 20 - variance); // Favorise la régularité

    return score;
  }

  /**
   * Valide le planning généré
   */
  private validateGeneratedPlanning(planning: GeneratedPlanning): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [employeeId, schedule] of Object.entries(planning)) {
      const employee = this.input.employees.find(emp => emp._id === employeeId);
      if (!employee) continue;

      // Validation des heures contractuelles
      const totalHours = this.calculateTotalHours(schedule);
      const targetHours = employee.contractHoursPerWeek;
      const tolerance = targetHours * 0.1; // 10% de tolérance

      if (Math.abs(totalHours - targetHours) > tolerance) {
        warnings.push(`Écart d'heures pour ${employeeId}: ${totalHours}h vs ${targetHours}h attendues`);
      }

      // Validation des repos légaux (11h minimum entre deux services)
      for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length - 1; dayIndex++) {
        const today = DAYS_OF_WEEK[dayIndex];
        const tomorrow = DAYS_OF_WEEK[dayIndex + 1];
        
        const todaySlots = schedule[today] || [];
        const tomorrowSlots = schedule[tomorrow] || [];

        if (todaySlots.length > 0 && tomorrowSlots.length > 0) {
          const lastToday = todaySlots[todaySlots.length - 1];
          const firstTomorrow = tomorrowSlots[0];
          
          const restHours = this.calculateRestBetweenShifts(lastToday.end, firstTomorrow.start);
          if (restHours < 11) {
            errors.push(`Repos insuffisant pour ${employeeId} entre ${today} et ${tomorrow}: ${restHours}h`);
          }
        }
      }

      // Validation des créneaux fractionnés
      if (employee.preferences?.allowSplitShifts === false) {
        for (const day of DAYS_OF_WEEK) {
          const daySlots = schedule[day] || [];
          
          // Vérifier s'il y a vraiment des créneaux fractionnés (non-consécutifs)
          if (daySlots.length > 1) {
            // Trier les créneaux par heure de début
            const sortedSlots = [...daySlots].sort((a, b) => 
              this.parseTimeToDecimal(a.start) - this.parseTimeToDecimal(b.start)
            );
            
            // Vérifier s'il y a des gaps entre les créneaux
            let hasSplitShifts = false;
            for (let i = 0; i < sortedSlots.length - 1; i++) {
              const currentEnd = this.parseTimeToDecimal(sortedSlots[i].end);
              const nextStart = this.parseTimeToDecimal(sortedSlots[i + 1].start);
              
              // Si il y a un gap > 15 minutes, c'est considéré comme fractionné
              if (nextStart - currentEnd > 0.25) {
                hasSplitShifts = true;
                break;
              }
            }
            
            if (hasSplitShifts) {
              errors.push(`Créneaux fractionnés non autorisés pour ${employeeId} le ${day}`);
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Méthodes utilitaires
  private getWeekDates(weekNumber: number, year: number): Date[] {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
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

  private parseTimeToDecimal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private addHoursToTime(time: string, hours: number): string {
    return this.addMinutesToTime(time, hours * 60);
  }

  private isEmployeeAvailable(employee: any, day: string, slot?: TimeSlot): boolean {
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    if (dayIndex === -1) return false;

    const date = this.weekDates[dayIndex];
    
    // Vérifier les exceptions
    const hasException = employee.exceptions?.some((exception: any) => {
      const exceptionDate = new Date(exception.date);
      const isSameDate = exceptionDate.toDateString() === date.toDateString();
      const isBlockingType = ['vacation', 'sick', 'unavailable'].includes(exception.type);
      
      console.log(`Vérification exception pour ${employee._id} le ${day}:`, {
        exceptionDate: exceptionDate.toDateString(),
        currentDate: date.toDateString(),
        isSameDate,
        exceptionType: exception.type,
        isBlockingType
      });
      
      return isSameDate && isBlockingType;
    });
    
    console.log(`Employé ${employee._id} disponible le ${day}:`, !hasException);
    return !hasException;
  }

  private getAvailableDaysForEmployee(employee: any): string[] {
    return DAYS_OF_WEEK.filter(day => this.isEmployeeAvailable(employee, day));
  }

  private calculateTotalHours(schedule: any): number {
    return Object.values(schedule).reduce((total: number, daySlots: any) => {
      return total + this.calculateDayHours(daySlots);
    }, 0);
  }

  private calculateDayHours(slots: any[]): number {
    return slots.reduce((total, slot) => {
      const start = this.parseTimeToDecimal(slot.start);
      const end = this.parseTimeToDecimal(slot.end);
      return total + (end - start);
    }, 0);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateRestBetweenShifts(endTime: string, startTime: string): number {
    const end = this.parseTimeToDecimal(endTime);
    const start = this.parseTimeToDecimal(startTime);
    let rest = start - end;
    if (rest < 0) rest += 24; // Gestion du passage de jour
    return rest;
  }

  private generateDefaultSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (const day of DAYS_OF_WEEK) {
      slots.push(
        { start: '08:00', end: '12:00', duration: 4, day },
        { start: '14:00', end: '18:00', duration: 4, day }
      );
    }
    return slots;
  }

  /**
   * Génère un planning de fallback simple
   */
  private generateFallbackPlanning(): GeneratedPlanning {
    const planning: GeneratedPlanning = {};
    
    for (const employee of this.input.employees) {
      planning[employee._id] = {};
      let remainingHours = employee.contractHoursPerWeek;
      
      for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length && remainingHours > 0; dayIndex++) {
        const day = DAYS_OF_WEEK[dayIndex];
        planning[employee._id][day] = [];
        
        if (this.isEmployeeAvailable(employee, day)) {
          const dayHours = Math.min(8, remainingHours);
          if (dayHours >= 4) {
            planning[employee._id][day].push({
              start: '08:00',
              end: this.addHoursToTime('08:00', dayHours)
            });
            remainingHours -= dayHours;
          }
        }
      }
    }
    
    return planning;
  }
}

/**
 * Fonction principale de génération de planning
 * Compatible avec l'ancienne API pour la transition
 */
export function generatePlanning(input: GeneratePlanningInput): GeneratedPlanning {
  const engine = new AdvancedSchedulingEngine(input);
  return engine.generateOptimalSchedule();
}