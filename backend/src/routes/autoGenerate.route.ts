/**
 * Route pour la génération automatique de planning hebdomadaire
 *
 * MIGRATION POSTGRESQL: Migré vers Prisma (sauvegarde désactivée)
 *
 * Cette route utilise le service generatePlanning() avec moteur personnalisé
 * pour créer automatiquement un planning optimal en respectant
 * les contraintes et préférences des employés.
 *
 * Note: Cette route génère un planning temporaire sans sauvegarde.
 * La sauvegarde finale se fait via weeklySchedules.route après validation.
 *
 * @route POST /api/schedules/auto-generate
 * @access Private (authentification requise)
 * @author SmartPlanning Team
 * @version 2.0.0 (PostgreSQL)
 */

import express, { Response } from 'express';
import { z } from 'zod';
import authenticateToken, { AuthRequest } from '../middlewares/auth.middleware';
import { generatePlanning } from '../services/planning/generateSchedule';
import { cacheService, CacheKeyType, CacheHelpers } from '../services/cache.service';

// Création du router Express
const router = express.Router();

/**
 * Schéma de validation Zod pour la requête de génération de planning
 * MIGRATION: Changé _id (string) → id (number) pour PostgreSQL
 */
const planningRequestSchema = z.object({
  weekNumber: z.number().min(1).max(53).int('Le numéro de semaine doit être un entier'),
  year: z.number().min(2023).max(2030).int('L\'année doit être un entier'),
  employees: z.array(z.object({
    id: z.number().int().positive('L\'ID employé doit être un entier positif'),
    contractHoursPerWeek: z.number().min(1).max(60, 'Les heures contractuelles doivent être entre 1 et 60'),
    exceptions: z.array(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Le format de date doit être YYYY-MM-DD'),
      type: z.enum(['vacation', 'sick', 'unavailable', 'training', 'reduced'], {
        errorMap: () => ({ message: 'Type d\'exception invalide' })
      }),
    })).optional(),
    preferences: z.object({
      preferredDays: z.array(z.string()).optional(),
      preferredHours: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Format horaire invalide (HH:MM-HH:MM)')).optional(),
      allowSplitShifts: z.boolean().optional()
    }).optional(),
    restDay: z.string().optional()
  })).min(1, 'Au moins un employé est requis'),
  companyConstraints: z.object({
    openDays: z.array(z.string()).optional(),
    openHours: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Format horaire invalide (HH:MM-HH:MM)')).optional(),
    minEmployeesPerSlot: z.number().min(0).optional(),
    maxHoursPerDay: z.number().min(4, 'Minimum 4 heures par jour').max(12, 'Maximum 12 heures par jour').optional(),
    minHoursPerDay: z.number().min(1, 'Minimum 1 heure par jour').max(12, 'Maximum 12 heures par jour').optional(),
    mandatoryLunchBreak: z.boolean().optional(),
    lunchBreakDuration: z.number().min(30, 'Minimum 30 minutes de pause').max(120, 'Maximum 120 minutes de pause').optional()
  }).optional()
});

/**
 * Type TypeScript pour la requête validée
 */
type PlanningRequest = z.infer<typeof planningRequestSchema>;

/**
 * @route   POST /api/schedules/auto-generate
 * @desc    Génère automatiquement un planning hebdomadaire optimal
 * @access  Private (authentification requise)
 * @body    {PlanningRequest} Données de génération du planning
 * @returns {Object} Planning généré ou erreur de validation
 */
router.post(
  '/auto-generate',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      // Validation des données d'entrée avec Zod
      const validationResult = planningRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        // Formatage des erreurs de validation pour une réponse claire
        const issues = validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }));

        return res.status(400).json({
          success: false,
          message: 'Paramètres de génération invalides',
          issues
        });
      }

      // Extraction des données validées
      const planningData: PlanningRequest = validationResult.data;

      // Validation métier supplémentaire
      if (planningData.employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucun employé fourni pour la génération du planning'
        });
      }

      // Vérification de la cohérence des dates d'exception
      const currentYear = planningData.year;
      for (const employee of planningData.employees) {
        if (employee.exceptions) {
          for (const exception of employee.exceptions) {
            const exceptionYear = parseInt(exception.date.split('-')[0]);
            if (exceptionYear !== currentYear) {
              return res.status(400).json({
                success: false,
                message: `Exception avec une année différente trouvée pour l'employé ${employee.id}`
              });
            }
          }
        }
      }

      // Vérifier le cache pour chaque employé d'abord
      console.log(`🔍 Vérification du cache pour ${planningData.employees.length} employé(s)...`);
      const cachedPlannings: { [employeeId: string]: any } = {};
      const employeesToGenerate = [];

      for (const emp of planningData.employees) {
        const cacheKey = CacheHelpers.planningKey(emp.id.toString(), planningData.year, planningData.weekNumber);
        const cached = await cacheService.get(CacheKeyType.PLANNING_GENERATED, cacheKey);

        if (cached && cached.planning && cached.planning[emp.id]) {
          cachedPlannings[emp.id] = cached.planning[emp.id];
          console.log(`💾 Cache HIT pour employé ${emp.id}`);
        } else {
          employeesToGenerate.push(emp);
          console.log(`🔍 Cache MISS pour employé ${emp.id}`);
        }
      }

      let generatedPlanning: any = {};

      // Si tous les plannings sont en cache, les utiliser
      if (employeesToGenerate.length === 0) {
        console.log('🎯 Tous les plannings trouvés en cache !');
        generatedPlanning = cachedPlannings;
      } else {
        // Générer seulement pour les employés non cachés
        console.log(`⚡ Génération du planning pour ${employeesToGenerate.length} employé(s) non cachés...`);

        const newlyGenerated = generatePlanning({
          employees: employeesToGenerate.map(emp => ({
            _id: emp.id.toString(),
            contractHoursPerWeek: emp.contractHoursPerWeek || 35,
            exceptions: emp.exceptions?.map(exc => ({
              date: exc.date || '',
              type: exc.type || 'unavailable'
            })),
            preferences: emp.preferences
          })),
          weekNumber: planningData.weekNumber,
          year: planningData.year,
          companyConstraints: planningData.companyConstraints
        });

        // Combiner les plannings cachés et nouvellement générés
        generatedPlanning = { ...cachedPlannings, ...newlyGenerated };

        // Mettre en cache les nouveaux plannings
        for (const [employeeId, schedule] of Object.entries(newlyGenerated)) {
          const cacheKey = CacheHelpers.planningKey(employeeId, planningData.year, planningData.weekNumber);
          await cacheService.set(
            CacheKeyType.PLANNING_GENERATED,
            cacheKey,
            { planning: { [employeeId]: schedule } },
            CacheHelpers.getTTL(CacheKeyType.PLANNING_GENERATED)
          );
          console.log(`💾 Mise en cache du planning pour employé ${employeeId}`);
        }
      }

      console.log('🎯 Planning généré par le service:', JSON.stringify(generatedPlanning, null, 2));
      console.log('📊 Employés dans le planning généré:', Object.keys(generatedPlanning));

      // Vérification que le planning a été généré
      if (!generatedPlanning || Object.keys(generatedPlanning).length === 0) {
        console.log('❌ Planning généré vide ou null');
        return res.status(500).json({
          success: false,
          message: 'Impossible de générer un planning avec les contraintes fournies'
        });
      }

      console.log('✅ Planning généré avec succès');

      // Calcul des statistiques du planning généré
      const stats = calculatePlanningStats(generatedPlanning, planningData.employees);

      // MIGRATION NOTE: Sauvegarde désactivée
      // L'ancien système MongoDB sauvegardait un document par employé ici
      // Le nouveau système PostgreSQL utilise WeeklySchedule pour la sauvegarde finale
      // Cette route retourne uniquement le planning généré pour prévisualisation

      // Réponse de succès avec le planning généré
      return res.status(200).json({
        success: true,
        message: 'Planning généré avec succès',
        planning: generatedPlanning,
        metadata: {
          weekNumber: planningData.weekNumber,
          year: planningData.year,
          employeeCount: planningData.employees.length,
          generatedAt: new Date().toISOString(),
          stats,
          note: 'Planning temporaire - utilisez /api/weekly-schedules pour sauvegarder'
        }
      });

    } catch (error) {
      // Gestion des erreurs du service de génération
      console.error('Erreur lors de la génération automatique du planning:', error);

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la génération du planning',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erreur interne'
      });
    }
  }
);

/**
 * Calcule les statistiques du planning généré
 * @param planning Planning généré
 * @param employees Liste des employés
 * @returns Statistiques du planning
 */
function calculatePlanningStats(
  planning: { [employeeId: string]: { [day: string]: { start: string; end: string; }[]; } },
  employees: PlanningRequest['employees']
): {
  totalHoursPlanned: number;
  averageHoursPerEmployee: number;
  employeesWithFullSchedule: number;
  daysWithActivity: number;
} {
  let totalHoursPlanned = 0;
  let employeesWithFullSchedule = 0;
  const activeDays = new Set<string>();

  // Calcul des heures totales planifiées
  for (const [employeeId, schedule] of Object.entries(planning)) {
    let employeeHours = 0;

    for (const [day, slots] of Object.entries(schedule)) {
      if (slots.length > 0) {
        activeDays.add(day);

        for (const slot of slots) {
          // Calcul de la durée du créneau
          const [startHour, startMinute] = slot.start.split(':').map(Number);
          const [endHour, endMinute] = slot.end.split(':').map(Number);
          const startTime = startHour + startMinute / 60;
          const endTime = endHour + endMinute / 60;
          const slotDuration = endTime - startTime;

          employeeHours += slotDuration;
          totalHoursPlanned += slotDuration;
        }
      }
    }

    // Vérification si l'employé a un planning complet
    const employee = employees.find(emp => emp.id.toString() === employeeId);
    if (employee && employeeHours >= employee.contractHoursPerWeek * 0.9) {
      employeesWithFullSchedule++;
    }
  }

  return {
    totalHoursPlanned: Math.round(totalHoursPlanned * 100) / 100,
    averageHoursPerEmployee: Math.round((totalHoursPlanned / employees.length) * 100) / 100,
    employeesWithFullSchedule,
    daysWithActivity: activeDays.size
  };
}


// Export du router pour utilisation dans l'application principale
export default router;
