/**
 * Route pour la génération automatique de planning hebdomadaire
 * 
 * Cette route utilise le service generatePlanning() avec moteur personnalisé
 * pour créer automatiquement un planning optimal en respectant
 * les contraintes et préférences des employés.
 * 
 * @route POST /api/schedules/auto-generate
 * @access Private (authentification requise)
 * @author SmartPlanning Team
 * @version 1.0.0
 */

import express, { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import authenticateToken, { AuthRequest } from '../middlewares/auth.middleware';
import { generatePlanning } from '../services/planning/generateSchedule';
import GeneratedScheduleModel from '../models/GeneratedSchedule.model';
import { cacheService, CacheKeyType, CacheHelpers } from '../services/cache.service';

// Création du router Express
const router = express.Router();

/**
 * Schéma de validation Zod pour la requête de génération de planning
 * Valide la structure et les types des données d'entrée
 */
const planningRequestSchema = z.object({
  weekNumber: z.number().min(1).max(53).int('Le numéro de semaine doit être un entier'),
  year: z.number().min(2023).max(2030).int('L\'année doit être un entier'),
  employees: z.array(z.object({
    _id: z.string().min(1, 'L\'ID employé est requis'),
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
                message: `Exception avec une année différente trouvée pour l'employé ${employee._id}`
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
        const cacheKey = CacheHelpers.planningKey(emp._id, planningData.year, planningData.weekNumber);
        const cached = await cacheService.get(CacheKeyType.PLANNING_GENERATED, cacheKey);
        
        if (cached && cached.planning && cached.planning[emp._id]) {
          cachedPlannings[emp._id] = cached.planning[emp._id];
          console.log(`💾 Cache HIT pour employé ${emp._id}`);
        } else {
          employeesToGenerate.push(emp);
          console.log(`🔍 Cache MISS pour employé ${emp._id}`);
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
            _id: emp._id || '',
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
      
      console.log('✅ Planning généré avec succès, passage à la sauvegarde...');
      
      // Calcul des statistiques du planning généré
      const stats = calculatePlanningStats(generatedPlanning, planningData.employees);
      
      // Sauvegarde du planning en base de données pour chaque employé
      console.log('💾 DÉBUT DE LA SAUVEGARDE...');
      console.log('💾 Plannings à sauvegarder:', Object.keys(generatedPlanning).length);
      
      const savedSchedules = [];
      for (const [employeeId, schedule] of Object.entries(generatedPlanning)) {
        console.log(`💾 Traitement employé: ${employeeId}`);
        try {
          // Conversion du format de planning vers le format de la base de données
          const scheduleData: { [day: string]: { slots: string[] } } = {};
          
          for (const [day, slots] of Object.entries(schedule)) {
            if (slots && slots.length > 0) {
              scheduleData[day] = {
                slots: slots.map(slot => `${slot.start}-${slot.end}`)
              };
            }
          }
          
          // Validation de l'employeeId
          if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            console.error(`ID employé invalide: ${employeeId}`);
            continue;
          }

          // Création du document en base
          const generatedSchedule = new GeneratedScheduleModel({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            scheduleData: scheduleData,
            generatedBy: req.user?.id || 'AI',
            timestamp: new Date(),
            status: 'draft',
            weekNumber: planningData.weekNumber,
            year: planningData.year
          });
          
          const savedSchedule = await generatedSchedule.save();
          savedSchedules.push(savedSchedule);
          
          console.log(`✅ Planning sauvegardé pour l'employé ${employeeId}:`, savedSchedule._id);
        } catch (saveError) {
          console.error(`❌ Erreur sauvegarde planning pour employé ${employeeId}:`, saveError);
          console.error('❌ Stack trace:', saveError instanceof Error ? saveError.stack : 'Stack trace non disponible');
        }
      }
      
      console.log(`${savedSchedules.length} plannings sauvegardés sur ${Object.keys(generatedPlanning).length}`);
      
      // Réponse de succès avec le planning généré
      return res.status(200).json({
        success: true,
        message: 'Planning généré avec succès',
        planning: generatedPlanning,
        savedSchedules: savedSchedules.length,
        metadata: {
          weekNumber: planningData.weekNumber,
          year: planningData.year,
          employeeCount: planningData.employees.length,
          generatedAt: new Date().toISOString(),
          stats
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
    const employee = employees.find(emp => emp._id === employeeId);
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