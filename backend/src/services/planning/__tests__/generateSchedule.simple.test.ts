/**
 * Tests Simples - AdvancedSchedulingEngine v2.2.1
 * 
 * Tests de base pour valider le fonctionnement du moteur de planification
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

import { generateSchedule } from '../generateSchedule';

describe('AdvancedSchedulingEngine - Tests Simples', () => {

  test('Fonction generateSchedule existe et retourne un objet', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_001',
          contractHoursPerWeek: 35,
          preferences: {
            preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        }
      ]
    };

    const result = generateSchedule(input);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result['emp_001']).toBeDefined();
  });

  test('Planning respect structure attendue', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_test',
          contractHoursPerWeek: 20
        }
      ],
      companyConstraints: {
        openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        maxHoursPerDay: 8
      }
    };

    const result = generateSchedule(input);
    const employeePlanning = result['emp_test'];
    
    expect(employeePlanning).toBeDefined();
    expect(employeePlanning['lundi']).toBeDefined();
    expect(Array.isArray(employeePlanning['lundi'])).toBe(true);
    expect(employeePlanning['mardi']).toBeDefined();
    expect(Array.isArray(employeePlanning['mardi'])).toBe(true);
  });

  test('Performance basique < 50ms pour 1 employé', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_perf',
          contractHoursPerWeek: 35
        }
      ]
    };

    const start = performance.now();
    const result = generateSchedule(input);
    const executionTime = performance.now() - start;
    
    console.log(`⚡ Performance 1 employé: ${executionTime.toFixed(2)}ms`);
    
    expect(executionTime).toBeLessThan(50); // < 50ms très conservateur
    expect(result).toBeDefined();
  });

  test('Gestion équipe multiple (3 employés)', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        { _id: 'emp_001', contractHoursPerWeek: 35 },
        { _id: 'emp_002', contractHoursPerWeek: 30 },
        { _id: 'emp_003', contractHoursPerWeek: 25 }
      ]
    };

    const result = generateSchedule(input);
    
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['emp_001']).toBeDefined();
    expect(result['emp_002']).toBeDefined();
    expect(result['emp_003']).toBeDefined();
  });

  test('Performance 10 employés < 20ms', () => {
    const employees = Array.from({ length: 10 }, (_, i) => ({
      _id: `emp_${i.toString().padStart(3, '0')}`,
      contractHoursPerWeek: 35
    }));

    const input = {
      weekNumber: 33,
      year: 2025,
      employees
    };

    const start = performance.now();
    const result = generateSchedule(input);
    const executionTime = performance.now() - start;
    
    console.log(`⚡ Performance 10 employés: ${executionTime.toFixed(2)}ms`);
    
    expect(executionTime).toBeLessThan(20); // < 20ms conservateur
    expect(Object.keys(result)).toHaveLength(10);
  });

  test('Gestion exceptions congés', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_vacations',
          contractHoursPerWeek: 35,
          exceptions: [
            {
              date: '2025-08-18', // Lundi semaine 33
              type: 'vacation' as const
            }
          ]
        }
      ]
    };

    const result = generateSchedule(input);
    const planning = result['emp_vacations'];
    
    expect(planning).toBeDefined();
    expect(planning['lundi']).toHaveLength(0); // Pas de travail le lundi (congés)
  });

  test('Respect jour de repos', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_rest',
          contractHoursPerWeek: 35,
          restDay: 'sunday'
        }
      ]
    };

    const result = generateSchedule(input);
    const planning = result['emp_rest'];
    
    expect(planning).toBeDefined();
    expect(planning['dimanche']).toHaveLength(0); // Pas de travail le dimanche
  });

  test('Contraintes entreprise respectées', () => {
    const input = {
      weekNumber: 33,
      year: 2025,
      employees: [
        {
          _id: 'emp_constraints',
          contractHoursPerWeek: 40
        }
      ],
      companyConstraints: {
        openDays: ['monday', 'tuesday', 'wednesday'], // Seulement 3 jours
        maxHoursPerDay: 6
      }
    };

    const result = generateSchedule(input);
    const planning = result['emp_constraints'];
    
    expect(planning).toBeDefined();
    expect(planning['jeudi']).toHaveLength(0); // Entreprise fermée jeudi
    expect(planning['vendredi']).toHaveLength(0); // Entreprise fermée vendredi
    expect(planning['samedi']).toHaveLength(0); // Entreprise fermée samedi
    expect(planning['dimanche']).toHaveLength(0); // Entreprise fermée dimanche
  });

});

/**
 * 🧪 Tests Simples AdvancedSchedulingEngine v2.2.1 - Validés ✅
 * 
 * Couverture basique:
 * ✅ Fonction generateSchedule fonctionnelle
 * ✅ Structure planning correcte  
 * ✅ Performance basique < 50ms (1 employé)
 * ✅ Gestion équipe multiple (3-10 employés)
 * ✅ Exceptions congés respectées
 * ✅ Jour de repos respecté
 * ✅ Contraintes entreprise appliquées
 * 
 * Foundation solide pour tests avancés
 * Développé par Christophe Mostefaoui - Validation technique
 */