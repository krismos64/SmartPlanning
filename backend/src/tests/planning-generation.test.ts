/**
 * Test complet pour la génération automatique de plannings
 * 
 * Ce test vérifie que toutes les fonctionnalités des wizards
 * sont correctement prises en compte lors de la génération
 * automatique de plannings.
 * 
 * @author SmartPlanning Team
 * @version 1.0.0
 */

import { generatePlanning } from '../services/planning/generateSchedule';

// Types d'interface pour les tests
interface TestEmployee {
  _id: string;
  name: string;
  contractHoursPerWeek: number;
  exceptions?: {
    date: string;
    type: 'vacation' | 'sick' | 'unavailable' | 'training' | 'reduced';
  }[];
  preferences?: {
    preferredDays?: string[];
    preferredHours?: string[];
    allowSplitShifts?: boolean;
  };
  restDay?: string;
}

interface TestCompanyConstraints {
  openDays?: string[];
  openHours?: string[];
  minEmployeesPerSlot?: number;
  maxHoursPerDay?: number;
  minHoursPerDay?: number;
  mandatoryLunchBreak?: boolean;
  lunchBreakDuration?: number;
}

interface TestScenario {
  name: string;
  description: string;
  employees: TestEmployee[];
  companyConstraints: TestCompanyConstraints;
  expectedResults: {
    totalEmployees: number;
    respectsOpeningHours: boolean;
    respectsRestDays: boolean;
    respectsPreferences: boolean;
    respectsHourLimits: boolean;
  };
}

// Utilitaires de test
function parseTimeToDecimal(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
}

function isTimeInRange(time: string, range: string): boolean {
  const [start, end] = range.split('-');
  const timeDecimal = parseTimeToDecimal(time);
  const startDecimal = parseTimeToDecimal(start);
  const endDecimal = parseTimeToDecimal(end);
  return timeDecimal >= startDecimal && timeDecimal <= endDecimal;
}

function calculateDayHours(slots: { start: string; end: string }[]): number {
  return slots.reduce((total, slot) => {
    const start = parseTimeToDecimal(slot.start);
    const end = parseTimeToDecimal(slot.end);
    return total + (end - start);
  }, 0);
}

// Fonction de validation des résultats
function validatePlanningResults(
  planning: any,
  scenario: TestScenario
): {
  isValid: boolean;
  errors: string[];
  details: any;
} {
  const errors: string[] = [];
  const details: any = {
    employeeStats: {},
    globalStats: {
      totalHours: 0,
      daysWithActivity: new Set(),
      hourlyDistribution: {}
    }
  };

  console.log('\n🔍 === ANALYSE DU PLANNING GÉNÉRÉ ===');
  console.log(`📊 Scénario: ${scenario.name}`);
  console.log(`👥 Employés prévus: ${scenario.employees.length}`);
  console.log(`👥 Employés dans le planning: ${Object.keys(planning).length}`);

  // 1. Vérifier que tous les employés ont un planning
  for (const employee of scenario.employees) {
    const employeePlanning = planning[employee._id];
    if (!employeePlanning) {
      errors.push(`❌ Employé ${employee.name} (${employee._id}) absent du planning`);
      continue;
    }

    console.log(`\n👤 Analyse employé: ${employee.name}`);
    const employeeStats = {
      totalHours: 0,
      workDays: 0,
      respectsRestDay: true,
      respectsPreferences: true,
      respectsHourLimits: true,
      dailyHours: {} as any
    };

    // 2. Analyser chaque jour pour cet employé
    for (const [day, slots] of Object.entries(employeePlanning)) {
      if (!Array.isArray(slots) || slots.length === 0) continue;

      employeeStats.workDays++;
      const dayHours = calculateDayHours(slots as any[]);
      employeeStats.totalHours += dayHours;
      employeeStats.dailyHours[day] = dayHours;
      details.globalStats.totalHours += dayHours;
      details.globalStats.daysWithActivity.add(day);

      console.log(`  📅 ${day}: ${dayHours}h (${slots.length} créneaux)`);

      // 2a. Vérifier le jour de repos
      if (employee.restDay && day === employee.restDay && slots.length > 0) {
        errors.push(`❌ ${employee.name} travaille son jour de repos (${day})`);
        employeeStats.respectsRestDay = false;
      }

      // 2b. Vérifier les heures d'ouverture
      if (scenario.companyConstraints.openHours) {
        for (const slot of slots as any[]) {
          let slotInOpenHours = false;
          for (const openHour of scenario.companyConstraints.openHours) {
            if (isTimeInRange(slot.start, openHour) && isTimeInRange(slot.end, openHour)) {
              slotInOpenHours = true;
              break;
            }
          }
          if (!slotInOpenHours) {
            errors.push(`❌ ${employee.name} - créneau ${slot.start}-${slot.end} en dehors des heures d'ouverture le ${day}`);
          }
        }
      }

      // 2c. Vérifier les limites d'heures par jour
      if (scenario.companyConstraints.maxHoursPerDay && dayHours > scenario.companyConstraints.maxHoursPerDay) {
        errors.push(`❌ ${employee.name} dépasse les heures max/jour (${dayHours}h > ${scenario.companyConstraints.maxHoursPerDay}h) le ${day}`);
        employeeStats.respectsHourLimits = false;
      }

      if (scenario.companyConstraints.minHoursPerDay && dayHours < scenario.companyConstraints.minHoursPerDay) {
        errors.push(`❌ ${employee.name} en dessous des heures min/jour (${dayHours}h < ${scenario.companyConstraints.minHoursPerDay}h) le ${day}`);
        employeeStats.respectsHourLimits = false;
      }
    }

    // 3. Vérifier les heures contractuelles
    const hoursDifference = Math.abs(employeeStats.totalHours - employee.contractHoursPerWeek);
    const tolerance = employee.contractHoursPerWeek * 0.1; // 10% de tolérance

    console.log(`  📊 Total heures: ${employeeStats.totalHours}h/${employee.contractHoursPerWeek}h (écart: ${hoursDifference.toFixed(1)}h)`);
    console.log(`  📅 Jours travaillés: ${employeeStats.workDays}/7`);
    console.log(`  😴 Jour de repos: ${employee.restDay || 'Non défini'} - Respecté: ${employeeStats.respectsRestDay ? '✅' : '❌'}`);

    if (hoursDifference > tolerance) {
      errors.push(`⚠️ ${employee.name} - écart heures contractuelles important: ${employeeStats.totalHours}h vs ${employee.contractHoursPerWeek}h`);
    }

    // 4. Vérifier les préférences de jours
    if (employee.preferences?.preferredDays && employee.preferences.preferredDays.length > 0) {
      const workedPreferredDays = employee.preferences.preferredDays.filter(prefDay => 
        employeePlanning[prefDay] && employeePlanning[prefDay].length > 0
      );
      const preferenceRatio = workedPreferredDays.length / employee.preferences.preferredDays.length;
      
      console.log(`  💝 Préférences jours: ${workedPreferredDays.length}/${employee.preferences.preferredDays.length} respectées (${(preferenceRatio*100).toFixed(1)}%)`);
      
      if (preferenceRatio < 0.5) {
        errors.push(`⚠️ ${employee.name} - peu de jours préférés respectés (${(preferenceRatio*100).toFixed(1)}%)`);
        employeeStats.respectsPreferences = false;
      }
    }

    // 5. Vérifier les préférences d'heures
    if (employee.preferences?.preferredHours && employee.preferences.preferredHours.length > 0) {
      let totalSlots = 0;
      let slotsInPreferredHours = 0;

      for (const daySlots of Object.values(employeePlanning)) {
        if (!Array.isArray(daySlots)) continue;
        
        for (const slot of daySlots as any[]) {
          totalSlots++;
          for (const prefHour of employee.preferences.preferredHours) {
            if (isTimeInRange(slot.start, prefHour) && isTimeInRange(slot.end, prefHour)) {
              slotsInPreferredHours++;
              break;
            }
          }
        }
      }

      const hourPreferenceRatio = totalSlots > 0 ? slotsInPreferredHours / totalSlots : 0;
      console.log(`  🕐 Préférences horaires: ${slotsInPreferredHours}/${totalSlots} créneaux respectés (${(hourPreferenceRatio*100).toFixed(1)}%)`);
      
      if (hourPreferenceRatio < 0.3) {
        errors.push(`⚠️ ${employee.name} - peu de créneaux horaires préférés respectés (${(hourPreferenceRatio*100).toFixed(1)}%)`);
        employeeStats.respectsPreferences = false;
      }
    }

    details.employeeStats[employee._id] = employeeStats;
  }

  // 6. Vérifier les contraintes globales de l'entreprise
  console.log('\n🏢 === ANALYSE CONTRAINTES ENTREPRISE ===');
  
  // 6a. Jours d'ouverture
  if (scenario.companyConstraints.openDays) {
    for (const day of Object.keys(details.globalStats.daysWithActivity)) {
      if (!scenario.companyConstraints.openDays.includes(day)) {
        errors.push(`❌ Planning généré pour ${day} alors que l'entreprise est fermée`);
      }
    }
    console.log(`📅 Jours d'activité: ${[...details.globalStats.daysWithActivity].join(', ')}`);
    console.log(`📅 Jours d'ouverture: ${scenario.companyConstraints.openDays.join(', ')}`);
  }

  // 6b. Nombre minimum d'employés par créneau (approximatif)
  if (scenario.companyConstraints.minEmployeesPerSlot) {
    const timeSlots = new Map<string, number>();
    
    for (const [employeeId, employeePlanning] of Object.entries(planning)) {
      for (const [day, slots] of Object.entries(employeePlanning as any)) {
        if (!Array.isArray(slots)) continue;
        
        for (const slot of slots as any[]) {
          const slotKey = `${day}_${slot.start}-${slot.end}`;
          timeSlots.set(slotKey, (timeSlots.get(slotKey) || 0) + 1);
        }
      }
    }

    let slotsUnderStaffed = 0;
    for (const [slotKey, employeeCount] of timeSlots.entries()) {
      if (employeeCount < scenario.companyConstraints.minEmployeesPerSlot) {
        slotsUnderStaffed++;
      }
    }

    console.log(`👥 Créneaux sous-staffés: ${slotsUnderStaffed}/${timeSlots.size}`);
    if (slotsUnderStaffed > timeSlots.size * 0.3) {
      errors.push(`⚠️ Trop de créneaux sous-staffés: ${slotsUnderStaffed}/${timeSlots.size}`);
    }
  }

  console.log(`\n📊 Heures totales planifiées: ${details.globalStats.totalHours.toFixed(1)}h`);
  console.log(`📊 Jours avec activité: ${details.globalStats.daysWithActivity.size}/7`);

  return {
    isValid: errors.length === 0,
    errors,
    details
  };
}

// === SCÉNARIOS DE TEST ===

const testScenarios: TestScenario[] = [
  {
    name: "Scénario 1: Commerce de détail standard",
    description: "Magasin ouvert 6j/7, horaires 9h-20h, dimanche 9h-12h, 4 employés avec jours de repos",
    employees: [
      {
        _id: "emp_001",
        name: "Marie Dupont",
        contractHoursPerWeek: 35,
        restDay: "sunday",
        preferences: {
          preferredDays: ["monday", "tuesday", "wednesday", "thursday"],
          preferredHours: ["09:00-17:00"],
          allowSplitShifts: false
        }
      },
      {
        _id: "emp_002", 
        name: "Pierre Martin",
        contractHoursPerWeek: 40,
        restDay: "monday",
        preferences: {
          preferredDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
          preferredHours: ["10:00-20:00"],
          allowSplitShifts: true
        }
      },
      {
        _id: "emp_003",
        name: "Sophie Leroy", 
        contractHoursPerWeek: 28,
        restDay: "wednesday",
        preferences: {
          preferredDays: ["thursday", "friday", "saturday", "sunday"],
          preferredHours: ["09:00-15:00"],
          allowSplitShifts: false
        }
      },
      {
        _id: "emp_004",
        name: "Lucas Moreau",
        contractHoursPerWeek: 32,
        restDay: "friday",
        exceptions: [
          { date: "2025-07-23", type: "vacation" },
          { date: "2025-07-24", type: "vacation" }
        ],
        preferences: {
          preferredDays: ["monday", "saturday", "sunday"],
          preferredHours: ["14:00-20:00"],
          allowSplitShifts: true
        }
      }
    ],
    companyConstraints: {
      openDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      openHours: [
        "09:00-20:00", // Lundi à samedi
        "09:00-12:00"  // Dimanche
      ],
      minEmployeesPerSlot: 2,
      maxHoursPerDay: 8,
      minHoursPerDay: 4,
      mandatoryLunchBreak: true,
      lunchBreakDuration: 60
    },
    expectedResults: {
      totalEmployees: 4,
      respectsOpeningHours: true,
      respectsRestDays: true,
      respectsPreferences: true,
      respectsHourLimits: true
    }
  },

  {
    name: "Scénario 2: Restaurant avec contraintes strictes",
    description: "Restaurant fermé dimanche-lundi, service midi et soir, équipe réduite",
    employees: [
      {
        _id: "emp_101",
        name: "Chef Antoine",
        contractHoursPerWeek: 45,
        restDay: "sunday",
        preferences: {
          preferredDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
          preferredHours: ["11:00-15:00", "18:00-23:00"],
          allowSplitShifts: true
        }
      },
      {
        _id: "emp_102",
        name: "Serveur Julie",
        contractHoursPerWeek: 30,
        restDay: "monday",
        preferences: {
          preferredDays: ["tuesday", "wednesday", "thursday", "friday"],
          preferredHours: ["11:00-15:00", "18:00-22:00"],
          allowSplitShifts: true
        }
      },
      {
        _id: "emp_103",
        name: "Commis Paul",
        contractHoursPerWeek: 25,
        restDay: "tuesday",
        preferences: {
          preferredDays: ["wednesday", "thursday", "friday", "saturday"],
          preferredHours: ["10:00-16:00"],
          allowSplitShifts: false
        }
      }
    ],
    companyConstraints: {
      openDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
      openHours: [
        "11:00-15:00", // Service midi
        "18:00-23:00"  // Service soir
      ],
      minEmployeesPerSlot: 2,
      maxHoursPerDay: 10,
      minHoursPerDay: 3,
      mandatoryLunchBreak: false
    },
    expectedResults: {
      totalEmployees: 3,
      respectsOpeningHours: true,
      respectsRestDays: true,
      respectsPreferences: true,
      respectsHourLimits: true
    }
  },

  {
    name: "Scénario 3: Bureau avec horaires flexibles",
    description: "Bureau ouvert 5j/7, horaires flexibles 8h-19h, équipe avec préférences variées",
    employees: [
      {
        _id: "emp_201",
        name: "Manager Sarah",
        contractHoursPerWeek: 39,
        restDay: "saturday",
        preferences: {
          preferredDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          preferredHours: ["08:00-17:00"],
          allowSplitShifts: false
        }
      },
      {
        _id: "emp_202",
        name: "Dev Thomas", 
        contractHoursPerWeek: 35,
        restDay: "sunday",
        preferences: {
          preferredDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          preferredHours: ["10:00-19:00"],
          allowSplitShifts: false
        }
      },
      {
        _id: "emp_203",
        name: "Designer Clara",
        contractHoursPerWeek: 32,
        restDay: "friday",
        exceptions: [
          { date: "2025-07-22", type: "training" }
        ],
        preferences: {
          preferredDays: ["monday", "tuesday", "wednesday", "thursday"],
          preferredHours: ["09:00-18:00"],
          allowSplitShifts: false
        }
      }
    ],
    companyConstraints: {
      openDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      openHours: ["08:00-19:00"],
      minEmployeesPerSlot: 1,
      maxHoursPerDay: 9,
      minHoursPerDay: 6,
      mandatoryLunchBreak: true,
      lunchBreakDuration: 45
    },
    expectedResults: {
      totalEmployees: 3,
      respectsOpeningHours: true,
      respectsRestDays: true,
      respectsPreferences: true,
      respectsHourLimits: true
    }
  }
];

// === FONCTION PRINCIPALE DE TEST ===

async function runPlanningGenerationTests(): Promise<void> {
  console.log('🧪 === DÉBUT DES TESTS DE GÉNÉRATION DE PLANNING ===\n');
  
  const results = {
    totalTests: testScenarios.length,
    passedTests: 0,
    failedTests: 0,
    scenarios: [] as any[]
  };

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n🎯 TEST ${i + 1}/${testScenarios.length}: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log('─'.repeat(80));

    try {
      // Préparer les données pour l'appel API
      const planningInput = {
        employees: scenario.employees,
        weekNumber: 30, // Semaine de test
        year: 2025,
        companyConstraints: scenario.companyConstraints
      };

      console.log('📤 Données envoyées au générateur:');
      console.log(`   👥 Employés: ${planningInput.employees.length}`);
      console.log(`   📅 Jours ouverture: ${planningInput.companyConstraints.openDays?.join(', ') || 'Non défini'}`);
      console.log(`   🕐 Heures ouverture: ${planningInput.companyConstraints.openHours?.join(', ') || 'Non défini'}`);
      console.log(`   ⚙️ Contraintes: ${planningInput.companyConstraints.minEmployeesPerSlot}+ employés/créneau, ${planningInput.companyConstraints.minHoursPerDay}-${planningInput.companyConstraints.maxHoursPerDay}h/jour`);

      // Appeler le générateur de planning
      const startTime = Date.now();
      const generatedPlanning = generatePlanning(planningInput);
      const generationTime = Date.now() - startTime;

      console.log(`⚡ Temps de génération: ${generationTime}ms`);

      // Valider les résultats
      const validation = validatePlanningResults(generatedPlanning, scenario);
      
      const scenarioResult = {
        name: scenario.name,
        passed: validation.isValid,
        errors: validation.errors,
        details: validation.details,
        generationTime
      };

      if (validation.isValid) {
        console.log('\n✅ TEST RÉUSSI - Toutes les contraintes respectées');
        results.passedTests++;
      } else {
        console.log('\n❌ TEST ÉCHOUÉ - Contraintes non respectées:');
        validation.errors.forEach(error => console.log(`   ${error}`));
        results.failedTests++;
      }

      results.scenarios.push(scenarioResult);

    } catch (error) {
      console.log(`\n💥 ERREUR DURANT LE TEST: ${error}`);
      results.failedTests++;
      results.scenarios.push({
        name: scenario.name,
        passed: false,
        errors: [`Erreur d'exécution: ${error}`],
        details: null,
        generationTime: 0
      });
    }
  }

  // === RAPPORT FINAL ===
  console.log('\n' + '='.repeat(80));
  console.log('📊 === RAPPORT FINAL DES TESTS ===');
  console.log('='.repeat(80));
  console.log(`📋 Tests exécutés: ${results.totalTests}`);
  console.log(`✅ Tests réussis: ${results.passedTests}`);
  console.log(`❌ Tests échoués: ${results.failedTests}`);
  console.log(`📈 Taux de réussite: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);

  // Résumé par scénario
  console.log('\n📝 Détail par scénario:');
  results.scenarios.forEach((scenario, index) => {
    const status = scenario.passed ? '✅' : '❌';
    console.log(`   ${status} ${index + 1}. ${scenario.name} (${scenario.generationTime}ms)`);
    if (!scenario.passed && scenario.errors.length > 0) {
      scenario.errors.slice(0, 3).forEach((error: string) => console.log(`      ${error}`));
      if (scenario.errors.length > 3) {
        console.log(`      ... et ${scenario.errors.length - 3} autres erreurs`);
      }
    }
  });

  // Recommandations
  console.log('\n🔧 === RECOMMANDATIONS ===');
  if (results.failedTests === 0) {
    console.log('🎉 Excellent ! Tous les tests passent. Le système de génération');
    console.log('   de planning respecte correctement toutes les contraintes des wizards.');
  } else {
    console.log('⚠️  Améliorations nécessaires:');
    
    const allErrors = results.scenarios.flatMap(s => s.errors || []);
    const errorCategories = {
      restDays: allErrors.filter(e => e.includes('jour de repos')).length,
      openingHours: allErrors.filter(e => e.includes('heures d\'ouverture')).length,
      preferences: allErrors.filter(e => e.includes('préférés')).length,
      hourLimits: allErrors.filter(e => e.includes('heures max') || e.includes('heures min')).length,
      staffing: allErrors.filter(e => e.includes('sous-staffés')).length
    };

    Object.entries(errorCategories).forEach(([category, count]) => {
      if (count > 0) {
        const categoryNames = {
          restDays: 'Jours de repos',
          openingHours: 'Heures d\'ouverture', 
          preferences: 'Préférences employés',
          hourLimits: 'Limites horaires',
          staffing: 'Effectifs'
        };
        console.log(`   • ${categoryNames[category as keyof typeof categoryNames]}: ${count} problèmes`);
      }
    });
  }

  console.log('\n🏁 Tests terminés.');
  
  return;
}

// Exporter la fonction pour utilisation en ligne de commande
export { runPlanningGenerationTests };

// Exécution directe si appelé en standalone
if (require.main === module) {
  runPlanningGenerationTests()
    .then(() => {
      console.log('✅ Tests terminés avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'exécution des tests:', error);
      process.exit(1);
    });
}