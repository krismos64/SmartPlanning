import { describe, expect, test } from "@jest/globals";
import validateWeeklySchedule from "../validateWeeklySchedule";

describe("validateWeeklySchedule", () => {
  /**
   * Cas de test 1: Un planning entièrement valide
   */
  test("devrait valider un planning correctement rempli", () => {
    const validSchedule = {
      scheduleData: {
        monday: [
          ["09:00", "12:00"],
          ["14:00", "17:00"],
        ],
        tuesday: [["10:00", "18:00"]],
        wednesday: [["08:30", "16:30"]],
        thursday: [],
        friday: [["09:00", "17:00"]],
        saturday: [],
        sunday: [],
      },
      dailyNotes: {
        monday: "Formation le matin",
        wednesday: "Réunion à 15h",
        thursday: "Absent",
      },
    };

    const result = validateWeeklySchedule(validSchedule);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  /**
   * Cas de test 2: Un planning avec des créneaux invalides
   */
  test("devrait détecter des heures de début après les heures de fin", () => {
    const invalidSchedule = {
      scheduleData: {
        monday: [["09:00", "12:00"]],
        tuesday: [["18:00", "10:00"]], // Heure de début après heure de fin
        wednesday: [["08:30", "16:30"]],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      dailyNotes: {},
    };

    const result = validateWeeklySchedule(invalidSchedule);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Pour le créneau 1 de tuesday, l\'heure de début "18:00" doit être antérieure à l\'heure de fin "10:00"'
    );
  });

  /**
   * Cas de test 3: Un planning avec des heures au format invalide
   */
  test("devrait détecter des formats d'heure invalides", () => {
    const invalidFormatSchedule = {
      scheduleData: {
        monday: [["09:00", "12:00"]],
        tuesday: [["10:00", "18:00"]],
        wednesday: [["25:30", "16:30"]], // Heure invalide
        thursday: [],
        friday: [["09:00", "17:60"]], // Minutes invalides
        saturday: [],
        sunday: [],
      },
      dailyNotes: {},
    };

    const result = validateWeeklySchedule(invalidFormatSchedule);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes("25:30"))).toBe(true);
    expect(result.errors.some((error) => error.includes("17:60"))).toBe(true);
  });

  /**
   * Cas de test 4: Un planning sans aucun créneau
   */
  test("devrait détecter un planning sans créneaux", () => {
    const emptySchedule = {
      scheduleData: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      dailyNotes: {
        monday: "Jour férié",
      },
    };

    const result = validateWeeklySchedule(emptySchedule);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Le planning doit contenir au moins un créneau horaire valide"
    );
  });

  /**
   * Cas de test 5: Un planning avec des notes vides
   */
  test("devrait détecter des notes vides", () => {
    const scheduleWithEmptyNotes = {
      scheduleData: {
        monday: [["09:00", "17:00"]],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      dailyNotes: {
        monday: "Note valide",
        tuesday: "", // Note vide
      },
    };

    const result = validateWeeklySchedule(scheduleWithEmptyNotes);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "La note pour tuesday ne peut pas être vide"
    );
  });

  /**
   * Cas de test 6: Un planning avec un créneau mal formé
   */
  test("devrait détecter un créneau avec une structure invalide", () => {
    const scheduleWithInvalidSlot = {
      scheduleData: {
        monday: [["09:00", "17:00"]],
        tuesday: [["10:00"]], // Créneau incomplet
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      dailyNotes: {},
    };

    const result = validateWeeklySchedule(scheduleWithInvalidSlot);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((error) =>
        error.includes("n'est pas un tableau valide de deux éléments")
      )
    ).toBe(true);
  });

  /**
   * Cas de test 7: Un planning sans données
   */
  test("devrait détecter un planning sans données", () => {
    const scheduleWithoutData = {
      scheduleData: null as any, // Simuler une absence de données
      dailyNotes: {},
    };

    const result = validateWeeklySchedule(scheduleWithoutData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Le planning ne contient pas de données d'horaires"
    );
  });
});
