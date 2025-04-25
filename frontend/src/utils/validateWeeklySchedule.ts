/**
 * validateWeeklySchedule - Valide un planning hebdomadaire
 *
 * Vérifie la validité des créneaux horaires et des notes d'un planning hebdomadaire.
 */

interface WeeklyScheduleData {
  scheduleData: Record<string, string[][]>;
  dailyNotes: Record<string, string>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Vérifie si une heure est au format valide "HH:MM"
 * @param time L'heure à vérifier
 * @returns true si l'heure est valide, false sinon
 */
const isValidTimeFormat = (time: string): boolean => {
  if (!time || typeof time !== "string") return false;

  // Utiliser une regex pour valider le format HH:MM
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

  return timeRegex.test(time);
};

/**
 * Valide un planning hebdomadaire complet
 * @param weeklySchedule Le planning à valider avec créneaux horaires et notes
 * @returns Un résultat de validation avec un statut et des erreurs éventuelles
 */
export const validateWeeklySchedule = (
  weeklySchedule: WeeklyScheduleData
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
  };

  const { scheduleData, dailyNotes } = weeklySchedule;

  if (!scheduleData) {
    result.isValid = false;
    result.errors.push("Le planning ne contient pas de données d'horaires");
    return result;
  }

  // Variable pour vérifier si au moins un créneau valide existe
  let hasValidTimeSlot = false;

  // Vérifier les créneaux horaires pour chaque jour
  for (const day in scheduleData) {
    const daySlots = scheduleData[day];

    if (!Array.isArray(daySlots)) {
      result.isValid = false;
      result.errors.push(
        `Les créneaux pour ${day} ne sont pas un tableau valide`
      );
      continue;
    }

    // Vérifier chaque créneau du jour
    daySlots.forEach((slot, index) => {
      if (!Array.isArray(slot) || slot.length !== 2) {
        result.isValid = false;
        result.errors.push(
          `Le créneau ${
            index + 1
          } de ${day} n'est pas un tableau valide de deux éléments`
        );
        return;
      }

      const [start, end] = slot;

      // Vérifier le format des heures
      if (!isValidTimeFormat(start)) {
        result.isValid = false;
        result.errors.push(
          `L'heure de début "${start}" du créneau ${
            index + 1
          } de ${day} n'est pas au format valide (HH:MM)`
        );
        return;
      }

      if (!isValidTimeFormat(end)) {
        result.isValid = false;
        result.errors.push(
          `L'heure de fin "${end}" du créneau ${
            index + 1
          } de ${day} n'est pas au format valide (HH:MM)`
        );
        return;
      }

      // Vérifier que l'heure de début est avant l'heure de fin
      if (start >= end) {
        result.isValid = false;
        result.errors.push(
          `Pour le créneau ${
            index + 1
          } de ${day}, l'heure de début "${start}" doit être antérieure à l'heure de fin "${end}"`
        );
        return;
      }

      // Si on arrive ici, le créneau est valide
      hasValidTimeSlot = true;
    });
  }

  // Vérifier qu'il y a au moins un créneau valide dans tout le planning
  if (!hasValidTimeSlot) {
    result.isValid = false;
    result.errors.push(
      "Le planning doit contenir au moins un créneau horaire valide"
    );
  }

  // Vérifier les notes quotidiennes si elles existent
  if (dailyNotes) {
    for (const day in dailyNotes) {
      const note = dailyNotes[day];
      if (note === "") {
        result.isValid = false;
        result.errors.push(`La note pour ${day} ne peut pas être vide`);
      }
    }
  }

  return result;
};

export default validateWeeklySchedule;
