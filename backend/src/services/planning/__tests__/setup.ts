/**
 * Setup Tests - AdvancedSchedulingEngine v2.2.1
 * 
 * Configuration globale et utilitaires pour tous les tests du moteur de planification
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

// Configuration Jest globale
import 'jest';

// Variables globales pour les tests
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinPerformanceTarget(target: number): R;
      toHaveValidScheduleStructure(): R;
      toRespectLegalConstraints(): R;
    }
  }
}

// Matchers personnalisés Jest
expect.extend({
  /**
   * Matcher pour valider les performances
   */
  toBeWithinPerformanceTarget(received: number, target: number) {
    const pass = received <= target;
    
    if (pass) {
      return {
        message: () => `Performance ${received.toFixed(2)}ms ✅ (objectif <${target}ms)`,
        pass: true
      };
    } else {
      return {
        message: () => `Performance ${received.toFixed(2)}ms ❌ (objectif <${target}ms) - DÉPASSEMENT`,
        pass: false
      };
    }
  },

  /**
   * Matcher pour valider la structure d'un planning
   */
  toHaveValidScheduleStructure(received: any) {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    // Vérifier que c'est un objet
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => 'Le planning doit être un objet',
        pass: false
      };
    }
    
    // Vérifier que tous les jours sont présents
    for (const day of days) {
      if (!received[day] || !Array.isArray(received[day])) {
        return {
          message: () => `Le jour "${day}" manque ou n'est pas un tableau`,
          pass: false
        };
      }
    }
    
    // Vérifier la structure des créneaux
    for (const [day, slots] of Object.entries(received)) {
      if (Array.isArray(slots)) {
        for (const slot of slots as any[]) {
          if (!slot.start || !slot.end) {
            return {
              message: () => `Créneau invalide le ${day}: manque start ou end`,
              pass: false
            };
          }
          
          // Vérifier format heure
          const timeRegex = /^\d{2}:\d{2}$/;
          if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
            return {
              message: () => `Format heure invalide le ${day}: ${slot.start} - ${slot.end}`,
              pass: false
            };
          }
        }
      }
    }
    
    return {
      message: () => 'Structure planning valide ✅',
      pass: true
    };
  },

  /**
   * Matcher pour valider le respect des contraintes légales
   */
  toRespectLegalConstraints(received: any, maxHoursPerDay = 8) {
    const parseTimeToDecimal = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours + minutes / 60;
    };
    
    for (const [day, slots] of Object.entries(received)) {
      if (Array.isArray(slots)) {
        let dayHours = 0;
        
        for (const slot of slots as any[]) {
          if (!slot.isLunchBreak) {
            const start = parseTimeToDecimal(slot.start);
            const end = parseTimeToDecimal(slot.end);
            dayHours += (end - start);
          }
        }
        
        if (dayHours > maxHoursPerDay + 0.1) { // Tolérance arrondi
          return {
            message: () => `Dépassement heures légales le ${day}: ${dayHours.toFixed(1)}h (max ${maxHoursPerDay}h)`,
            pass: false
          };
        }
      }
    }
    
    return {
      message: () => 'Contraintes légales respectées ✅',
      pass: true
    };
  }
});

// Configuration console pour les tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Mock console en mode test silencieux
if (process.env.JEST_SILENT === 'true') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Fonction pour restaurer console
export const restoreConsole = () => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;  
  console.error = originalConsoleError;
};

// Setup global pour chaque test
beforeEach(() => {
  // Reset des timers pour performance.now()
  jest.spyOn(performance, 'now').mockRestore();
});

afterEach(() => {
  // Nettoyage après chaque test
  jest.restoreAllMocks();
});

// Configuration timeout par défaut
jest.setTimeout(30000);

// Utilitaires de test exportés
export const TestUtils = {
  /**
   * Créer un employé de test standard
   */
  createMockEmployee: (id: string, overrides: any = {}) => ({
    _id: id,
    firstName: 'Test',
    lastName: 'Employee',
    contractHoursPerWeek: 35,
    restDay: 'sunday' as const,
    preferences: {
      preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      preferredHours: ['09:00-17:00'],
      allowSplitShifts: false,
      maxConsecutiveDays: 5
    },
    exceptions: [],
    ...overrides
  }),

  /**
   * Créer des contraintes entreprise par défaut
   */
  createMockConstraints: (overrides: any = {}) => ({
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const,
    openHours: ['08:00-19:00'],
    minEmployeesPerShift: 2,
    maxHoursPerDay: 8,
    minHoursPerDay: 2,
    mandatoryLunchBreak: true,
    lunchBreakDuration: 60,
    minRestBetweenShifts: 11,
    ...overrides
  }),

  /**
   * Mesurer le temps d'exécution d'une fonction
   */
  measureExecutionTime: async (fn: () => any): Promise<{ result: any; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    return { result, time };
  },

  /**
   * Générer une équipe de test avec N employés
   */
  generateTeam: (size: number, variant = 'standard') => {
    return Array.from({ length: size }, (_, i) => {
      const baseEmployee = TestUtils.createMockEmployee(`emp_${i.toString().padStart(3, '0')}`);
      
      if (variant === 'diverse') {
        return {
          ...baseEmployee,
          contractHoursPerWeek: [20, 28, 35, 39, 42][i % 5],
          restDay: ['sunday', 'monday', 'saturday'][i % 3] as any,
          preferences: {
            ...baseEmployee.preferences,
            allowSplitShifts: i % 3 === 0,
            maxConsecutiveDays: 3 + (i % 3)
          }
        };
      }
      
      return baseEmployee;
    });
  },

  /**
   * Valider la structure d'un résultat de planning
   */
  validatePlanningResult: (result: any, expectedEmployeeCount: number) => {
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(Object.keys(result)).toHaveLength(expectedEmployeeCount);
    
    for (const employeePlanning of Object.values(result)) {
      expect(employeePlanning).toHaveValidScheduleStructure();
    }
  },

  /**
   * Calculer le temps total d'un planning
   */
  calculatePlanningHours: (schedule: any): number => {
    let totalHours = 0;
    
    for (const daySlots of Object.values(schedule)) {
      if (Array.isArray(daySlots)) {
        for (const slot of daySlots as any[]) {
          if (!slot.isLunchBreak) {
            const start = parseTimeToDecimal(slot.start);
            const end = parseTimeToDecimal(slot.end);
            totalHours += (end - start);
          }
        }
      }
    }
    
    return Math.round(totalHours * 100) / 100;
  }
};

// Fonction utilitaire pour parsing temps
function parseTimeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

// Variables d'environnement pour tests
export const TEST_CONFIG = {
  PERFORMANCE_TARGETS: {
    SMALL_TEAM: 2,    // <2ms pour 1-10 employés
    MEDIUM_TEAM: 5,   // <5ms pour 11-50 employés  
    LARGE_TEAM: 10,   // <10ms pour 51-100 employés
    MASSIVE_TEAM: 50  // <50ms pour 100+ employés
  },
  TEST_WEEK: 33,
  TEST_YEAR: 2025,
  DEFAULT_MAX_HOURS_PER_DAY: 8,
  BENCHMARK_RUNS: 10 // Nombre d'exécutions pour stabilité
};

console.log('🧪 AdvancedSchedulingEngine Tests Setup - Ready ✅');
console.log(`📊 Performance Targets: Small=${TEST_CONFIG.PERFORMANCE_TARGETS.SMALL_TEAM}ms, Large=${TEST_CONFIG.PERFORMANCE_TARGETS.LARGE_TEAM}ms`);

/**
 * 🧪 Test Setup AdvancedSchedulingEngine v2.2.1 - Configuré ✅
 * 
 * Fonctionnalités:
 * ✅ Matchers personnalisés Jest (performance, structure, légal)
 * ✅ Utilitaires création données test (employés, contraintes, équipes)
 * ✅ Mesure performance automatique avec targets
 * ✅ Validation structure planning robuste
 * ✅ Configuration environnement optimisée
 * 
 * Support complet pour tests unitaires, performance, et intégration
 * Développé par Christophe Mostefaoui - Infrastructure test excellente
 */