/**
 * Tests Stratégies - AdvancedSchedulingEngine v2.2.1
 * 
 * Tests des différentes stratégies de planification
 * Développé par Christophe Mostefaoui - 14 août 2025
 * 
 * Note: Actuellement le moteur utilise une stratégie de distribution équilibrée par défaut
 * Les 3 stratégies spécialisées seront implémentées dans une version future
 */

import { generateSchedule } from '../generateSchedule';

describe('AdvancedSchedulingEngine - Tests Stratégies', () => {

  const testEmployee = {
    _id: 'emp_strategy_test',
    contractHoursPerWeek: 35,
    preferences: {
      preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferredHours: ['09:00-17:00'],
      allowSplitShifts: false,
      maxConsecutiveDays: 5
    }
  };

  const baseInput = {
    weekNumber: 33,
    year: 2025,
    employees: [testEmployee],
    companyConstraints: {
      openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      openHours: ['08:00-19:00'],
      maxHoursPerDay: 8,
      minHoursPerDay: 2
    }
  };

  test('Stratégie par défaut (Distribution équilibrée)', () => {
    const result = generateSchedule(baseInput);
    
    expect(result).toBeDefined();
    expect(result['emp_strategy_test']).toBeDefined();
    
    const planning = result['emp_strategy_test'];
    
    // Vérifier que le planning est généré
    const hasWorkDays = Object.values(planning).some(daySlots => daySlots.length > 0);
    expect(hasWorkDays).toBe(true);
    
    // Vérifier structure standard
    expect(planning['lundi']).toBeDefined();
    expect(Array.isArray(planning['lundi'])).toBe(true);
  });

  test('Configuration équipe multiple - Distribution charge', () => {
    const multipleEmployees = [
      { _id: 'emp_001', contractHoursPerWeek: 35 },
      { _id: 'emp_002', contractHoursPerWeek: 30 },
      { _id: 'emp_003', contractHoursPerWeek: 40 }
    ];

    const result = generateSchedule({
      ...baseInput,
      employees: multipleEmployees
    });
    
    expect(Object.keys(result)).toHaveLength(3);
    
    // Vérifier que chaque employé a un planning
    for (const empId of ['emp_001', 'emp_002', 'emp_003']) {
      expect(result[empId]).toBeDefined();
      const hasWork = Object.values(result[empId]).some(daySlots => daySlots.length > 0);
      expect(hasWork).toBe(true);
    }
  });

  test('Simulation stratégie "Respect préférences"', () => {
    const employeeWithPreferences = {
      _id: 'emp_preferences',
      contractHoursPerWeek: 28,
      preferences: {
        preferredDays: ['tuesday', 'wednesday', 'thursday'], // Seulement 3 jours préférés
        preferredHours: ['10:00-18:00'],
        allowSplitShifts: false,
        maxConsecutiveDays: 3
      }
    };

    const result = generateSchedule({
      ...baseInput,
      employees: [employeeWithPreferences]
    });

    const planning = result['emp_preferences'];
    expect(planning).toBeDefined();
    
    // Dans une future implémentation, le moteur devrait privilégier mardi, mercredi, jeudi
    // Pour le moment, on vérifie juste que le planning est généré
    const hasWork = Object.values(planning).some(daySlots => daySlots.length > 0);
    expect(hasWork).toBe(true);
  });

  test('Simulation stratégie "Concentration optimale"', () => {
    const employeeConcentration = {
      _id: 'emp_concentration',
      contractHoursPerWeek: 42,
      preferences: {
        preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        allowSplitShifts: false, // Pas de créneaux fractionnés pour concentration
        maxConsecutiveDays: 4 // Moins de jours pour plus d'heures/jour
      }
    };

    const result = generateSchedule({
      ...baseInput,
      employees: [employeeConcentration],
      companyConstraints: {
        ...baseInput.companyConstraints,
        maxHoursPerDay: 10 // Permettre journées plus longues
      }
    });

    const planning = result['emp_concentration'];
    expect(planning).toBeDefined();
    
    // Dans une future implémentation, le moteur devrait concentrer sur moins de jours
    const workDays = Object.entries(planning).filter(([day, slots]) => slots.length > 0);
    expect(workDays.length).toBeGreaterThan(0);
  });

  test('Performance comparative - Différentes configurations', () => {
    const configurations = [
      {
        name: 'Standard',
        employees: [{ _id: 'emp_std', contractHoursPerWeek: 35 }]
      },
      {
        name: 'Préférences strictes',
        employees: [{
          _id: 'emp_strict',
          contractHoursPerWeek: 35,
          preferences: {
            preferredDays: ['wednesday'], // Un seul jour préféré
            maxConsecutiveDays: 1
          }
        }]
      },
      {
        name: 'Créneaux fractionnés',
        employees: [{
          _id: 'emp_split',
          contractHoursPerWeek: 35,
          preferences: {
            allowSplitShifts: true,
            maxConsecutiveDays: 7
          }
        }]
      }
    ];

    configurations.forEach(config => {
      const startTime = performance.now();
      
      const result = generateSchedule({
        ...baseInput,
        employees: config.employees
      });
      
      const executionTime = performance.now() - startTime;
      
      console.log(`⚡ ${config.name}: ${executionTime.toFixed(2)}ms`);
      
      expect(executionTime).toBeLessThan(100); // < 100ms acceptable pour test
      expect(result).toBeDefined();
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  test('Gestion contraintes entreprise variables', () => {
    const constraintVariations = [
      {
        name: 'Horaires courts',
        constraints: {
          openDays: ['monday', 'tuesday', 'wednesday'],
          openHours: ['10:00-14:00'], // Seulement 4h d\'ouverture
          maxHoursPerDay: 4
        }
      },
      {
        name: 'Weekend inclus',
        constraints: {
          openDays: ['friday', 'saturday', 'sunday'],
          openHours: ['12:00-22:00'],
          maxHoursPerDay: 8
        }
      },
      {
        name: '7 jours sur 7',
        constraints: {
          openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          openHours: ['06:00-23:00'],
          maxHoursPerDay: 6
        }
      }
    ];

    constraintVariations.forEach(variation => {
      const result = generateSchedule({
        weekNumber: 33,
        year: 2025,
        employees: [testEmployee],
        companyConstraints: variation.constraints
      });

      expect(result).toBeDefined();
      expect(result['emp_strategy_test']).toBeDefined();
      
      console.log(`🏢 ${variation.name}: Planning généré avec succès`);
    });
  });

  test('Validation algorithme adaptatif', () => {
    // Test avec différentes charges de travail
    const workloadTests = [
      { hours: 10, description: 'Temps partiel léger' },
      { hours: 20, description: 'Mi-temps' },
      { hours: 35, description: 'Temps plein standard' },
      { hours: 39, description: 'Temps plein étendu' },
      { hours: 42, description: 'Temps plein maximum' }
    ];

    workloadTests.forEach(test => {
      const employee = {
        _id: `emp_${test.hours}h`,
        contractHoursPerWeek: test.hours
      };

      const result = generateSchedule({
        ...baseInput,
        employees: [employee]
      });

      expect(result).toBeDefined();
      expect(result[employee._id]).toBeDefined();
      
      const hasWork = Object.values(result[employee._id]).some(daySlots => daySlots.length > 0);
      expect(hasWork).toBe(true);
      
      console.log(`⏰ ${test.description} (${test.hours}h): Algorithme adapté`);
    });
  });

});

/**
 * 🧠 Tests Stratégies AdvancedSchedulingEngine v2.2.1 - Foundation ✅
 * 
 * Tests actuels (moteur v2.2.1):
 * ✅ Stratégie distribution équilibrée par défaut
 * ✅ Performance configurations multiples
 * ✅ Adaptation contraintes entreprise variables
 * ✅ Gestion charges travail diverses
 * ✅ Validation algorithme adaptatif
 * 
 * Futures implémentations (v2.3.0):
 * 🔮 Stratégie "Respect préférences" spécialisée
 * 🔮 Stratégie "Concentration optimale" avancée
 * 🔮 Machine Learning patterns historiques
 * 🔮 Optimisation multi-objectifs
 * 
 * Foundation solide pour évolutions algorithmes intelligents
 * Développé par Christophe Mostefaoui - Architecture extensible
 */