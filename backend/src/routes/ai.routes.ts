/**
 * Routes pour la génération automatique de plannings via IA
 *
 * Ce fichier contient les routes permettant :
 * - de générer automatiquement un planning pour une équipe via l'API OpenRouter
 * - de traiter les préférences des employés et les contraintes métiers
 * - de sauvegarder les plannings générés en base de données
 */

import { addDays, startOfWeek } from "date-fns";
import dotenv from "dotenv";
import express, { Response } from "express";
import mongoose from "mongoose";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import EmployeeModel, { IEmployee } from "../models/Employee.model";
import {
  GeneratedScheduleModel,
  IGeneratedSchedule,
} from "../models/GeneratedSchedule.model";
import { TeamModel } from "../models/Team.model";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";
import { planningConstraintsSchema, PlanningConstraints } from "../schemas/planning.schemas";

// Charger les variables d'environnement
dotenv.config();

const router = express.Router();

/**
 * Interface pour le body de la requête de génération de planning
 */
interface GenerateScheduleRequest {
  teamId: string;
  year: number;
  weekNumber: number;
  constraints: string[];
  notes?: string;
}

/**
 * Interface pour la réponse de l'API OpenRouter
 */
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
      reasoning?: string; // Ajout pour les modèles comme Hunyuan qui utilisent reasoning
    };
  }>;
}

/**
 * Interface pour le planning généré par l'IA
 */
interface GeneratedScheduleData {
  [day: string]: { [employeeName: string]: string[] };
}

/**
 * Interface pour l'interaction conversationnelle avec l'IA
 */
interface ConversationRequest {
  teamId: string;
  year: number;
  weekNumber: number;
  message: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}

interface ConversationResponse {
  message: string;
  questions?: string[];
  suggestions?: string[];
  needsMoreInfo: boolean;
  readyToGenerate: boolean;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
}

/**
 * @route   POST /api/ai/generate-schedule
 * @desc    Générer automatiquement un planning pour une équipe via l'API OpenRouter
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.post(
  "/generate-schedule",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // 📥 Extraction et validation des données de la requête
      const {
        teamId,
        year,
        weekNumber,
        constraints,
        notes,
      }: GenerateScheduleRequest = req.body;

      console.log(
        `[AI] Génération de planning demandée par ${req.user._id} pour l'équipe ${teamId}`
      );

      // ✅ Validation des champs obligatoires
      if (
        !teamId ||
        !year ||
        !weekNumber ||
        !constraints ||
        !Array.isArray(constraints)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Tous les champs obligatoires doivent être fournis : teamId, year, weekNumber, constraints (array)",
        });
      }

      // ✅ Validation des types et valeurs
      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide",
        });
      }

      if (year < 2020 || year > 2030) {
        return res.status(400).json({
          success: false,
          message: "L'année doit être comprise entre 2020 et 2030",
        });
      }

      if (weekNumber < 1 || weekNumber > 53) {
        return res.status(400).json({
          success: false,
          message: "Le numéro de semaine doit être compris entre 1 et 53",
        });
      }

      if (constraints.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Au moins une contrainte doit être spécifiée",
        });
      }

      // 🔍 Récupération de l'équipe avec ses employés
      const team = await TeamModel.findById(teamId)
        .populate("employeeIds")
        .lean();

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès à l'équipe
      const userIsManager = team.managerIds.some(
        (managerId) => managerId.toString() === req.user._id.toString()
      );
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId?.toString();
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à générer un planning pour cette équipe",
        });
      }

      // 👥 Récupération des détails des employés
      const employees = team.employeeIds as unknown as IEmployee[];

      if (!employees || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun employé trouvé dans cette équipe",
        });
      }

      console.log(
        `[AI] ${employees.length} employés trouvés dans l'équipe ${team.name}`
      );

      // 🤖 Construction du prompt pour l'IA
      let employeeDetails = "";
      employees.forEach((employee: IEmployee) => {
        const preferredDays =
          employee.preferences?.preferredDays?.join(", ") ||
          "Aucune préférence spécifiée";
        const preferredHours =
          employee.preferences?.preferredHours?.join(", ") ||
          "Aucune préférence spécifiée";
        const contractHours = employee.contractHoursPerWeek || "Non spécifié";
        const anciennete = employee.startDate
          ? `${
              new Date().getFullYear() -
              new Date(employee.startDate).getFullYear()
            } ans`
          : "Non spécifiée";

        employeeDetails += `- ${employee.firstName} ${employee.lastName}:
  * Contrat: ${contractHours}h/semaine (soit ${
          typeof contractHours === "number"
            ? Math.round(contractHours / 5)
            : "N/A"
        }h/jour en moyenne)
  * Jours préférés: ${preferredDays}
  * Horaires préférés: ${preferredHours}
  * Ancienneté: ${anciennete}
  * Statut: ${employee.status}
`;
      });

      const constraintsList = constraints
        .map((constraint) => `- ${constraint}`)
        .join("\n");

      // 📅 Informations contextuelles enrichies
      const weekDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const weekInfo = `Semaine ${weekNumber}/${year} (début: ${weekDate.toLocaleDateString(
        "fr-FR"
      )})`;

      const prompt = `Tu es un expert en planification RH. Créé un planning hebdomadaire optimisé et équilibré.

📋 ÉQUIPE "${team.name}" - ${weekInfo}

👥 EMPLOYÉS (${employees.length} personnes):
${employeeDetails}

⚠️ CONTRAINTES OBLIGATOIRES:
${constraintsList}

${notes ? `📝 NOTES SPÉCIALES: ${notes}` : ""}

🎯 OBJECTIFS DE PLANIFICATION:
1. RESPECTER les heures contractuelles de chaque employé
2. PRIORISER les préférences d'horaires et de jours
3. ASSURER une répartition équitable de la charge
4. RESPECTER le repos hebdomadaire légal (minimum 35h consécutives)
5. ÉVITER les journées trop longues (maximum 10h/jour)
6. GARANTIR une couverture de service adaptée

🔧 RÈGLES TECHNIQUES:
- Format horaire: "HH:MM-HH:MM" (ex: "08:00-12:00")
- Pauses déjeuner: 1h minimum entre créneaux matin/après-midi
- Repos quotidien: 11h minimum entre deux services
- Horaires classiques: 7h-19h (adapter selon les préférences)

💡 CONSEILS D'OPTIMISATION:
- Grouper les préférences similaires
- Alterner les équipes matin/après-midi
- Prévoir des créneaux de chevauchement pour transmission
- Équilibrer expérience et nouveaux arrivants

FORMAT ATTENDU (JSON STRICT - pas de texte avant/après):
{
  "lundi": { 
    "Alice Martin": ["08:00-12:00", "13:00-17:00"],
    "Jean Dupont": ["09:00-13:00"]
  },
  "mardi": { 
    "Alice Martin": ["08:00-12:00"],
    "Jean Dupont": ["14:00-18:00"]
  },
  "mercredi": { 
    "Alice Martin": ["08:00-12:00", "13:00-17:00"],
    "Jean Dupont": []
  },
  "jeudi": { 
    "Alice Martin": ["09:00-13:00"],
    "Jean Dupont": ["14:00-18:00"]
  },
  "vendredi": { 
    "Alice Martin": [],
    "Jean Dupont": ["08:00-12:00", "13:00-17:00"]
  },
  "samedi": {},
  "dimanche": {}
}

⚡ GÉNÈRE LE PLANNING OPTIMAL EN RESPECTANT TOUTES CES DIRECTIVES.`;

      console.log(`[AI] Envoi du prompt à OpenRouter...`);

      // 🌐 Appel à l'API OpenRouter
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        return res.status(500).json({
          success: false,
          message: "Clé API OpenRouter non configurée",
        });
      }

      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              {
                role: "system",
                content: "Tu es un expert en organisation RH. Génère un planning hebdomadaire clair et équilibré à partir de contraintes."
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
          }),
        }
      );

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(
          `[AI] Erreur OpenRouter (${openRouterResponse.status}):`,
          errorText
        );
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'appel à l'API OpenRouter",
          error: `Status ${openRouterResponse.status}: ${errorText}`,
        });
      }

      const openRouterData: OpenRouterResponse =
        await openRouterResponse.json();

      if (
        !openRouterData.choices ||
        !openRouterData.choices[0] ||
        !openRouterData.choices[0].message
      ) {
        return res.status(500).json({
          success: false,
          message: "Réponse invalide de l'API OpenRouter",
        });
      }

      // Gérer les modèles qui mettent la réponse dans 'reasoning' (comme Hunyuan) ou 'content'
      const aiResponseContent = openRouterData.choices[0].message.content || 
                                openRouterData.choices[0].message.reasoning || 
                                'Erreur: Aucune réponse de l\'IA';
      console.log(`[AI] Réponse reçue de l'IA:`, aiResponseContent);

      // 📊 Parsing de la réponse de l'IA
      let generatedScheduleData: GeneratedScheduleData;

      try {
        // Nettoyer la réponse (enlever les éventuels backticks ou texte superflu)
        const cleanedResponse = aiResponseContent
          .replace(/```json|```/g, "")
          .trim();
        generatedScheduleData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error(`[AI] Erreur de parsing JSON:`, parseError);
        return res.status(500).json({
          success: false,
          message: "Impossible de parser la réponse de l'IA",
          error: (parseError as Error).message,
          aiResponse: aiResponseContent,
        });
      }

      // 💾 Sauvegarde des plannings générés en base de données
      console.log(`[AI] Sauvegarde des plannings générés...`);

      const savedSchedules: IGeneratedSchedule[] = [];

      // Pour chaque employé, créer un document GeneratedSchedule
      for (const employee of employees) {
        const employeeFullName = `${employee.firstName} ${employee.lastName}`;

        // Construire les données de planning pour cet employé
        const employeeScheduleData: { [day: string]: { slots?: string[] } } =
          {};

        // Parcourir chaque jour de la semaine
        const daysOfWeek = [
          "lundi",
          "mardi",
          "mercredi",
          "jeudi",
          "vendredi",
          "samedi",
          "dimanche",
        ];

        for (const day of daysOfWeek) {
          if (
            generatedScheduleData[day] &&
            generatedScheduleData[day][employeeFullName] &&
            generatedScheduleData[day][employeeFullName].length > 0
          ) {
            // Transformer les créneaux de l'IA en format compatible avec le frontend
            employeeScheduleData[day] = {
              slots: generatedScheduleData[day][employeeFullName],
            };
          } else {
            // Jour sans horaires = repos
            employeeScheduleData[day] = {};
          }
        }

        // Créer le document GeneratedSchedule pour cet employé
        const generatedSchedule = new GeneratedScheduleModel({
          employeeId: (employee as any)._id || employee.userId,
          scheduleData: new Map(Object.entries(employeeScheduleData)),
          generatedBy: req.user._id,
          timestamp: new Date(),
          status: "draft",
          weekNumber: weekNumber,
          year: year,
        });

        const savedSchedule = await generatedSchedule.save();
        savedSchedules.push(savedSchedule);

        console.log(
          `[AI] Planning sauvegardé pour ${employeeFullName} (ID: ${savedSchedule._id})`
        );
      }

      // ✅ Réponse de succès avec les données sauvegardées
      return res.status(201).json({
        success: true,
        message: `Planning généré avec succès pour ${employees.length} employés de l'équipe ${team.name}`,
        data: {
          teamId: team._id,
          teamName: team.name,
          weekNumber,
          year,
          employeesCount: employees.length,
          generatedSchedules: savedSchedules.map((schedule) => ({
            id: (schedule as any)._id,
            employeeId: schedule.employeeId,
            status: schedule.status,
            timestamp: schedule.timestamp,
          })),
          rawScheduleData: generatedScheduleData,
        },
      });
    } catch (error) {
      // ⚠️ Gestion globale des erreurs
      console.error("[AI] Erreur lors de la génération du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la génération du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   GET /api/ai/generated-schedules
 * @desc    Récupérer tous les plannings IA avec le statut "draft"
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.get(
  "/generated-schedules",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        console.log('❌ [AI API] Utilisateur non authentifié');
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      console.log(
        `[AI] Récupération des plannings générés par ${req.user._id} (${req.user.role})`
      );
      console.log(`[AI] Paramètres de la requête:`, req.query);
      console.log(`[AI] User companyId:`, req.user.companyId);
      console.log(`[AI] User role:`, req.user.role);

      // 🔍 Construction de la requête selon le rôle
      let query: any = { status: "draft" };
      
      // Inclure les plannings générés automatiquement ET par IA
      // query.generatedBy peut être un ObjectId (IA) ou 'AUTO_GENERATE' (génération automatique)
      
      console.log(`[AI] Requête initiale:`, query);

      if (req.user.role === "manager") {
        // Manager : seulement les plannings des équipes qu'il gère
        const managedTeams = await TeamModel.find({
          managerIds: req.user._id,
        }).select("_id");

        const teamIds = managedTeams.map((team) => team._id);

        if (teamIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
            message: "Aucune équipe gérée trouvée",
          });
        }

        // Récupérer les employés de ces équipes
        const teamsWithEmployees = await TeamModel.find({
          _id: { $in: teamIds },
        }).select("employeeIds");

        const employeeIds: any[] = [];
        teamsWithEmployees.forEach((team) => {
          if (team.employeeIds && team.employeeIds.length > 0) {
            employeeIds.push(...team.employeeIds);
          }
        });

        // Utiliser directement les IDs des employés sans populate
        query.employeeId = { $in: employeeIds };
        console.log(`[AI] Requête manager - employeeIds trouvés:`, employeeIds.length);
      } else if (req.user.role === "directeur") {
        // Directeur : seulement les plannings des équipes de sa société
        const companyTeams = await TeamModel.find({
          companyId: req.user.companyId,
        }).select("employeeIds");

        const employeeIds: any[] = [];
        companyTeams.forEach((team) => {
          if (team.employeeIds && team.employeeIds.length > 0) {
            employeeIds.push(...team.employeeIds);
          }
        });

        if (employeeIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
            message: "Aucun employé trouvé dans votre société",
          });
        }

        // Utiliser directement les IDs des employés sans populate
        query.employeeId = { $in: employeeIds };
        console.log(`[AI] Requête directeur - employeeIds trouvés:`, employeeIds.length);
      }
      // Admin : pas de filtre supplémentaire, tous les plannings

      // 📊 Récupération des plannings avec population des données
      const generatedSchedules = await GeneratedScheduleModel.find(query)
        .populate({
          path: "employeeId",
          select: "firstName lastName email photoUrl",
        })
        .populate({
          path: "generatedBy",
          select: "firstName lastName",
          // Ne pas faire planter la requête si generatedBy n'est pas un ObjectId
          options: { strictPopulate: false }
        })
        .sort({ timestamp: -1 });

      console.log(`[AI] Plannings trouvés: ${generatedSchedules.length}`);

      // 🏢 Enrichissement avec les données d'équipe
      const enrichedSchedules = await Promise.all(
        generatedSchedules.map(async (schedule) => {
          // ✅ Conversion robuste MongoDB Map -> Objet JavaScript
          const scheduleDataObject: any = {};

          if (schedule.scheduleData instanceof Map) {
            for (const [day, data] of schedule.scheduleData.entries()) {
              // ✅ Extraire seulement les vraies données (pas les propriétés Mongoose)
              const dataAny = data as any;
              scheduleDataObject[day] =
                dataAny && typeof dataAny.toObject === "function"
                  ? dataAny.toObject()
                  : dataAny && dataAny._doc
                  ? dataAny._doc
                  : dataAny;
            }
          } else if (
            schedule.scheduleData &&
            typeof schedule.scheduleData === "object"
          ) {
            // Conversion manuelle pour s'assurer du bon format
            for (const [day, data] of Object.entries(schedule.scheduleData)) {
              const dataAny = data as any;
              scheduleDataObject[day] =
                dataAny && typeof dataAny.toObject === "function"
                  ? dataAny.toObject()
                  : dataAny && dataAny._doc
                  ? dataAny._doc
                  : dataAny;
            }
          }

          // ✅ Mapping français -> anglais pour compatibilité frontend
          const dayMapping = {
            lundi: "monday",
            mardi: "tuesday",
            mercredi: "wednesday",
            jeudi: "thursday",
            vendredi: "friday",
            samedi: "saturday",
            dimanche: "sunday",
          };

          const frontendScheduleData: any = {};
          for (const [frenchDay, data] of Object.entries(scheduleDataObject)) {
            const englishDay =
              dayMapping[frenchDay as keyof typeof dayMapping] || frenchDay;
            frontendScheduleData[englishDay] = data;
          }

          // Trouver l'équipe de l'employé
          const team = await TeamModel.findOne({
            employeeIds: schedule.employeeId,
          }).select("name _id");

          // Gestion spéciale pour les plannings générés automatiquement
          const generatedByInfo = (schedule.generatedBy === 'AUTO_GENERATE' || schedule.generatedBy === 'AI')
            ? { _id: 'AI', firstName: 'Génération', lastName: 'Automatique' }
            : schedule.generatedBy;

          return {
            _id: schedule._id.toString(),
            employeeId: schedule.employeeId,
            scheduleData: frontendScheduleData,
            status: schedule.status,
            timestamp: schedule.timestamp,
            generatedBy: generatedByInfo,
            employee: schedule.employeeId,
            teamId: team?._id,
            teamName: team?.name || "Équipe non trouvée",
            constraints: [],
            notes: (schedule.generatedBy === 'AUTO_GENERATE' || schedule.generatedBy === 'AI') ? "Planning généré automatiquement via jsLPSolver" : "",
            weekNumber: schedule.weekNumber || 1,
            year: schedule.year || new Date().getFullYear(),
          };
        })
      );

      console.log(`[AI] ${enrichedSchedules.length} plannings trouvés`);
      console.log(`[AI] Requête finale utilisée:`, JSON.stringify(query, null, 2));
      
      // Log détaillé des premiers plannings
      if (enrichedSchedules.length > 0) {
        console.log(`[AI] Premier planning enrichi:`, JSON.stringify(enrichedSchedules[0], null, 2));
      }

      return res.status(200).json({
        success: true,
        data: enrichedSchedules,
        count: enrichedSchedules.length,
      });
    } catch (error) {
      console.error(
        "[AI] Erreur lors de la récupération des plannings:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   PATCH /api/ai/generated-schedules/:id
 * @desc    Mettre à jour le scheduleData d'un planning IA
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.patch(
  "/generated-schedules/:id",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { id } = req.params;
      const { scheduleData } = req.body;

      // ✅ Validation des paramètres
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      if (!scheduleData || typeof scheduleData !== "object") {
        return res.status(400).json({
          success: false,
          message: "Données de planning (scheduleData) manquantes ou invalides",
        });
      }

      console.log(`[AI] Mise à jour du planning ${id} par ${req.user._id}`);

      // 🔍 Récupération du planning existant
      const existingSchedule = await GeneratedScheduleModel.findById(id)
        .populate("employeeId")
        .lean();

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès
      if (req.user.role !== "admin") {
        // Trouver l'équipe de l'employé
        const team = await TeamModel.findOne({
          employeeIds: existingSchedule.employeeId,
        });

        if (!team) {
          return res.status(404).json({
            success: false,
            message: "Équipe de l'employé introuvable",
          });
        }

        const userIsManager = team.managerIds.some(
          (managerId) => managerId.toString() === req.user._id.toString()
        );
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === team.companyId?.toString();

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à modifier ce planning",
          });
        }
      }

      // 💾 Mise à jour du planning
      const updatedSchedule = await GeneratedScheduleModel.findByIdAndUpdate(
        id,
        {
          scheduleData,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate("employeeId", "firstName lastName email");

      console.log(`[AI] Planning ${id} mis à jour avec succès`);

      return res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: "Planning mis à jour avec succès",
      });
    } catch (error) {
      console.error("[AI] Erreur lors de la mise à jour du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   PATCH /api/ai/generated-schedules/:id/validate
 * @desc    Valider un planning IA (passer status à "approved")
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.patch(
  "/generated-schedules/:id/validate",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { id } = req.params;
      const { validatedBy } = req.body;

      // ✅ Validation des paramètres
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      if (!validatedBy || !mongoose.Types.ObjectId.isValid(validatedBy)) {
        return res.status(400).json({
          success: false,
          message: "ID du validateur manquant ou invalide",
        });
      }

      console.log(`[AI] Validation du planning ${id} par ${req.user._id}`);

      // 🔍 Récupération du planning existant
      const existingSchedule = await GeneratedScheduleModel.findById(id)
        .populate("employeeId")
        .lean();

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      if (existingSchedule.status !== "draft") {
        return res.status(400).json({
          success: false,
          message: "Seuls les plannings en brouillon peuvent être validés",
        });
      }

      // 🔐 Vérification des droits d'accès (même logique que pour la mise à jour)
      if (req.user.role !== "admin") {
        const team = await TeamModel.findOne({
          employeeIds: existingSchedule.employeeId,
        });

        if (!team) {
          return res.status(404).json({
            success: false,
            message: "Équipe de l'employé introuvable",
          });
        }

        const userIsManager = team.managerIds.some(
          (managerId) => managerId.toString() === req.user._id.toString()
        );
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === team.companyId?.toString();

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à valider ce planning",
          });
        }
      }

      // ✅ Validation du planning - Créer un WeeklySchedule et supprimer le GeneratedSchedule
      console.log(`[AI] Création du planning hebdomadaire pour validation...`);

      // 📊 Convertir les données de planning et calculer le total des minutes
      const scheduleDataMap = new Map<string, string[]>();
      let totalWeeklyMinutes = 0;

      // ✅ Mapping français -> anglais pour compatibilité avec WeeklySchedule
      const dayMapping = {
        lundi: "monday",
        mardi: "tuesday",
        mercredi: "wednesday",
        jeudi: "thursday",
        vendredi: "friday",
        samedi: "saturday",
        dimanche: "sunday",
      };

      if (existingSchedule.scheduleData instanceof Map) {
        for (const [day, data] of existingSchedule.scheduleData.entries()) {
          const slots = (data as any)?.slots || [];

          // Convertir la clé française en anglaise
          const englishDay = dayMapping[day as keyof typeof dayMapping] || day;
          scheduleDataMap.set(englishDay, slots);

          // Calculer les minutes pour ce jour
          slots.forEach((slot: string) => {
            const [start, end] = slot.split("-");
            if (start && end) {
              const [startH, startM] = start.split(":").map(Number);
              const [endH, endM] = end.split(":").map(Number);
              const minutes = endH * 60 + endM - (startH * 60 + startM);
              totalWeeklyMinutes += minutes;
            }
          });
        }
      } else {
        // Si ce n'est pas une Map, convertir l'objet
        for (const [day, data] of Object.entries(
          existingSchedule.scheduleData || {}
        )) {
          const slots = (data as any)?.slots || [];

          // Convertir la clé française en anglaise
          const englishDay = dayMapping[day as keyof typeof dayMapping] || day;
          scheduleDataMap.set(englishDay, slots);

          // Calculer les minutes pour ce jour
          slots.forEach((slot: string) => {
            const [start, end] = slot.split("-");
            if (start && end) {
              const [startH, startM] = start.split(":").map(Number);
              const [endH, endM] = end.split(":").map(Number);
              const minutes = endH * 60 + endM - (startH * 60 + startM);
              totalWeeklyMinutes += minutes;
            }
          });
        }
      }

      // 🗓️ Calculer les dates quotidiennes de la semaine avec les clés anglaises
      const dailyDates = new Map<string, Date>();
      if (existingSchedule.weekNumber && existingSchedule.year) {
        // Utiliser date-fns pour calculer le début de la semaine
        const yearStart = new Date(existingSchedule.year, 0, 1);
        const firstWeekStart = startOfWeek(yearStart, { weekStartsOn: 1 });
        const targetWeekStart = addDays(
          firstWeekStart,
          (existingSchedule.weekNumber - 1) * 7
        );

        const dayNames = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        dayNames.forEach((day, index) => {
          const dayDate = addDays(targetWeekStart, index);
          dailyDates.set(day, dayDate);
        });
      } else {
        // Fallback : utiliser la semaine actuelle
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const dayNames = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        dayNames.forEach((day, index) => {
          const dayDate = addDays(weekStart, index);
          dailyDates.set(day, dayDate);
        });
      }

      // 🆕 Créer le planning hebdomadaire
      const weeklySchedule = new WeeklyScheduleModel({
        employeeId: existingSchedule.employeeId,
        year: existingSchedule.year || new Date().getFullYear(),
        weekNumber: existingSchedule.weekNumber || 1,
        scheduleData: scheduleDataMap,
        status: "approved",
        updatedBy: validatedBy,
        notes: "", // Notes vides par défaut
        dailyDates: dailyDates,
        totalWeeklyMinutes: totalWeeklyMinutes,
      });

      const savedWeeklySchedule = await weeklySchedule.save();

      // 🗑️ Supprimer le planning généré de la collection GeneratedSchedule
      await GeneratedScheduleModel.findByIdAndDelete(id);

      console.log(
        `[AI] Planning ${id} validé et transféré vers WeeklySchedule (${savedWeeklySchedule._id})`
      );

      return res.status(200).json({
        success: true,
        data: {
          weeklySchedule: savedWeeklySchedule,
          message: "Planning validé et créé avec succès",
        },
        message: "Planning validé avec succès",
      });
    } catch (error) {
      console.error("[AI] Erreur lors de la validation du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la validation du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   PATCH /api/ai/generated-schedules/:id/reject
 * @desc    Refuser un planning IA (passer status à "rejected")
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.patch(
  "/generated-schedules/:id/reject",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { id } = req.params;
      const { validatedBy } = req.body;

      // ✅ Validation des paramètres
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide",
        });
      }

      if (!validatedBy || !mongoose.Types.ObjectId.isValid(validatedBy)) {
        return res.status(400).json({
          success: false,
          message: "ID du validateur manquant ou invalide",
        });
      }

      console.log(`[AI] Refus du planning ${id} par ${req.user._id}`);

      // 🔍 Récupération du planning existant
      const existingSchedule = await GeneratedScheduleModel.findById(id)
        .populate("employeeId")
        .lean();

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      if (existingSchedule.status !== "draft") {
        return res.status(400).json({
          success: false,
          message: "Seuls les plannings en brouillon peuvent être refusés",
        });
      }

      // 🔐 Vérification des droits d'accès (même logique que pour la validation)
      if (req.user.role !== "admin") {
        const team = await TeamModel.findOne({
          employeeIds: existingSchedule.employeeId,
        });

        if (!team) {
          return res.status(404).json({
            success: false,
            message: "Équipe de l'employé introuvable",
          });
        }

        const userIsManager = team.managerIds.some(
          (managerId) => managerId.toString() === req.user._id.toString()
        );
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === team.companyId?.toString();

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à refuser ce planning",
          });
        }
      }

      // ❌ Refus du planning - Suppression définitive
      await GeneratedScheduleModel.findByIdAndDelete(id);

      console.log(`[AI] Planning ${id} refusé et supprimé définitivement`);

      return res.status(200).json({
        success: true,
        data: {
          deletedScheduleId: id,
          employeeName: `${(existingSchedule.employeeId as any).firstName} ${
            (existingSchedule.employeeId as any).lastName
          }`,
        },
        message: "Planning refusé et supprimé définitivement",
      });
    } catch (error) {
      console.error("[AI] Erreur lors du refus du planning:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors du refus du planning",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * @route   POST /api/ai/conversation
 * @desc    Interaction conversationnelle avec l'IA pour clarifier les besoins de planning
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.post(
  "/conversation",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const {
        teamId,
        year,
        weekNumber,
        message,
        conversationHistory = [],
      }: ConversationRequest = req.body;

      console.log(
        `[AI Conversation] Nouvelle interaction pour l'équipe ${teamId} par ${req.user._id}`
      );

      // ✅ Validation des champs obligatoires
      if (!teamId || !year || !weekNumber || !message) {
        return res.status(400).json({
          success: false,
          message:
            "Tous les champs obligatoires doivent être fournis : teamId, year, weekNumber, message",
        });
      }

      // 🔍 Récupération de l'équipe avec ses employés
      const team = await TeamModel.findById(teamId)
        .populate("employeeIds")
        .lean();

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès à l'équipe
      const userIsManager = team.managerIds.some(
        (managerId) => managerId.toString() === req.user._id.toString()
      );
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId?.toString();
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à interagir avec l'IA pour cette équipe",
        });
      }

      const employees = team.employeeIds as unknown as IEmployee[];

      if (!employees || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun employé trouvé dans cette équipe",
        });
      }

      // 🧠 Construction du contexte enrichi pour l'IA
      let employeeDetails = "";
      employees.forEach((employee: IEmployee) => {
        const preferredDays =
          employee.preferences?.preferredDays?.join(", ") ||
          "Aucune préférence spécifiée";
        const preferredHours =
          employee.preferences?.preferredHours?.join(", ") ||
          "Aucune préférence spécifiée";
        const contractHours = employee.contractHoursPerWeek || "Non spécifié";
        const anciennete = employee.startDate
          ? `${
              new Date().getFullYear() -
              new Date(employee.startDate).getFullYear()
            } ans`
          : "Non spécifiée";

        employeeDetails += `- ${employee.firstName} ${employee.lastName}:
  * Contrat: ${contractHours}h/semaine (soit ${
          typeof contractHours === "number"
            ? Math.round(contractHours / 5)
            : "N/A"
        }h/jour en moyenne)
  * Jours préférés: ${preferredDays}
  * Horaires préférés: ${preferredHours}
  * Ancienneté: ${anciennete}
  * Statut: ${employee.status}
`;
      });

      // 📅 Informations contextuelles de la semaine
      const weekDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const weekInfo = `Semaine ${weekNumber}/${year} (${weekDate.toLocaleDateString(
        "fr-FR"
      )})`;

      // 💬 Historique de conversation pour contexte
      const historyContext =
        conversationHistory.length > 0
          ? conversationHistory
              .map(
                (entry) =>
                  `${entry.role === "user" ? "Manager" : "Assistant"}: ${
                    entry.content
                  }`
              )
              .join("\n")
          : "Première interaction";

      const conversationPrompt = `Tu es un assistant RH expert en planification d'équipes. Tu dois aider un manager à créer le planning optimal pour son équipe.

CONTEXTE DE L'ÉQUIPE "${team.name}" :
${employeeDetails}

PÉRIODE CONCERNÉE : ${weekInfo}

HISTORIQUE DE LA CONVERSATION :
${historyContext}

NOUVEAU MESSAGE DU MANAGER : "${message}"

INSTRUCTIONS :
1. Si c'est la première interaction, présente-toi et récapitule ce que tu comprends de l'équipe
2. Pose des questions pertinentes pour clarifier les besoins spécifiques
3. Identifie les contraintes manquantes ou ambiguës
4. Suggère des optimisations basées sur les préférences des employés
5. Quand tu as assez d'informations, propose de générer le planning

QUESTIONS À CONSIDÉRER :
- Horaires d'ouverture/fermeture du service ?
- Charge de travail attendue pour cette semaine ?
- Événements particuliers (congés, formations, réunions) ?
- Contraintes légales (repos hebdomadaire, temps de pause) ?
- Préférences managériales spécifiques ?
- Besoin de couverture minimum par créneau ?

RÉPONDS en français de manière conversationnelle et professionnelle. Sois précis et orienté solutions.

FORMAT DE RÉPONSE :
{
  "message": "Ta réponse conversationnelle ici",
  "questions": ["Question 1 ?", "Question 2 ?"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "needsMoreInfo": true/false,
  "readyToGenerate": true/false
}`;

      // 🌐 Appel à l'API OpenRouter pour la conversation
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        return res.status(500).json({
          success: false,
          message: "Clé API OpenRouter non configurée",
        });
      }

      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              {
                role: "system",
                content: "Tu es un expert en organisation RH. Génère un planning hebdomadaire clair et équilibré à partir de contraintes."
              },
              {
                role: "user",
                content: conversationPrompt,
              },
            ],
            temperature: 0.8,
          }),
        }
      );

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(`[AI Conversation] Erreur OpenRouter:`, errorText);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'appel à l'API OpenRouter",
        });
      }

      const openRouterData: OpenRouterResponse =
        await openRouterResponse.json();
      // Gérer les modèles qui mettent la réponse dans 'reasoning' (comme Hunyuan) ou 'content'
      const aiResponseContent = openRouterData.choices[0].message.content || 
                                openRouterData.choices[0].message.reasoning || 
                                'Erreur: Aucune réponse de l\'IA';

      // 📊 Parsing de la réponse conversationnelle
      let conversationResponse: ConversationResponse;

      try {
        const cleanedResponse = aiResponseContent
          .replace(/```json|```/g, "")
          .trim();

        const parsedResponse = JSON.parse(cleanedResponse);

        // Mettre à jour l'historique de conversation
        const updatedHistory = [
          ...conversationHistory,
          {
            role: "user" as const,
            content: message,
            timestamp: new Date(),
          },
          {
            role: "assistant" as const,
            content: parsedResponse.message,
            timestamp: new Date(),
          },
        ];

        conversationResponse = {
          message: parsedResponse.message,
          questions: parsedResponse.questions || [],
          suggestions: parsedResponse.suggestions || [],
          needsMoreInfo: parsedResponse.needsMoreInfo !== false,
          readyToGenerate: parsedResponse.readyToGenerate === true,
          conversationHistory: updatedHistory,
        };
      } catch (parseError) {
        console.error(`[AI Conversation] Erreur de parsing:`, parseError);

        // Fallback : réponse directe sans JSON
        const updatedHistory = [
          ...conversationHistory,
          {
            role: "user" as const,
            content: message,
            timestamp: new Date(),
          },
          {
            role: "assistant" as const,
            content: aiResponseContent,
            timestamp: new Date(),
          },
        ];

        conversationResponse = {
          message: aiResponseContent,
          questions: [],
          suggestions: [],
          needsMoreInfo: true,
          readyToGenerate: false,
          conversationHistory: updatedHistory,
        };
      }

      console.log(
        `[AI Conversation] Réponse générée pour l'équipe ${team.name}`
      );

      return res.status(200).json({
        success: true,
        data: conversationResponse,
        teamInfo: {
          name: team.name,
          employeeCount: employees.length,
          week: weekInfo,
        },
      });
    } catch (error) {
      console.error("[AI Conversation] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'interaction avec l'IA",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Fonction utilitaire pour calculer les dates de la semaine
function getWeekDateRange(weekNumber: number, year: number) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7;
  const mondayOfWeek = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  
  // Ajuster pour que Monday soit le premier jour de la semaine
  const dayOfWeek = mondayOfWeek.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  mondayOfWeek.setDate(mondayOfWeek.getDate() + mondayOffset);
  
  const sundayOfWeek = new Date(mondayOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  return {
    start: mondayOfWeek,
    end: sundayOfWeek
  };
}

/**
 * @route   POST /api/ai/schedule/generate-from-constraints
 * @desc    Générer un planning avec les contraintes du wizard
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.post(
  "/schedule/generate-from-constraints",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  validateRequest({ 
    body: planningConstraintsSchema,
    schemaName: 'planning.constraints' 
  }),
  async (req: AuthRequest, res: Response) => {
    console.log('🚀 [AI GENERATION] Début de la requête de génération');
    console.log('👤 [AI GENERATION] Utilisateur:', req.user ? req.user._id : 'NON DÉFINI');
    console.log('📊 [AI GENERATION] Body de la requête:', JSON.stringify(req.body, null, 2));
    
    try {
      console.log('✅ [AI GENERATION] Entrée dans le try-catch principal');
      
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        console.log('❌ [AI GENERATION] Utilisateur non authentifié');
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }
      
      console.log('✅ [AI GENERATION] Utilisateur authentifié:', req.user._id);

      const startTime = Date.now();
      const constraints: PlanningConstraints = req.body;

      console.log(
        `[AI Wizard] Génération de planning avec contraintes structurées pour l'équipe ${constraints.teamId}`
      );

      // 🔍 Récupération de l'équipe
      const team = await TeamModel.findById(constraints.teamId)
        .populate("employeeIds")
        .lean();

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès
      const userIsManager = team.managerIds.some(
        (managerId) => managerId.toString() === req.user._id.toString()
      );
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId?.toString();
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette équipe",
        });
      }

      const employees = team.employeeIds as unknown as IEmployee[];

      // 🧠 Construction du prompt structuré pour DeepSeek
      const weekDate = new Date(constraints.year, 0, 1 + (constraints.weekNumber - 1) * 7);
      const weekInfo = `Semaine ${constraints.weekNumber}/${constraints.year} (${weekDate.toLocaleDateString("fr-FR")})`;

      let employeeDetails = "";
      constraints.employees.forEach((emp) => {
        const employee = employees.find(e => (e as any)._id.toString() === emp.id);
        if (employee) {
          employeeDetails += `- ${emp.name} (${emp.email}):
  * Contrat: ${emp.weeklyHours || 35}h/semaine (OBLIGATION CONTRACTUELLE)
  * Jour de repos souhaité: ${emp.restDay || 'Flexible'} ${emp.restDay ? '(PRIORITÉ ABSOLUE)' : ''}
  * Créneaux préférés: ${emp.preferredHours?.length ? emp.preferredHours.join(', ') : 'Aucune préférence'}
  * Coupures autorisées: ${emp.allowSplitShifts ? 'Oui' : 'Non - service continu obligatoire'}
  * Exceptions: ${emp.exceptions?.length ? emp.exceptions.map(e => `${e.date} (${e.type}: ${e.reason})`).join(', ') : 'Aucune'}
`;
        }
      });

      const openingDaysDetails = constraints.companyConstraints.openingDays.map(day => {
        const dayFr = {
          monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
          thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
        }[day];
        const hours = constraints.companyConstraints.openingHours.find(h => h.day === day);
        return `${dayFr}: ${hours?.hours.join(', ') || 'Horaires standards'}`;
      }).join('\n');

      // Contraintes de rôles si elles existent
      let roleConstraintsDetails = "";
      if (constraints.companyConstraints.roleConstraints?.length) {
        roleConstraintsDetails = `\n🎭 CONTRAINTES DE RÔLES OBLIGATOIRES:
${constraints.companyConstraints.roleConstraints.map(rc => 
  `- Rôle "${rc.role}" REQUIS aux créneaux: ${rc.requiredAt.join(', ')}`
).join('\n')}
ATTENTION: Ces rôles doivent être présents aux créneaux spécifiés EN PLUS du personnel minimum.
`;
      }

      // Construire les horaires d'ouverture détaillés
      const detailedOpeningHours = constraints.companyConstraints.openingHours.map(dayHours => {
        const dayFr = {
          monday: 'LUNDI', tuesday: 'MARDI', wednesday: 'MERCREDI',
          thursday: 'JEUDI', friday: 'VENDREDI', saturday: 'SAMEDI', sunday: 'DIMANCHE'
        }[dayHours.day];
        return `- ${dayFr}: ${dayHours.hours.join(' et ')} (COUVERTURE OBLIGATOIRE INTEGRALE)`;
      }).join('\n');

      const prompt = `Tu es un expert en planification RH. Genere un planning hebdomadaire optimise et equilibre.

EQUIPE "${team.name}" - ${weekInfo}

EMPLOYES (${constraints.employees.length} personnes):
${employeeDetails}

CONTRAINTES ENTREPRISE OBLIGATOIRES:
Jours d'ouverture:
${openingDaysDetails}${roleConstraintsDetails}

HORAIRES D'OUVERTURE PRECIS PAR JOUR (OBLIGATION ABSOLUE):
${detailedOpeningHours}

ATTENTION CRITIQUE: Tu DOIS respecter EXACTEMENT ces horaires jour par jour. 
- PAS de 17h par defaut si fermeture a 20h !
- PAS de fermeture 12h-13h si creneau continu !
- UTILISE les creneaux EXACTS ci-dessus pour chaque jour !

PERSONNEL MINIMUM SIMULTANE: ${constraints.companyConstraints.minStaffSimultaneously || 2} employes presents EN PERMANENCE pendant les heures d'ouverture

LIMITES DE TRAVAIL QUOTIDIEN:
- Heures MINIMUM par jour: ${constraints.companyConstraints.minHoursPerDay || 4}h
- Heures MAXIMUM par jour: ${constraints.companyConstraints.maxHoursPerDay || 10}h

GESTION DES PAUSES DEJEUNER:
- Duree: ${constraints.companyConstraints.lunchBreakDuration || 60} minutes
- Obligatoire: ${constraints.companyConstraints.mandatoryLunchBreak ? 'OUI - pour tout creneau > 6h' : 'NON'}
- ROTATION OBLIGATOIRE: Les pauses dejeuner doivent etre echelonnees pour maintenir le personnel minimum

PREFERENCES IA:
- Favoriser les coupures: ${constraints.preferences.favorSplit ? 'Oui' : 'Non'}
- Uniformite des horaires: ${constraints.preferences.favorUniformity ? 'Oui' : 'Non'}
- Equilibrer la charge: ${constraints.preferences.balanceWorkload ? 'Oui' : 'Non'}
- Prioriser preferences employes: ${constraints.preferences.prioritizeEmployeePreferences ? 'Oui' : 'Non'}

OBJECTIFS CRITIQUES (RESPECT ABSOLU REQUIS):
1. MAINTENIR ${constraints.companyConstraints.minStaffSimultaneously || 2} employes presents EN PERMANENCE pendant TOUS les creneaux d'ouverture definis ci-dessus
2. RESPECTER EXACTEMENT les horaires specifies pour chaque jour (pas d'horaires par defaut !)
3. ECHELONNER les pauses dejeuner UNIQUEMENT quand il y a une coupure definie (ex: 08:00-12:00, 13:00-20:00)
4. COUVRIR INTEGRALEMENT chaque creneau d'ouverture defini (pas de trous dans la couverture)
5. RESPECTER STRICTEMENT les heures contractuelles de chaque employe (pas plus, pas moins)
6. APPLIQUER OBLIGATOIREMENT les jours de repos souhaites (priorite absolue)
7. RESPECTER les creneaux horaires preferes de chaque employe quand possible
8. RESPECTER les limites quotidiennes (${constraints.companyConstraints.minHoursPerDay || 4}h-${constraints.companyConstraints.maxHoursPerDay || 10}h par jour)
9. GERER toutes les exceptions individuelles (conges, formations, indisponibilites)
10. RESPECTER les preferences de coupures/services continus de chaque employe
11. EQUILIBRER la charge de travail entre les employes selon les preferences activees

REGLES TECHNIQUES STRICTES:
- Format horaire: "HH:MM-HH:MM" (ex: "08:00-12:00")
- Pauses dejeuner OBLIGATOIRES: ${constraints.companyConstraints.lunchBreakDuration || 60}min minimum entre creneaux matin/apres-midi
- Repos quotidien: 11h minimum entre deux services
- JAMAIS moins de ${constraints.companyConstraints.minStaffSimultaneously || 2} employes presents simultanement
- Etaler les pauses sur 12h-14h pour maintenir la continuite de service
- Jours de repos: Un employe avec restDay = "lundi" NE TRAVAILLE PAS le lundi ([] vide obligatoire)
- Heures contractuelles: Calculer precisement pour atteindre exactement les heures/semaine de chaque employe
- Creneaux preferes: Si un employe prefere "08:00-16:00", privilegier ces horaires quand possible
- Service continu: Si allowSplitShifts = false, donner UN SEUL creneau par jour (ex: "08:00-16:00")
- Exceptions: Si un employe a une exception "unavailable" le mercredi, mercredi = []

REPONSE OBLIGATOIRE: UNIQUEMENT LE JSON CI-DESSOUS (AUCUN TEXTE, AUCUNE EXPLICATION)

REPONDS UNIQUEMENT AVEC CE FORMAT JSON (pas de backticks, pas de texte explicatif):

EXEMPLE avec les creneaux definis ci-dessus:
{
  "lundi": { 
    "Alice Martin": ["08:00-12:00", "13:00-20:00"],
    "Jean Dupont": ["08:00-12:30", "13:30-18:00"],
    "Sophie Bernard": ["09:00-13:00", "14:00-20:00"]
  },
  "mardi": { 
    "Alice Martin": ["08:00-13:00", "14:00-19:00"],
    "Jean Dupont": ["09:30-12:00", "13:00-20:00"],
    "Sophie Bernard": []
  },
  "samedi": { "Alice Martin": ["08:00-12:00", "13:00-20:00"] },
  "dimanche": { "Alice Martin": ["08:00-12:00"] }
}

GENERE LE PLANNING OPTIMAL EN RESPECTANT TOUTES CES DIRECTIVES.

RAPPEL CRUCIAL: Ta reponse doit commencer directement par { et finir par }. Aucun autre texte n'est autorise.`;

      // 🌐 Appel à l'API OpenRouter avec DeepSeek
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        return res.status(500).json({
          success: false,
          message: "Configuration API manquante",
        });
      }

      const openRouterResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [
              {
                role: "system",
                content: "Tu es un expert en organisation RH. Tu DOIS respecter ABSOLUMENT ces règles critiques: 1) UTILISER EXACTEMENT les horaires d'ouverture spécifiés pour chaque jour (pas d'horaires par défaut !), 2) Maintenir le personnel minimum en permanence pendant les heures d'ouverture, 3) Échelonner les pauses déjeuner pour éviter que tous soient absents, 4) Couvrir INTÉGRALEMENT les horaires d'ouverture, 5) RESPECTER les jours de repos obligatoires (restDay), 6) RESPECTER les préférences horaires individuelles, 7) GÉRER les exceptions d'indisponibilité, 8) RESPECTER les heures contractuelles de chaque employé. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, PAS de markdown, PAS de texte explicatif."
              },
              {
                role: "user",
                content: prompt,
              },
              {
                role: "assistant",
                content: "Je vais répondre uniquement avec le JSON demandé, sans aucun autre texte:"
              },
              {
                role: "user",
                content: "RAPPEL FINAL CRITIQUE: 1) UTILISE EXACTEMENT les horaires définis pour chaque jour ci-dessus (PAS de valeurs par défaut !), 2) MAINTIENS ${constraints.companyConstraints.minStaffSimultaneously || 2} employés minimum en permanence, 3) ÉCHELONNE les pauses uniquement si coupure définie, 4) Réponds UNIQUEMENT avec l'objet JSON pur (pas de ```json, pas de texte)."
              },
            ],
            temperature: 0.05,
            max_tokens: 3000,
          }),
        }
      );

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(`[AI Wizard] Erreur OpenRouter:`, errorText);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de l'appel à l'API OpenRouter",
          error: errorText,
        });
      }

      const openRouterData: OpenRouterResponse = await openRouterResponse.json();
      // Gérer les modèles qui mettent la réponse dans 'reasoning' (comme Hunyuan) ou 'content'
      const aiResponseContent = openRouterData.choices[0].message.content || 
                                openRouterData.choices[0].message.reasoning || 
                                'Erreur: Aucune réponse de l\'IA';

      // 📊 Parse et validation de la réponse
      let generatedScheduleData: GeneratedScheduleData;

      try {
        let cleanedResponse = aiResponseContent.trim();
        
        // Nettoyer les marqueurs de code
        cleanedResponse = cleanedResponse.replace(/```json|```/g, "").trim();
        
        // Si la réponse ne commence pas par { ou [, essayer d'extraire le JSON
        if (!cleanedResponse.startsWith('{') && !cleanedResponse.startsWith('[')) {
          console.log('🔧 [AI GENERATION] Réponse non-JSON détectée, tentative d\'extraction');
          
          // Chercher des blocs JSON dans la réponse
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            cleanedResponse = jsonMatch[0].trim();
            console.log('🎯 [AI GENERATION] JSON extrait:', cleanedResponse.substring(0, 200) + '...');
          } else {
            // Fallback: Générer un planning basique automatiquement pour TOUS les employés
            console.log('🔄 [AI GENERATION] Génération automatique de planning fallback');
            generatedScheduleData = {
              lundi: {},
              mardi: {},
              mercredi: {},
              jeudi: {},
              vendredi: {},
              samedi: {},
              dimanche: {}
            };
            
            // Générer des horaires par défaut selon les horaires d'ouverture ou des valeurs par défaut
            const defaultHours = constraints.companyConstraints.openingHours && constraints.companyConstraints.openingHours.length > 0 
              ? constraints.companyConstraints.openingHours
              : [
                  { day: 'monday', hours: ['08:00-12:00', '13:00-17:00'] },
                  { day: 'tuesday', hours: ['08:00-12:00', '13:00-17:00'] },
                  { day: 'wednesday', hours: ['08:00-12:00', '13:00-17:00'] },
                  { day: 'thursday', hours: ['08:00-12:00', '13:00-17:00'] },
                  { day: 'friday', hours: ['08:00-12:00', '13:00-17:00'] }
                ];
            
            // Distribuer équitablement les employés
            const workingDays = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];
            constraints.employees.forEach((emp, index) => {
              workingDays.forEach((day, dayIndex) => {
                // Vérifier les absences exceptionnelles
                const dayEn = {
                  lundi: 'monday',
                  mardi: 'tuesday', 
                  mercredi: 'wednesday',
                  jeudi: 'thursday',
                  vendredi: 'friday'
                }[day];
                
                const dayHours = defaultHours.find(h => h.day === dayEn);
                
                // Vérifier les absences exceptionnelles pour ce jour
                const weekRange = getWeekDateRange(constraints.weekNumber, constraints.year);
                const dayDate = new Date(weekRange.start);
                dayDate.setDate(dayDate.getDate() + dayIndex);
                const dayDateString = dayDate.toISOString().split('T')[0];
                
                // Vérifier les absences exceptionnelles pour ce jour (support multi-absences)
                const hasUnavailableException = emp.exceptions && emp.exceptions.some(exc => 
                  exc.date === dayDateString && 
                  (exc.type === 'unavailable' || exc.type === 'sick' || exc.type === 'vacation')
                );
                
                const hasReducedHours = emp.exceptions && emp.exceptions.some(exc => 
                  exc.date === dayDateString && exc.type === 'reduced'
                );
                
                // Alterner les jours de repos pour équilibrer
                const isRestDay = (index + dayIndex) % 5 === 4; // 1 jour de repos par semaine par employé
                
                if (!isRestDay && !hasUnavailableException && dayHours && dayHours.hours.length > 0) {
                  if (hasReducedHours) {
                    // Horaires réduits : prendre seulement le matin
                    const morningHours = dayHours.hours.filter(h => h.startsWith('08:') || h.startsWith('09:'));
                    generatedScheduleData[day][emp.name] = morningHours.length > 0 ? morningHours : ['08:00-12:00'];
                    console.log(`🔄 [AI GENERATION] Horaires réduits pour ${emp.name} le ${day}: ${JSON.stringify(generatedScheduleData[day][emp.name])}`);
                  } else {
                    generatedScheduleData[day][emp.name] = dayHours.hours;
                  }
                } else {
                  generatedScheduleData[day][emp.name] = [];
                  if (hasUnavailableException) {
                    console.log(`❌ [AI GENERATION] Absence pour ${emp.name} le ${day}: ${dayDateString}`);
                  }
                }
              });
              
              // Weekends vides par défaut
              generatedScheduleData.samedi[emp.name] = [];
              generatedScheduleData.dimanche[emp.name] = [];
            });
            
            console.log('✅ [AI GENERATION] Planning fallback généré pour tous les employés:', Object.keys(generatedScheduleData.lundi || {}));
          }
        } else {
          generatedScheduleData = JSON.parse(cleanedResponse);
          console.log('✅ [AI GENERATION] JSON parsé avec succès');
        }
      } catch (parseError) {
        console.error(`💥 [AI GENERATION] Erreur parsing:`, parseError);
        console.error(`📝 [AI GENERATION] Réponse brute (premiers 500 chars):`, aiResponseContent.substring(0, 500));
        return res.status(500).json({
          success: false,
          message: "Impossible de parser la réponse de l'IA",
          error: (parseError as Error).message,
          aiResponse: aiResponseContent.substring(0, 1000), // Limiter pour éviter les gros logs
        });
      }

      // 🔍 VALIDATION COMPLÈTE DU PLANNING GÉNÉRÉ
      const validationErrors: string[] = [];
      const dayMapping = {
        lundi: 'monday', mardi: 'tuesday', mercredi: 'wednesday',
        jeudi: 'thursday', vendredi: 'friday', samedi: 'saturday', dimanche: 'sunday'
      };

      // Validation 1: Vérifier les jours de repos obligatoires
      constraints.employees.forEach((emp) => {
        if (emp.restDay) {
          const dayFr = Object.keys(dayMapping).find(key => dayMapping[key] === emp.restDay);
          if (dayFr && generatedScheduleData[dayFr] && generatedScheduleData[dayFr][emp.name] && 
              generatedScheduleData[dayFr][emp.name].length > 0) {
            validationErrors.push(`❌ ${emp.name} doit avoir repos le ${dayFr} mais a des créneaux: ${generatedScheduleData[dayFr][emp.name]}`);
          }
        }
      });

      // Validation 2: Vérifier les exceptions d'indisponibilité
      constraints.employees.forEach((emp) => {
        if (emp.exceptions?.length) {
          emp.exceptions.forEach((exception) => {
            if (exception.type === 'unavailable' || exception.type === 'sick' || exception.type === 'vacation') {
              const weekRange = getWeekDateRange(constraints.weekNumber, constraints.year);
              const exceptionDate = new Date(exception.date);
              
              // Vérifier si l'exception tombe dans la semaine planifiée
              if (exceptionDate >= weekRange.start && exceptionDate <= weekRange.end) {
                const dayOfWeek = exceptionDate.getDay();
                const dayName = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][dayOfWeek];
                
                if (generatedScheduleData[dayName] && generatedScheduleData[dayName][emp.name] && 
                    generatedScheduleData[dayName][emp.name].length > 0) {
                  validationErrors.push(`❌ ${emp.name} indisponible le ${dayName} (${exception.reason}) mais a des créneaux: ${generatedScheduleData[dayName][emp.name]}`);
                }
              }
            }
          });
        }
      });

      // Validation 3: Vérifier la couverture minimale
      const workingDays = constraints.companyConstraints.openingDays.filter(day => 
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(day)
      );
      
      workingDays.forEach((dayEn) => {
        const dayFr = Object.keys(dayMapping).find(key => dayMapping[key] === dayEn);
        if (dayFr && generatedScheduleData[dayFr]) {
          const workingEmployees = Object.values(generatedScheduleData[dayFr]).filter(slots => 
            Array.isArray(slots) && slots.length > 0
          ).length;
          
          const minStaff = constraints.companyConstraints.minStaffSimultaneously || 2;
          if (workingEmployees < minStaff) {
            validationErrors.push(`❌ ${dayFr}: seulement ${workingEmployees} employé(s) mais ${minStaff} minimum requis`);
          }
        }
      });

      // Validation 4: Vérifier les heures contractuelles (tolérance ±10%)
      constraints.employees.forEach((emp) => {
        const contractualHours = emp.weeklyHours || 35;
        let totalHours = 0;
        
        Object.keys(generatedScheduleData).forEach((day) => {
          if (generatedScheduleData[day][emp.name]) {
            const slots = generatedScheduleData[day][emp.name];
            if (Array.isArray(slots)) {
              slots.forEach((slot: string) => {
                const [start, end] = slot.split('-');
                if (start && end) {
                  const startTime = new Date(`2000-01-01T${start}:00`);
                  const endTime = new Date(`2000-01-01T${end}:00`);
                  totalHours += (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                }
              });
            }
          }
        });
        
        const tolerance = contractualHours * 0.1; // 10% de tolérance
        if (Math.abs(totalHours - contractualHours) > tolerance) {
          validationErrors.push(`⚠️ ${emp.name}: ${totalHours.toFixed(1)}h planifiées vs ${contractualHours}h contractuelles (tolérance: ±${tolerance.toFixed(1)}h)`);
        }
      });

      // Si des erreurs critiques sont détectées, loguer mais continuer
      if (validationErrors.length > 0) {
        console.warn('⚠️ [AI VALIDATION] Contraintes non respectées:');
        validationErrors.forEach(error => console.warn(error));
        
        // Ajouter les erreurs comme contraintes non respectées dans la réponse
        // mais ne pas bloquer la création du planning (l'utilisateur peut corriger)
      }

      // 💾 Sauvegarde des plannings générés
      const savedSchedules: IGeneratedSchedule[] = [];
      
      console.log('🔍 [AI GENERATION] Données générées pour analyse:');
      console.log('📊 [AI GENERATION] Planning brut:', JSON.stringify(generatedScheduleData, null, 2));
      console.log('👥 [AI GENERATION] Employés à traiter:', employees.map(e => `${e.firstName} ${e.lastName}`));
      console.log('🏷️ [AI GENERATION] Contraintes employés:', constraints.employees.map(e => `${e.name} (ID: ${e.id})`));

      for (const employee of employees) {
        const employeeFullName = `${employee.firstName} ${employee.lastName}`;
        const employeeScheduleData: { [day: string]: { slots?: string[] } } = {};

        const daysOfWeek = [
          "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche",
        ];

        for (const day of daysOfWeek) {
          let employeeSlots: string[] = [];
          
          // Essayer plusieurs variantes du nom pour la correspondance
          if (generatedScheduleData[day]) {
            const dayData = generatedScheduleData[day];
            
            // 1. Correspondance exacte
            if (dayData[employeeFullName] && dayData[employeeFullName].length > 0) {
              employeeSlots = dayData[employeeFullName];
            }
            // 2. Correspondance avec le nom des contraintes (cas du fallback)
            else {
              const constraintEmployee = constraints.employees.find(emp => 
                emp.id === ((employee as any)._id || employee.userId)?.toString()
              );
              if (constraintEmployee && dayData[constraintEmployee.name] && dayData[constraintEmployee.name].length > 0) {
                employeeSlots = dayData[constraintEmployee.name];
              }
              // 3. Correspondance partielle (prénom seul, nom seul)
              else {
                const keys = Object.keys(dayData);
                const matchingKey = keys.find(key => 
                  key.includes(employee.firstName) || 
                  key.includes(employee.lastName) ||
                  employee.firstName.includes(key) ||
                  employee.lastName.includes(key)
                );
                if (matchingKey && dayData[matchingKey] && dayData[matchingKey].length > 0) {
                  employeeSlots = dayData[matchingKey];
                }
              }
            }
          }
          
          if (employeeSlots.length > 0) {
            employeeScheduleData[day] = {
              slots: employeeSlots,
            };
          } else {
            employeeScheduleData[day] = {};
          }
        }

        const generatedSchedule = new GeneratedScheduleModel({
          employeeId: (employee as any)._id || employee.userId,
          scheduleData: new Map(Object.entries(employeeScheduleData)),
          generatedBy: req.user._id,
          timestamp: new Date(),
          status: "draft",
          weekNumber: constraints.weekNumber,
          year: constraints.year,
          metadata: {
            wizardGeneration: true,
            constraints: constraints,
          },
        });

        const savedSchedule = await generatedSchedule.save();
        savedSchedules.push(savedSchedule);
        
        // Log du planning sauvegardé pour cet employé
        const totalSlots = Object.values(employeeScheduleData).reduce((total, day) => total + (day.slots?.length || 0), 0);
        console.log(`✅ [AI GENERATION] Planning sauvegardé pour ${employeeFullName}: ${totalSlots} créneaux au total`);
        if (totalSlots === 0) {
          console.log(`⚠️ [AI GENERATION] ATTENTION: Aucun créneau pour ${employeeFullName}!`);
        }
      }

      const processingTime = Date.now() - startTime;

      console.log(
        `[AI Wizard] Planning généré avec succès en ${processingTime}ms pour ${employees.length} employés`
      );

      return res.status(201).json({
        success: true,
        message: `Planning généré avec succès pour ${employees.length} employés de l'équipe ${team.name}`,
        schedule: savedSchedules.map((schedule) => ({
          employeeId: schedule.employeeId,
          employeeName: employees.find(e => (e as any)._id.toString() === schedule.employeeId.toString())?.firstName + ' ' + employees.find(e => (e as any)._id.toString() === schedule.employeeId.toString())?.lastName,
          day: 'mixed',
          slots: [],
          totalHours: 0
        })),
        processingTime,
        data: {
          teamId: team._id,
          teamName: team.name,
          weekNumber: constraints.weekNumber,
          year: constraints.year,
          employeesCount: employees.length,
          generatedSchedules: savedSchedules.map((schedule) => ({
            id: (schedule as any)._id,
            employeeId: schedule.employeeId,
            status: schedule.status,
            timestamp: schedule.timestamp,
          })),
          rawScheduleData: generatedScheduleData,
          validationWarnings: validationErrors.length > 0 ? validationErrors : undefined,
        },
      });
    } catch (error) {
      console.error("💥 [AI GENERATION] ERREUR FATALE:");
      console.error("📍 [AI GENERATION] Type d'erreur:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("📝 [AI GENERATION] Message:", error instanceof Error ? error.message : String(error));
      console.error("🔍 [AI GENERATION] Stack trace:", error instanceof Error ? error.stack : 'Pas de stack disponible');
      console.error("📊 [AI GENERATION] Détails complets:", error);
      
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la génération du planning",
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      });
    }
  }
);

/**
 * @route   DELETE /api/ai/generated-schedules/bulk
 * @desc    Supprimer plusieurs plannings IA sélectionnés (ou tous)
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.delete(
  "/generated-schedules/bulk",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { scheduleIds, deleteAll } = req.body;

      console.log(
        `[AI] Suppression demandée par ${req.user._id} (${req.user.role}) - deleteAll: ${deleteAll}, IDs: ${scheduleIds?.length || 0}`
      );

      // ✅ Validation des paramètres
      if (!deleteAll && (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Liste des IDs de plannings à supprimer requise ou flag deleteAll manquant",
        });
      }

      // 🔍 Construction de la requête selon le rôle et les permissions
      let baseQuery: any = { status: "draft" };

      if (req.user.role === "manager") {
        // Manager : seulement les plannings des équipes qu'il gère
        const managedTeams = await TeamModel.find({
          managerIds: req.user._id,
        }).select("_id");

        const teamIds = managedTeams.map((team) => team._id);

        if (teamIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: { deletedCount: 0 },
            message: "Aucune équipe gérée trouvée",
          });
        }

        // Récupérer les employés de ces équipes
        const teamsWithEmployees = await TeamModel.find({
          _id: { $in: teamIds },
        }).select("employeeIds");

        const employeeIds: any[] = [];
        teamsWithEmployees.forEach((team) => {
          if (team.employeeIds && team.employeeIds.length > 0) {
            employeeIds.push(...team.employeeIds);
          }
        });

        baseQuery.employeeId = { $in: employeeIds };
      } else if (req.user.role === "directeur") {
        // Directeur : seulement les plannings des équipes de sa société
        const companyTeams = await TeamModel.find({
          companyId: req.user.companyId,
        }).select("employeeIds");

        const employeeIds: any[] = [];
        companyTeams.forEach((team) => {
          if (team.employeeIds && team.employeeIds.length > 0) {
            employeeIds.push(...team.employeeIds);
          }
        });

        if (employeeIds.length === 0) {
          return res.status(200).json({
            success: true,
            data: { deletedCount: 0 },
            message: "Aucun employé trouvé dans votre société",
          });
        }

        baseQuery.employeeId = { $in: employeeIds };
      }
      // Admin : pas de filtre supplémentaire

      // 📊 Construction de la requête finale
      let deleteQuery = { ...baseQuery };

      if (!deleteAll && scheduleIds) {
        // Supprimer seulement les IDs spécifiés
        deleteQuery._id = { $in: scheduleIds.filter(id => mongoose.Types.ObjectId.isValid(id)) };
      }

      console.log(`[AI] Requête de suppression:`, JSON.stringify(deleteQuery, null, 2));

      // 🗑️ Suppression des plannings
      const deleteResult = await GeneratedScheduleModel.deleteMany(deleteQuery);

      console.log(`[AI] ${deleteResult.deletedCount} plannings supprimés`);

      return res.status(200).json({
        success: true,
        data: {
          deletedCount: deleteResult.deletedCount,
          deletedIds: deleteAll ? "tous" : scheduleIds,
        },
        message: `${deleteResult.deletedCount} planning(s) supprimé(s) avec succès`,
      });
    } catch (error) {
      console.error("[AI] Erreur lors de la suppression des plannings:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression des plannings",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
