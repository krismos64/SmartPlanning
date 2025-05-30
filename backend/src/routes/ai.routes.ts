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
import { IEmployee } from "../models/Employee.model";
import {
  GeneratedScheduleModel,
  IGeneratedSchedule,
} from "../models/GeneratedSchedule.model";
import { TeamModel } from "../models/Team.model";
import WeeklyScheduleModel from "../models/WeeklySchedule.model";

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
            model: "mistralai/devstral-small:free",
            messages: [
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

      const aiResponseContent = openRouterData.choices[0].message.content;
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
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      console.log(
        `[AI] Récupération des plannings générés par ${req.user._id} (${req.user.role})`
      );

      // 🔍 Construction de la requête selon le rôle
      let query: any = { status: "draft" };

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
        }).populate("employeeIds");

        const employeeIds: any[] = [];
        teamsWithEmployees.forEach((team) => {
          if (team.employeeIds) {
            employeeIds.push(...team.employeeIds);
          }
        });

        query.employeeId = { $in: employeeIds.map((emp) => emp._id || emp) };
      } else if (req.user.role === "directeur") {
        // Directeur : seulement les plannings des équipes de sa société
        const companyTeams = await TeamModel.find({
          companyId: req.user.companyId,
        }).populate("employeeIds");

        const employeeIds: any[] = [];
        companyTeams.forEach((team) => {
          if (team.employeeIds) {
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

        query.employeeId = { $in: employeeIds.map((emp) => emp._id || emp) };
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
        })
        .sort({ timestamp: -1 });

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

          return {
            _id: schedule._id.toString(),
            employeeId: schedule.employeeId,
            scheduleData: frontendScheduleData,
            status: schedule.status,
            timestamp: schedule.timestamp,
            generatedBy: schedule.generatedBy,
            employee: schedule.employeeId,
            teamId: team?._id,
            teamName: team?.name || "Équipe non trouvée",
            constraints: [],
            notes: "",
            weekNumber: schedule.weekNumber || 1,
            year: schedule.year || new Date().getFullYear(),
          };
        })
      );

      console.log(`[AI] ${enrichedSchedules.length} plannings trouvés`);

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
            model: "mistralai/devstral-small:free",
            messages: [
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
      const aiResponseContent = openRouterData.choices[0].message.content;

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

/**
 * @route   POST /api/ai/generate-with-context
 * @desc    Générer un planning avec le contexte enrichi de la conversation
 * @access  Private - Manager, Directeur, Admin uniquement
 */
router.post(
  "/generate-with-context",
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
        constraints,
        notes,
        conversationSummary,
        additionalRequirements,
      } = req.body;

      console.log(
        `[AI Enhanced] Génération de planning avec contexte enrichi pour l'équipe ${teamId}`
      );
      console.log(
        `[AI Enhanced] Conversation summary length: ${
          conversationSummary?.length || 0
        }`
      );
      console.log(
        `[AI Enhanced] Additional requirements: ${
          additionalRequirements || "None"
        }`
      );

      // ✅ Validation des champs obligatoires
      if (!teamId || !year || !weekNumber || !constraints) {
        return res.status(400).json({
          success: false,
          message: "Champs obligatoires manquants",
        });
      }

      // 🔍 Récupération de l'équipe
      const team = await TeamModel.findById(teamId)
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
          message: "Accès non autorisé",
        });
      }

      const employees = team.employeeIds as unknown as IEmployee[];

      // 🧠 Construction du prompt enrichi avec le contexte conversationnel
      let employeeDetails = "";
      let totalContractHours = 0;

      employees.forEach((employee: IEmployee) => {
        const preferredDays =
          employee.preferences?.preferredDays?.join(", ") || "Flexible";
        const preferredHours =
          employee.preferences?.preferredHours?.join(", ") || "Flexible";
        const contractHours = employee.contractHoursPerWeek || 0;
        totalContractHours += contractHours;

        const anciennete = employee.startDate
          ? `${
              new Date().getFullYear() -
              new Date(employee.startDate).getFullYear()
            } ans`
          : "Nouvelle embauche";

        employeeDetails += `- ${employee.firstName} ${employee.lastName}:
  * Contrat: ${contractHours}h/semaine
  * Jours préférés: ${preferredDays}
  * Horaires préférés: ${preferredHours}
  * Ancienneté: ${anciennete}
  * Statut: ${employee.status}
`;
      });

      const weekDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
      const weekInfo = `Semaine ${weekNumber}/${year} (${weekDate.toLocaleDateString(
        "fr-FR"
      )})`;

      const enhancedPrompt = `🤖 ASSISTANT PLANIFICATION RH - GÉNÉRATION FINALE

📋 MISSION: Créer le planning optimal pour l'équipe "${team.name}"
📅 PÉRIODE: ${weekInfo}

👥 ÉQUIPE (${employees.length} employés - ${totalContractHours}h total/semaine):
${employeeDetails}

⚠️ CONTRAINTES OBLIGATOIRES:
${constraints.map((c: string) => `- ${c}`).join("\n")}

${
  conversationSummary
    ? `💬 CONTEXTE CONVERSATIONNEL PRIORITAIRE:
${conversationSummary}

🎯 INSTRUCTION CRITIQUE: Vous DEVEZ analyser et respecter SCRUPULEUSEMENT toutes les consignes et préférences mentionnées dans cette conversation. Ces informations sont PRIORITAIRES et doivent être appliquées dans le planning généré.

`
    : ""
}

${
  additionalRequirements
    ? `🔥 EXIGENCES SPÉCIALES À RESPECTER ABSOLUMENT:
${additionalRequirements}

`
    : ""
}

${notes ? `📝 NOTES COMPLÉMENTAIRES:\n${notes}\n\n` : ""}

🔧 RÈGLES DE PLANIFICATION STRICTES:
1. ✅ RESPECTER les heures contractuelles exactes
2. ✅ APPLIQUER TOUTES les consignes de la conversation
3. ✅ PRIORISER les préférences employés mentionnées
4. ✅ ASSURER repos hebdomadaire minimum 35h consécutives
5. ✅ LIMITER journées à 10h maximum
6. ✅ GARANTIR repos quotidien 11h entre services
7. ✅ PRÉVOIR pauses déjeuner 1h minimum
8. ✅ ÉQUILIBRER charge travail dans l'équipe

💡 MÉTHODOLOGIE DE PLANIFICATION:
1. Analyser d'abord TOUS les éléments de conversation
2. Identifier les contraintes spécifiques mentionnées
3. Appliquer ces contraintes en priorité
4. Optimiser le planning selon les règles standards
5. Vérifier que toutes les consignes sont respectées

⚡ EXEMPLE D'APPLICATION:
- Si conversation mentionne "Jean ne peut pas travailler le mardi" → Jean ne doit PAS être planifié le mardi
- Si conversation dit "besoin de plus de personnel le vendredi" → prioriser plus d'employés le vendredi
- Si conversation précise "éviter les horaires de nuit pour Marie" → Marie ne doit pas avoir d'horaires tardifs

⚡ FORMAT JSON OBLIGATOIRE (AUCUN TEXTE AVANT/APRÈS):
{
  "lundi": { "Prénom Nom": ["HH:MM-HH:MM", "HH:MM-HH:MM"] },
  "mardi": { "Prénom Nom": ["HH:MM-HH:MM"] },
  "mercredi": { "Prénom Nom": [] },
  "jeudi": { "Prénom Nom": ["HH:MM-HH:MM"] },
  "vendredi": { "Prénom Nom": ["HH:MM-HH:MM"] },
  "samedi": {},
  "dimanche": {}
}

🎯 RAPPEL CRITIQUE: Le planning généré doit IMPÉRATIVEMENT refléter et respecter TOUTES les consignes données dans la conversation. C'est votre PRIORITÉ ABSOLUE!

🚀 GÉNÉRER LE PLANNING MAINTENANT!`;

      // 🌐 Appel à l'API OpenRouter avec prompt enrichi
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
            model: "mistralai/devstral-small:free",
            messages: [
              {
                role: "system",
                content:
                  "Tu es un expert en planification RH. Tu dois absolument respecter et appliquer toutes les consignes données dans la conversation avec le manager. C'est ta priorité numéro 1. Analyse soigneusement chaque instruction et applique-la dans le planning généré.",
              },
              {
                role: "user",
                content: enhancedPrompt,
              },
            ],
            temperature: 0.3, // Plus bas pour plus de précision et cohérence
            max_tokens: 2000,
            top_p: 0.9,
          }),
        }
      );

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(`[AI Enhanced] Erreur OpenRouter:`, errorText);
        return res.status(500).json({
          success: false,
          message: "Erreur API de génération",
        });
      }

      const openRouterData: OpenRouterResponse =
        await openRouterResponse.json();
      const aiResponseContent = openRouterData.choices[0].message.content;

      // 📊 Parse et validation de la réponse
      let generatedScheduleData: GeneratedScheduleData;

      try {
        const cleanedResponse = aiResponseContent
          .replace(/```json|```/g, "")
          .trim();
        generatedScheduleData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error(`[AI Enhanced] Erreur parsing:`, parseError);
        return res.status(500).json({
          success: false,
          message: "Réponse IA invalide",
          aiResponse: aiResponseContent,
        });
      }

      // 💾 Sauvegarde avec métadonnées enrichies
      const savedSchedules: IGeneratedSchedule[] = [];

      for (const employee of employees) {
        const employeeFullName = `${employee.firstName} ${employee.lastName}`;
        const employeeScheduleData: { [day: string]: { slots?: string[] } } =
          {};

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
            employeeScheduleData[day] = {
              slots: generatedScheduleData[day][employeeFullName],
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
          weekNumber: weekNumber,
          year: year,
          metadata: {
            conversationSummary,
            additionalRequirements,
            enhancedGeneration: true,
          },
        });

        const savedSchedule = await generatedSchedule.save();
        savedSchedules.push(savedSchedule);
      }

      console.log(
        `[AI Enhanced] Planning enrichi généré pour ${employees.length} employés`
      );

      return res.status(201).json({
        success: true,
        message: `Planning enrichi généré avec succès`,
        data: {
          teamId: team._id,
          teamName: team.name,
          weekNumber,
          year,
          employeesCount: employees.length,
          totalContractHours,
          generatedSchedules: savedSchedules.map((schedule) => ({
            id: (schedule as any)._id,
            employeeId: schedule.employeeId,
            status: schedule.status,
            timestamp: schedule.timestamp,
          })),
          rawScheduleData: generatedScheduleData,
          enhanced: true,
        },
      });
    } catch (error) {
      console.error("[AI Enhanced] Erreur:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router;
