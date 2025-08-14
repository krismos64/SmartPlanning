/**
 * Suite de Tests Complète - AdvancedSchedulingEngine v2.2.1
 * 
 * Tests unitaires et d'intégration pour le moteur de planification personnalisé
 * Développé par Christophe Mostefaoui - 14 août 2025
 * 
 * Performance cible : 2-5ms pour 100+ employés
 * Conformité légale : 11h repos, pauses, limites horaires
 */

import { generateSchedule, generatePlanning, GeneratePlanningInput, GeneratedPlanning } from '../generateSchedule';

describe('AdvancedSchedulingEngine - Tests Complets', () => {
  
  // Données de test réalistes
  const mockEmployee1 = {
    _id: 'emp_001',
    firstName: 'Marie',
    lastName: 'Dupont',
    contractHoursPerWeek: 35,
    restDay: 'sunday' as const,
    preferences: {
      preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
      preferredHours: ['09:00-17:00'],
      allowSplitShifts: false,
      maxConsecutiveDays: 5
    },
    exceptions: []
  };

  const mockEmployee2 = {
    _id: 'emp_002',
    firstName: 'Pierre',
    lastName: 'Martin',
    contractHoursPerWeek: 39,
    restDay: 'monday' as const,
    preferences: {
      preferredDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const,
      preferredHours: ['10:00-18:00'],
      allowSplitShifts: true,
      maxConsecutiveDays: 4
    },
    exceptions: []
  };

  const mockEmployee3 = {
    _id: 'emp_003',
    firstName: 'Sophie',
    lastName: 'Bernard',
    contractHoursPerWeek: 20,
    restDay: 'saturday' as const,
    preferences: {
      preferredDays: ['monday', 'tuesday', 'wednesday'] as const,
      preferredHours: ['08:00-12:00'],
      allowSplitShifts: false,
      maxConsecutiveDays: 3
    },
    exceptions: []
  };

  const mockCompanyConstraints = {
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const,
    openHours: ['08:00-19:00'],
    minEmployeesPerShift: 2,
    maxHoursPerDay: 8,
    minHoursPerDay: 2,
    mandatoryLunchBreak: true,
    lunchBreakDuration: 60, // minutes
    minRestBetweenShifts: 11 // heures
  };

  const baseInput: GeneratePlanningInput = {
    weekNumber: 33,
    year: 2025,
    employees: [mockEmployee1],
    companyConstraints: mockCompanyConstraints,
    strategy: 'distribution'
  };

  describe('🏗️ Tests Performance & Architecture', () => {
    
    test('Génération ultra-rapide <10ms pour équipe standard', () => {
      const startTime = performance.now();
      
      const result = generateSchedule({
        ...baseInput,
        employees: [mockEmployee1, mockEmployee2, mockEmployee3]
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      console.log(`⚡ Temps génération: ${executionTime.toFixed(2)}ms`);
      
      expect(executionTime).toBeLessThan(10); // < 10ms garanti
      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(3);
    });

    test('Performance scalabilité 100+ employés', () => {
      // Créer 100 employés de test
      const largeTeam = Array.from({ length: 100 }, (_, i) => ({
        _id: `emp_${i.toString().padStart(3, '0')}`,
        firstName: `Employee${i}`,
        lastName: 'Test',
        contractHoursPerWeek: 35 + (i % 10), // Variété 35-44h
        restDay: ['sunday', 'monday'][i % 2] as 'sunday' | 'monday',
        preferences: {
          preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const,
          preferredHours: ['09:00-17:00'],
          allowSplitShifts: i % 3 === 0,
          maxConsecutiveDays: 5
        },
        exceptions: []
      }));

      const startTime = performance.now();
      
      const result = generateSchedule({
        ...baseInput,
        employees: largeTeam
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      console.log(`🚀 Performance 100 employés: ${executionTime.toFixed(2)}ms`);
      
      expect(executionTime).toBeLessThan(50); // < 50ms pour 100 employés
      expect(Object.keys(result)).toHaveLength(100);
    });

    test('Compatibilité API legacy generatePlanning', () => {
      const result = generatePlanning(baseInput);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

  });

  describe('📋 Tests Fonctionnalités Planning', () => {
    
    test('Planning basique employé standard', () => {
      const result = generateSchedule(baseInput);
      
      expect(result['emp_001']).toBeDefined();
      expect(typeof result['emp_001']).toBe('object');
      
      // Vérifier structure planning
      const employeePlanning = result['emp_001'];
      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      
      days.forEach(day => {
        expect(employeePlanning[day]).toBeDefined();
        expect(Array.isArray(employeePlanning[day])).toBe(true);
      });
    });

    test('Respect heures contractuelles', () => {
      const result = generateSchedule(baseInput);
      const employeePlanning = result['emp_001'];
      
      let totalHours = 0;
      Object.values(employeePlanning).forEach(daySlots => {
        daySlots.forEach(slot => {
          if (!slot.isLunchBreak) {
            const start = parseTimeToDecimal(slot.start);
            const end = parseTimeToDecimal(slot.end);
            totalHours += (end - start);
          }
        });
      });
      
      // Tolérance ±2h pour optimisation
      expect(totalHours).toBeGreaterThanOrEqual(33);
      expect(totalHours).toBeLessThanOrEqual(37);
    });

    test('Respect jour de repos obligatoire', () => {
      const result = generateSchedule(baseInput);
      const employeePlanning = result['emp_001'];
      
      // Employé 1 a dimanche comme jour de repos
      expect(employeePlanning['dimanche']).toHaveLength(0);
    });

    test('Gestion équipe multiple', () => {
      const result = generateSchedule({
        ...baseInput,
        employees: [mockEmployee1, mockEmployee2, mockEmployee3]
      });
      
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['emp_001']).toBeDefined();
      expect(result['emp_002']).toBeDefined();
      expect(result['emp_003']).toBeDefined();
    });

  });

  describe('🚫 Tests Gestion Exceptions', () => {
    
    test('Congés (vacation) bloquent planning jour', () => {
      const employeeWithVacation = {
        ...mockEmployee1,
        exceptions: [{
          date: '2025-08-18', // Lundi semaine 33
          type: 'vacation' as const,
          description: 'Congés été'
        }]
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [employeeWithVacation]
      });

      // Vérifier qu'aucun travail n'est planifié le lundi
      expect(result['emp_001']['lundi']).toHaveLength(0);
    });

    test('Maladie (sick) bloque planning', () => {
      const employeeWithSick = {
        ...mockEmployee1,
        exceptions: [{
          date: '2025-08-19', // Mardi
          type: 'sick' as const,
          description: 'Arrêt médical'
        }]
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [employeeWithSick]
      });

      expect(result['emp_001']['mardi']).toHaveLength(0);
    });

    test('Formation (training) bloque planning', () => {
      const employeeWithTraining = {
        ...mockEmployee1,
        exceptions: [{
          date: '2025-08-20', // Mercredi
          type: 'training' as const,
          description: 'Formation obligatoire'
        }]
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [employeeWithTraining]
      });

      expect(result['emp_001']['mercredi']).toHaveLength(0);
    });

    test('Multiples exceptions par employé', () => {
      const employeeWithMultipleExceptions = {
        ...mockEmployee1,
        exceptions: [
          {
            date: '2025-08-18', // Lundi
            type: 'vacation' as const,
            description: 'Congés'
          },
          {
            date: '2025-08-19', // Mardi  
            type: 'sick' as const,
            description: 'Maladie'
          },
          {
            date: '2025-08-20', // Mercredi
            type: 'training' as const,
            description: 'Formation'
          }
        ]
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [employeeWithMultipleExceptions]
      });

      const planning = result['emp_001'];
      expect(planning['lundi']).toHaveLength(0);
      expect(planning['mardi']).toHaveLength(0);
      expect(planning['mercredi']).toHaveLength(0);
    });

  });

  describe('⚖️ Tests Conformité Légale', () => {
    
    test('Maximum 8h par jour respecté', () => {
      const result = generateSchedule(baseInput);
      const employeePlanning = result['emp_001'];
      
      Object.entries(employeePlanning).forEach(([day, slots]) => {
        let dayHours = 0;
        slots.forEach(slot => {
          if (!slot.isLunchBreak) {
            const start = parseTimeToDecimal(slot.start);
            const end = parseTimeToDecimal(slot.end);
            dayHours += (end - start);
          }
        });
        
        expect(dayHours).toBeLessThanOrEqual(8.1); // Tolérance arrondi
      });
    });

    test('Pause déjeuner obligatoire >6h', () => {
      const longDayEmployee = {
        ...mockEmployee1,
        contractHoursPerWeek: 48, // Force journées >6h
        preferences: {
          ...mockEmployee1.preferences,
          preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
        }
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [longDayEmployee]
      });

      const planning = result['emp_001'];
      
      // Chercher un jour avec >6h pour vérifier pause déjeuner
      Object.values(planning).forEach(daySlots => {
        let workHours = 0;
        let hasLunchBreak = false;
        
        daySlots.forEach(slot => {
          if (slot.isLunchBreak) {
            hasLunchBreak = true;
          } else {
            const start = parseTimeToDecimal(slot.start);
            const end = parseTimeToDecimal(slot.end);
            workHours += (end - start);
          }
        });

        // Si plus de 6h, doit avoir pause déjeuner
        if (workHours >= 6) {
          expect(hasLunchBreak).toBe(true);
        }
      });
    });

    test('Limites horaires journalières', () => {
      const result = generateSchedule({
        ...baseInput,
        companyConstraints: {
          ...mockCompanyConstraints,
          minHoursPerDay: 3,
          maxHoursPerDay: 7
        }
      });

      const planning = result['emp_001'];
      
      Object.values(planning).forEach(daySlots => {
        if (daySlots.length > 0) {
          let dayHours = 0;
          daySlots.forEach(slot => {
            if (!slot.isLunchBreak) {
              const start = parseTimeToDecimal(slot.start);
              const end = parseTimeToDecimal(slot.end);
              dayHours += (end - start);
            }
          });
          
          if (dayHours > 0) {
            expect(dayHours).toBeGreaterThanOrEqual(2.5); // Tolérance minimale
            expect(dayHours).toBeLessThanOrEqual(7.5); // Tolérance maximale
          }
        }
      });
    });

  });

  describe('🧠 Tests Stratégies AdvancedSchedulingEngine', () => {
    
    test('Stratégie Distribution équilibrée', () => {
      const result = generateSchedule({
        ...baseInput,
        strategy: 'distribution'
      });
      
      expect(result).toBeDefined();
      expect(result['emp_001']).toBeDefined();
    });

    test('Stratégie Respect préférences', () => {
      const result = generateSchedule({
        ...baseInput,
        strategy: 'preferences'
      });
      
      expect(result).toBeDefined();
      expect(result['emp_001']).toBeDefined();
    });

    test('Stratégie Concentration optimale', () => {
      const result = generateSchedule({
        ...baseInput,
        strategy: 'concentration'
      });
      
      expect(result).toBeDefined();
      expect(result['emp_001']).toBeDefined();
    });

  });

  describe('🔄 Tests Cas Limites', () => {
    
    test('Employé aucune heure contractuelle', () => {
      const zeroHoursEmployee = {
        ...mockEmployee1,
        contractHoursPerWeek: 0
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [zeroHoursEmployee]
      });

      const planning = result['emp_001'];
      const hasAnyWork = Object.values(planning).some(daySlots => daySlots.length > 0);
      
      expect(hasAnyWork).toBe(false);
    });

    test('Aucun employé dans équipe', () => {
      const result = generateSchedule({
        ...baseInput,
        employees: []
      });
      
      expect(result).toEqual({});
    });

    test('Semaine invalide (>53)', () => {
      expect(() => {
        generateSchedule({
          ...baseInput,
          weekNumber: 54
        });
      }).not.toThrow(); // Should handle gracefully
    });

    test('Année invalide', () => {
      expect(() => {
        generateSchedule({
          ...baseInput,
          year: 1900
        });
      }).not.toThrow(); // Should handle gracefully
    });

    test('Contraintes impossibles', () => {
      const impossibleConstraints = {
        ...mockCompanyConstraints,
        openDays: [] as const,
        maxHoursPerDay: 0,
        minEmployeesPerShift: 100
      };

      const result = generateSchedule({
        ...baseInput,
        companyConstraints: impossibleConstraints
      });

      // Doit créer un planning vide mais ne pas planter
      expect(result).toBeDefined();
    });

    test('Toutes exceptions bloquantes semaine complète', () => {
      const fullyBlockedEmployee = {
        ...mockEmployee1,
        exceptions: [
          { date: '2025-08-18', type: 'vacation' as const, description: 'Lundi' },
          { date: '2025-08-19', type: 'sick' as const, description: 'Mardi' },
          { date: '2025-08-20', type: 'vacation' as const, description: 'Mercredi' },
          { date: '2025-08-21', type: 'training' as const, description: 'Jeudi' },
          { date: '2025-08-22', type: 'unavailable' as const, description: 'Vendredi' },
          { date: '2025-08-23', type: 'vacation' as const, description: 'Samedi' }
        ]
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [fullyBlockedEmployee]
      });

      const planning = result['emp_001'];
      const hasAnyWork = Object.values(planning).some(daySlots => daySlots.length > 0);
      
      expect(hasAnyWork).toBe(false);
    });

  });

  describe('🔧 Tests Fonctions Utilitaires', () => {
    
    test('Gestion erreur employé individuel', () => {
      const invalidEmployee = {
        ...mockEmployee1,
        _id: null, // ID invalide
        contractHoursPerWeek: -10 // Heures négatives
      } as any;

      // Ne doit pas planter toute la génération
      expect(() => {
        generateSchedule({
          ...baseInput,
          employees: [mockEmployee1, invalidEmployee, mockEmployee2]
        });
      }).not.toThrow();
    });

    test('Validation format heures', () => {
      const result = generateSchedule(baseInput);
      const planning = result['emp_001'];
      
      Object.values(planning).forEach(daySlots => {
        daySlots.forEach(slot => {
          // Vérifier format HH:MM
          expect(slot.start).toMatch(/^\d{2}:\d{2}$/);
          expect(slot.end).toMatch(/^\d{2}:\d{2}$/);
          
          // Vérifier cohérence start < end
          const start = parseTimeToDecimal(slot.start);
          const end = parseTimeToDecimal(slot.end);
          expect(start).toBeLessThan(end);
        });
      });
    });

  });

});

// Fonctions utilitaires pour les tests
function parseTimeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}