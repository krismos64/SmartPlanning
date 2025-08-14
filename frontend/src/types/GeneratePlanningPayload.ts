/**
 * Types TypeScript pour le nouveau système de génération de planning IA
 * Basés sur l'interface GeneratePlanningInput du backend
 * 
 * @version 2.1.0 - Interface complètement restructurée
 */

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  contractHoursPerWeek: number;
  exceptions?: EmployeeException[];
  preferences?: EmployeePreferences;
  restDay?: string; // Jour de repos obligatoire en anglais (monday, tuesday, etc.)
}

export interface EmployeeException {
  date: string; // Format ISO (YYYY-MM-DD)
  type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
  description?: string;
}

export interface EmployeePreferences {
  preferredDays?: string[]; // Jours français: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
  preferredHours?: string[]; // Format "HH:MM-HH:MM": ["09:00-17:00", "14:00-22:00"]
  allowSplitShifts?: boolean; // Autorise les créneaux fractionnés
  maxConsecutiveDays?: number; // Maximum de jours consécutifs (défaut: 5)
}

export interface CompanyConstraints {
  openDays?: string[]; // Jours d'ouverture en anglais: ["monday", "tuesday", ...]
  openHours?: string[]; // Heures d'ouverture format "HH:MM-HH:MM"
  minEmployeesPerSlot?: number; // Nombre minimum d'employés par créneau
  maxHoursPerDay?: number; // Maximum d'heures par jour (défaut: 8)
  minHoursPerDay?: number; // Minimum d'heures par jour (défaut: 2)
  mandatoryLunchBreak?: boolean; // Pause déjeuner obligatoire
  lunchBreakDuration?: number; // Durée pause déjeuner en minutes (défaut: 60)
}

/**
 * Interface principale pour le payload envoyé à l'API de génération
 */
export interface GeneratePlanningPayload {
  employees: {
    _id: string;
    contractHoursPerWeek: number;
    exceptions?: {
      date: string;
      type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
    }[];
    preferences?: {
      preferredDays?: string[];
      preferredHours?: string[];
      allowSplitShifts?: boolean;
      maxConsecutiveDays?: number;
    };
    restDay?: string;
  }[];
  weekNumber: number;
  year: number;
  companyConstraints?: CompanyConstraints;
}

/**
 * Interface pour le planning généré retourné par l'API
 */
export interface GeneratedPlanning {
  [employeeId: string]: {
    [day: string]: {
      start: string; // Format "HH:MM"
      end: string;   // Format "HH:MM"
      isLunchBreak?: boolean; // Indique si c'est une pause déjeuner
    }[];
  };
}

/**
 * Interface pour les statistiques du planning généré
 */
export interface PlanningStats {
  totalHours: number;
  averageHoursPerEmployee: number;
  employeeSatisfaction: number; // Score 0-100
  constraintCompliance: number; // Score 0-100
  warnings: string[];
  errors: string[];
}

/**
 * Interface pour les données internes du wizard
 */
export interface WizardData {
  teamId: string;
  selectedEmployees: Employee[];
  weekNumber: number;
  year: number;
  companyConstraints: CompanyConstraints;
  currentStep: number;
  isValid: boolean;
}

/**
 * Types pour les étapes du wizard
 */
export type WizardStepId = 
  | 'team-selection'
  | 'employee-selection' 
  | 'absences'
  | 'preferences'
  | 'company-constraints'
  | 'summary'
  | 'results';

export interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
  icon: any; // Lucide React Icon
  isCompleted: boolean;
  isOptional?: boolean;
}

/**
 * Utilitaires pour la conversion de données
 */
export const DAYS_MAPPING = {
  // Français vers anglais
  'lundi': 'monday',
  'mardi': 'tuesday',
  'mercredi': 'wednesday',
  'jeudi': 'thursday',
  'vendredi': 'friday',
  'samedi': 'saturday',
  'dimanche': 'sunday',
  
  // Anglais vers français
  'monday': 'lundi',
  'tuesday': 'mardi',
  'wednesday': 'mercredi',
  'thursday': 'jeudi',
  'friday': 'vendredi',
  'saturday': 'samedi',
  'sunday': 'dimanche'
} as const;

/**
 * Fonction utilitaire pour convertir les jours français vers anglais
 */
export function convertDaysToEnglish(frenchDays: string[]): string[] {
  return frenchDays.map(day => DAYS_MAPPING[day as keyof typeof DAYS_MAPPING] || day);
}

/**
 * Fonction utilitaire pour convertir les jours anglais vers français
 */
export function convertDaysToFrench(englishDays: string[]): string[] {
  return englishDays.map(day => DAYS_MAPPING[day as keyof typeof DAYS_MAPPING] || day);
}