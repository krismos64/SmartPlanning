/**
 * Service de génération automatique de planning
 * 
 * Ce service communique avec l'endpoint backend pour générer
 * automatiquement un planning optimal basé sur les contraintes
 * et préférences des employés, sans utiliser l'IA.
 * 
 * @author SmartPlanning Team
 * @version 1.0.0
 */

import axiosInstance from '../api/axiosInstance';

/**
 * Interface pour les données d'entrée de génération de planning
 */
export interface GeneratePlanningPayload {
  weekNumber: number;
  year: number;
  employees: {
    _id: string;
    contractHoursPerWeek: number;
    exceptions?: {
      date: string; // Format ISO: YYYY-MM-DD
      type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
    }[];
    preferences?: {
      preferredDays?: string[]; // ["lundi", "mardi", ...]
      preferredHours?: string[]; // ["09:00-17:00", ...]
      allowSplitShifts?: boolean; // Autorise les créneaux fractionnés
    };
    restDay?: string; // Jour de repos obligatoire
  }[];
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

/**
 * Interface pour les statistiques du planning généré
 */
export interface PlanningStats {
  totalHoursPlanned: number;
  averageHoursPerEmployee: number;
  employeesWithFullSchedule: number;
  daysWithActivity: number;
}

/**
 * Interface pour les métadonnées du planning
 */
export interface PlanningMetadata {
  weekNumber: number;
  year: number;
  employeeCount: number;
  generatedAt: string;
  stats: PlanningStats;
}

/**
 * Interface pour le planning généré par employé
 */
export interface GeneratedPlanning {
  [employeeId: string]: {
    [day: string]: {
      start: string; // Format "HH:MM"
      end: string;   // Format "HH:MM"
    }[];
  };
}

/**
 * Interface pour la réponse de l'API de génération automatique
 */
export interface AutoGenerationResponse {
  success: true;
  message: string;
  planning: GeneratedPlanning;
  metadata: PlanningMetadata;
  stats?: PlanningStats;
  savedSchedules?: number;
}

/**
 * Interface pour les erreurs de l'API
 */
export interface AutoGenerationError {
  success: false;
  message: string;
  issues?: {
    field: string;
    message: string;
    code: string;
  }[];
  error?: string;
}

/**
 * Génère automatiquement un planning hebdomadaire optimal
 * 
 * Cette fonction appelle le service backend qui utilise un moteur personnalisé
 * pour résoudre les contraintes de planification et générer un
 * planning respectant :
 * - Les heures contractuelles des employés
 * - Les exceptions (congés, absences, formations)
 * - Les préférences des employés (jours et heures préférés)
 * - Les contraintes de l'entreprise (jours/heures d'ouverture)
 * 
 * @param payload - Données de génération du planning
 * @returns Promise<AutoGenerationResponse> - Planning généré avec métadonnées
 * @throws Error - En cas d'erreur réseau ou de validation côté serveur
 * 
 * @example
 * ```typescript
 * const payload: GeneratePlanningPayload = {
 *   weekNumber: 30,
 *   year: 2025,
 *   employees: [
 *     {
 *       _id: "employee123",
 *       contractHoursPerWeek: 40,
 *       preferences: {
 *         preferredDays: ["lundi", "mardi", "mercredi"],
 *         preferredHours: ["09:00-17:00"]
 *       }
 *     }
 *   ],
 *   companyConstraints: {
 *     openDays: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
 *     openHours: ["08:00-18:00"],
 *     minEmployeesPerSlot: 2
 *   }
 * };
 * 
 * try {
 *   const result = await autoGenerateSchedule(payload);
 *   console.log('Planning généré:', result.planning);
 *   console.log('Statistiques:', result.metadata.stats);
 * } catch (error) {
 *   console.error('Erreur de génération:', error.message);
 * }
 * ```
 */
export async function autoGenerateSchedule(
  payload: GeneratePlanningPayload
): Promise<AutoGenerationResponse> {
  try {
    // Validation basique côté client
    if (!payload.employees || payload.employees.length === 0) {
      throw new Error('Aucun employé fourni pour la génération du planning');
    }

    if (payload.weekNumber < 1 || payload.weekNumber > 53) {
      throw new Error('Le numéro de semaine doit être entre 1 et 53');
    }

    if (payload.year < 2023) {
      throw new Error('L\'année doit être supérieure ou égale à 2023');
    }

    // Validation des heures contractuelles
    for (const employee of payload.employees) {
      if (employee.contractHoursPerWeek <= 0) {
        throw new Error(`Heures contractuelles invalides pour l'employé ${employee._id}`);
      }
    }

    // Appel de l'API backend avec axiosInstance
    const response = await axiosInstance.post<AutoGenerationResponse>(
      '/schedules/auto-generate',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // Timeout de 30 secondes pour la génération
      }
    );

    // Vérification de la structure de la réponse
    if (!response.data || !response.data.success) {
      throw new Error('Réponse invalide du serveur');
    }

    if (!response.data.planning || Object.keys(response.data.planning).length === 0) {
      throw new Error('Aucun planning généré par le serveur');
    }

    // Validation que tous les employés ont un planning
    const planningEmployeeIds = Object.keys(response.data.planning);
    const payloadEmployeeIds = payload.employees.map(emp => emp._id);
    
    for (const employeeId of payloadEmployeeIds) {
      if (!planningEmployeeIds.includes(employeeId)) {
        console.warn(`Planning manquant pour l'employé ${employeeId}`);
      }
    }

    // Ajouter les stats si pas présent dans metadata
    if (response.data.metadata && response.data.metadata.stats) {
      response.data.stats = response.data.metadata.stats;
    }

    return response.data;

  } catch (error) {
    // Gestion des erreurs Axios
    if (error.response) {
      // Erreur de réponse du serveur (4xx, 5xx)
      const errorData = error.response.data as AutoGenerationError;
      
      if (errorData.issues && errorData.issues.length > 0) {
        // Erreurs de validation Zod
        const validationErrors = errorData.issues
          .map(issue => `${issue.field}: ${issue.message}`)
          .join(', ');
        throw new Error(`Erreurs de validation: ${validationErrors}`);
      }
      
      throw new Error(
        errorData.message || 
        `Erreur serveur: ${error.response.status} ${error.response.statusText}`
      );
      
    } else if (error.request) {
      // Erreur réseau (pas de réponse)
      throw new Error(
        'Impossible de contacter le serveur. Vérifiez votre connexion internet.'
      );
      
    } else if (error.message) {
      // Erreur de configuration ou validation côté client
      throw new Error(error.message);
      
    } else {
      // Erreur inconnue
      throw new Error('Erreur inconnue lors de la génération du planning');
    }
  }
}

/**
 * Valide qu'un planning généré contient au moins un créneau par employé
 * 
 * @param planning - Planning généré à valider
 * @returns boolean - true si le planning est valide
 */
export function validateGeneratedPlanning(planning: GeneratedPlanning): boolean {
  if (!planning || Object.keys(planning).length === 0) {
    return false;
  }

  for (const [employeeId, schedule] of Object.entries(planning)) {
    let hasAtLeastOneSlot = false;
    
    for (const [day, slots] of Object.entries(schedule)) {
      if (slots && slots.length > 0) {
        hasAtLeastOneSlot = true;
        
        // Validation des créneaux
        for (const slot of slots) {
          if (!slot.start || !slot.end) {
            console.warn(`Créneau invalide pour ${employeeId} le ${day}`);
            return false;
          }
          
          // Validation du format horaire
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
            console.warn(`Format horaire invalide pour ${employeeId} le ${day}: ${slot.start}-${slot.end}`);
            return false;
          }
        }
      }
    }
    
    if (!hasAtLeastOneSlot) {
      console.warn(`Aucun créneau trouvé pour l'employé ${employeeId}`);
      return false;
    }
  }

  return true;
}

/**
 * Calcule le nombre total d'heures dans un planning généré
 * 
 * @param planning - Planning généré
 * @returns number - Nombre total d'heures planifiées
 */
export function calculateTotalHours(planning: GeneratedPlanning): number {
  let totalHours = 0;
  
  for (const schedule of Object.values(planning)) {
    for (const slots of Object.values(schedule)) {
      for (const slot of slots) {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        const startTime = startHour + startMinute / 60;
        const endTime = endHour + endMinute / 60;
        const duration = endTime - startTime;
        
        if (duration > 0) {
          totalHours += duration;
        }
      }
    }
  }
  
  return Math.round(totalHours * 100) / 100;
}