/**
 * Routes pour la génération automatique de plannings via IA
 *
 * Ce fichier contient les routes permettant :
 * - de générer automatiquement un planning pour une équipe via l'API OpenRouter
 * - de traiter les préférences des employés et les contraintes métiers
 * - de sauvegarder les plannings générés en base de données
 *
 * MIGRATION POSTGRESQL: Fichier migré de MongoDB vers PostgreSQL/Prisma
 * - Tous les ObjectId → number (INTEGER)
 * - Toutes les requêtes Mongoose → Prisma
 * - Structure WeeklySchedule alignée sur le schéma Prisma (team-based)
 */

import { addDays, startOfWeek } from "date-fns";
import dotenv from "dotenv";
import express, { Response } from "express";
// MIGRATION POSTGRESQL: Remplacement de mongoose par prisma
import prisma from "../config/prisma";
import authenticateToken, { AuthRequest } from "../middlewares/auth.middleware";
import checkRole from "../middlewares/checkRole.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { planningConstraintsSchema, PlanningConstraints } from "../schemas/planning.schemas";

// Charger les variables d'environnement
dotenv.config();

const router = express.Router();

/**
 * Interface pour le body de la requête de génération de planning
 * MIGRATION POSTGRESQL: teamId est maintenant number au lieu de string
 */
interface GenerateScheduleRequest {
  teamId: number; // INTEGER
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
 * MIGRATION POSTGRESQL: teamId est maintenant number
 */
interface ConversationRequest {
  teamId: number; // INTEGER
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
 *
 * MIGRATION POSTGRESQL:
 * - teamId validation convertie en parseInt
 * - Requêtes Prisma pour Team et Employee
 * - Sauvegarde dans GeneratedSchedule avec nouvelle structure
 */
router.post(
  "/generate-schedule",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      // MIGRATION POSTGRESQL: req.user.id est number
      if (!req.user || !req.user.id) {
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
        `[AI] Génération de planning demandée par ${req.user.id} pour l'équipe ${teamId}`
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

      // MIGRATION POSTGRESQL: Validation teamId (number)
      const parsedTeamId = parseInt(String(teamId), 10);
      if (isNaN(parsedTeamId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide (doit être un nombre)",
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

      // MIGRATION POSTGRESQL: Récupération de l'équipe avec Prisma
      const team = await prisma.team.findUnique({
        where: { id: parsedTeamId },
        include: {
          employees: {
            where: { isActive: true },
            select: {
              id: true,
              userId: true,
              position: true,
              skills: true,
              contractualHours: true,
              preferences: true,
              hireDate: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès à l'équipe
      // MIGRATION POSTGRESQL: managerId est unique (not array) dans Prisma
      const userIsManager = team.managerId === req.user.id;
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId;
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à générer un planning pour cette équipe",
        });
      }

      // 👥 Récupération des détails des employés
      const employees = team.employees;

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
      employees.forEach((employee) => {
        // MIGRATION POSTGRESQL: preferences est maintenant un objet JSON
        const prefs = employee.preferences as any;
        const preferredDays = prefs?.preferredDays?.join(", ") || "Aucune préférence spécifiée";
        const preferredHours = prefs?.preferredHours?.join(", ") || "Aucune préférence spécifiée";
        const contractHours = employee.contractualHours || 35;
        const anciennete = employee.hireDate
          ? `${
              new Date().getFullYear() -
              new Date(employee.hireDate).getFullYear()
            } ans`
          : "Non spécifiée";

        employeeDetails += `- ${employee.user.firstName} ${employee.user.lastName}:
  * Contrat: ${contractHours}h/semaine (soit ${Math.round(contractHours / 5)}h/jour en moyenne)
  * Jours préférés: ${preferredDays}
  * Horaires préférés: ${preferredHours}
  * Ancienneté: ${anciennete}
  * Statut: ${employee.isActive ? 'Actif' : 'Inactif'}
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

      // MIGRATION POSTGRESQL: Nouvelle structure de sauvegarde (team-based)
      console.log(`[AI] Sauvegarde du planning généré...`);

      // Calculer les dates de la semaine (ISO 8601)
      function getWeekDates(year: number, weekNumber: number) {
        const january4th = new Date(year, 0, 4);
        const dayOfWeek = january4th.getDay() || 7;
        const weekStart = new Date(january4th);
        weekStart.setDate(january4th.getDate() - dayOfWeek + 1);
        weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { weekStartDate: weekStart, weekEndDate: weekEnd };
      }

      const { weekStartDate, weekEndDate } = getWeekDates(year, weekNumber);

      // Convertir le planning généré (par employé) en format JSON team
      const scheduleJson: Record<string, any[]> = {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      };

      const dayMapping: Record<string, string> = {
        lundi: "monday",
        mardi: "tuesday",
        mercredi: "wednesday",
        jeudi: "thursday",
        vendredi: "friday",
        samedi: "saturday",
        dimanche: "sunday",
      };

      // Parcourir le planning généré et regrouper par jour
      for (const [dayFr, employeeSchedules] of Object.entries(generatedScheduleData)) {
        const dayEn = dayMapping[dayFr] || dayFr;

        if (!scheduleJson[dayEn]) {
          scheduleJson[dayEn] = [];
        }

        for (const [employeeName, slots] of Object.entries(employeeSchedules)) {
          // Trouver l'employé correspondant
          const employee = employees.find(emp =>
            `${emp.user.firstName} ${emp.user.lastName}` === employeeName
          );

          if (employee && Array.isArray(slots) && slots.length > 0) {
            slots.forEach((slot: string) => {
              const [startTime, endTime] = slot.split("-");
              if (startTime && endTime) {
                scheduleJson[dayEn].push({
                  employeeId: employee.id,
                  startTime,
                  endTime,
                  position: employee.position || null,
                  skills: employee.skills || [],
                  breakStart: null,
                  breakEnd: null
                });
              }
            });
          }
        }
      }

      // MIGRATION POSTGRESQL: Sauvegarder dans GeneratedSchedule (nouvelle structure)
      const generationConfig = {
        strategy: "ai_openrouter",
        weekStartDate: weekStartDate.toISOString(),
        weekEndDate: weekEndDate.toISOString(),
        selectedEmployees: employees.map(e => e.id),
        constraints: {
          userConstraints: constraints,
          notes: notes || ""
        }
      };

      const savedSchedule = await prisma.generatedSchedule.create({
        data: {
          companyId: team.companyId,
          teamId: parsedTeamId,
          generationConfig: generationConfig,
          generatedPlanning: scheduleJson,
          metrics: {
            generationTime: 0, // À calculer si nécessaire
            strategy: "ai_openrouter",
            qualityScore: 0,
            constraintsRespected: constraints.length,
            employeesSatisfaction: 0
          },
          modelVersion: "openrouter-gemini-2.0",
          algorithm: "OpenRouter",
          status: "generated",
          generatedById: req.user.id
        }
      });

      console.log(`[AI] Planning sauvegardé (ID: ${savedSchedule.id})`);

      // ✅ Réponse de succès avec les données sauvegardées
      return res.status(201).json({
        success: true,
        message: `Planning généré avec succès pour ${employees.length} employés de l'équipe ${team.name}`,
        data: {
          teamId: team.id,
          teamName: team.name,
          weekNumber,
          year,
          employeesCount: employees.length,
          generatedSchedules: [{
            id: savedSchedule.id,
            status: savedSchedule.status,
            timestamp: savedSchedule.generatedAt,
          }],
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
 * @desc    Récupérer tous les plannings IA avec le statut "generated"
 * @access  Private - Manager, Directeur, Admin uniquement
 *
 * MIGRATION POSTGRESQL:
 * - Requêtes Prisma pour GeneratedSchedule
 * - Filtrage par rôle avec joins optimisés
 */
router.get(
  "/generated-schedules",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        console.log('❌ [AI API] Utilisateur non authentifié');
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      console.log(
        `[AI] Récupération des plannings générés par ${req.user.id} (${req.user.role})`
      );
      console.log(`[AI] Paramètres de la requête:`, req.query);
      console.log(`[AI] User companyId:`, req.user.companyId);
      console.log(`[AI] User role:`, req.user.role);

      // MIGRATION POSTGRESQL: Construction de la requête Prisma selon le rôle
      let whereClause: any = {
        status: "generated"
      };

      if (req.user.role === "manager") {
        // Manager : seulement les plannings des équipes qu'il gère
        whereClause.team = {
          managerId: req.user.id
        };
        console.log(`[AI] Requête manager - filtre par managerId:`, req.user.id);
      } else if (req.user.role === "directeur") {
        // Directeur : seulement les plannings de sa société
        whereClause.companyId = req.user.companyId;
        console.log(`[AI] Requête directeur - filtre par companyId:`, req.user.companyId);
      }
      // Admin : pas de filtre supplémentaire

      // MIGRATION POSTGRESQL: Récupération des plannings avec Prisma
      const generatedSchedules = await prisma.generatedSchedule.findMany({
        where: whereClause,
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          },
          generatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          generatedAt: 'desc'
        }
      });

      console.log(`[AI] Plannings trouvés: ${generatedSchedules.length}`);

      // 🏢 Enrichissement avec les données pour le frontend
      const enrichedSchedules = generatedSchedules.map((schedule) => {
        // MIGRATION POSTGRESQL: Extraire les infos de generationConfig
        const config = schedule.generationConfig as any;
        const weekNumber = config?.weekNumber || 1;
        const yearValue = config?.year || new Date().getFullYear();

        // Gestion spéciale pour les plannings générés automatiquement
        const generatedByInfo = schedule.generatedBy || {
          id: 0,
          firstName: 'Génération',
          lastName: 'Automatique'
        };

        return {
          _id: schedule.id.toString(),
          id: schedule.id,
          scheduleData: schedule.generatedPlanning,
          status: schedule.status,
          timestamp: schedule.generatedAt,
          generatedBy: generatedByInfo,
          teamId: schedule.team.id,
          teamName: schedule.team.name,
          companyName: schedule.company.name,
          constraints: config?.constraints?.userConstraints || [],
          notes: config?.constraints?.notes || "",
          weekNumber: weekNumber,
          year: yearValue,
          metrics: schedule.metrics || {}
        };
      });

      console.log(`[AI] ${enrichedSchedules.length} plannings enrichis`);

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
 * @desc    Mettre à jour le generatedPlanning d'un planning IA
 * @access  Private - Manager, Directeur, Admin uniquement
 *
 * MIGRATION POSTGRESQL:
 * - Validation id number
 * - Update Prisma avec permissions check
 */
router.patch(
  "/generated-schedules/:id",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // MIGRATION POSTGRESQL: Validation id (number)
      const scheduleId = parseInt(req.params.id, 10);
      if (isNaN(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide (doit être un nombre)",
        });
      }

      const { scheduleData } = req.body;

      if (!scheduleData || typeof scheduleData !== "object") {
        return res.status(400).json({
          success: false,
          message: "Données de planning (scheduleData) manquantes ou invalides",
        });
      }

      console.log(`[AI] Mise à jour du planning ${scheduleId} par ${req.user.id}`);

      // MIGRATION POSTGRESQL: Récupération du planning avec Prisma
      const existingSchedule = await prisma.generatedSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          team: {
            select: {
              id: true,
              managerId: true,
              companyId: true
            }
          }
        }
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès
      if (req.user.role !== "admin") {
        const userIsManager = existingSchedule.team.managerId === req.user.id;
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === existingSchedule.team.companyId;

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à modifier ce planning",
          });
        }
      }

      // MIGRATION POSTGRESQL: Mise à jour avec Prisma
      const updatedSchedule = await prisma.generatedSchedule.update({
        where: { id: scheduleId },
        data: {
          generatedPlanning: scheduleData,
          updatedAt: new Date()
        },
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          },
          generatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log(`[AI] Planning ${scheduleId} mis à jour avec succès`);

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
 * @desc    Valider un planning IA (convertir en WeeklySchedule)
 * @access  Private - Manager, Directeur, Admin uniquement
 *
 * MIGRATION POSTGRESQL:
 * - Conversion GeneratedSchedule → WeeklySchedule
 * - Structure team-based (1 WeeklySchedule par team)
 * - Mise à jour du status à "validated"
 */
router.patch(
  "/generated-schedules/:id/validate",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // MIGRATION POSTGRESQL: Validation id (number)
      const scheduleId = parseInt(req.params.id, 10);
      if (isNaN(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide (doit être un nombre)",
        });
      }

      console.log(`[AI] Validation du planning ${scheduleId} par ${req.user.id}`);

      // MIGRATION POSTGRESQL: Récupération du planning avec Prisma
      const existingSchedule = await prisma.generatedSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              managerId: true,
              companyId: true
            }
          }
        }
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      if (existingSchedule.status !== "generated") {
        return res.status(400).json({
          success: false,
          message: "Seuls les plannings générés peuvent être validés",
        });
      }

      // 🔐 Vérification des droits d'accès
      if (req.user.role !== "admin") {
        const userIsManager = existingSchedule.team.managerId === req.user.id;
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === existingSchedule.team.companyId;

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à valider ce planning",
          });
        }
      }

      // MIGRATION POSTGRESQL: Créer le WeeklySchedule et update le GeneratedSchedule
      const config = existingSchedule.generationConfig as any;
      const weekStartDate = new Date(config.weekStartDate);
      const weekEndDate = new Date(config.weekEndDate);

      // Créer le WeeklySchedule
      const weeklySchedule = await prisma.weeklySchedule.create({
        data: {
          companyId: existingSchedule.companyId,
          teamId: existingSchedule.teamId,
          weekStartDate: weekStartDate,
          weekEndDate: weekEndDate,
          schedule: existingSchedule.generatedPlanning,
          status: "validated",
          validatedById: req.user.id,
          validatedAt: new Date(),
          createdById: req.user.id
        }
      });

      // Mettre à jour le GeneratedSchedule
      const updatedGenSchedule = await prisma.generatedSchedule.update({
        where: { id: scheduleId },
        data: {
          status: "converted",
          weeklyScheduleId: weeklySchedule.id,
          validatedById: req.user.id,
          validatedAt: new Date()
        }
      });

      console.log(
        `[AI] Planning ${scheduleId} validé et transféré vers WeeklySchedule (${weeklySchedule.id})`
      );

      return res.status(200).json({
        success: true,
        data: {
          weeklySchedule: weeklySchedule,
          generatedSchedule: updatedGenSchedule,
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
 *
 * MIGRATION POSTGRESQL:
 * - Update status à "rejected" au lieu de delete
 */
router.patch(
  "/generated-schedules/:id/reject",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      // MIGRATION POSTGRESQL: Validation id (number)
      const scheduleId = parseInt(req.params.id, 10);
      if (isNaN(scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "ID de planning invalide (doit être un nombre)",
        });
      }

      const { validationNote } = req.body;

      console.log(`[AI] Refus du planning ${scheduleId} par ${req.user.id}`);

      // MIGRATION POSTGRESQL: Récupération du planning
      const existingSchedule = await prisma.generatedSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              managerId: true,
              companyId: true
            }
          }
        }
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: "Planning généré introuvable",
        });
      }

      if (existingSchedule.status !== "generated") {
        return res.status(400).json({
          success: false,
          message: "Seuls les plannings générés peuvent être refusés",
        });
      }

      // 🔐 Vérification des droits d'accès
      if (req.user.role !== "admin") {
        const userIsManager = existingSchedule.team.managerId === req.user.id;
        const userIsDirecteur =
          req.user.role === "directeur" &&
          req.user.companyId === existingSchedule.team.companyId;

        if (!userIsManager && !userIsDirecteur) {
          return res.status(403).json({
            success: false,
            message: "Vous n'êtes pas autorisé à refuser ce planning",
          });
        }
      }

      // MIGRATION POSTGRESQL: Update status à "rejected"
      const rejectedSchedule = await prisma.generatedSchedule.update({
        where: { id: scheduleId },
        data: {
          status: "rejected",
          validationNote: validationNote || "Planning refusé",
          validatedById: req.user.id,
          validatedAt: new Date()
        }
      });

      console.log(`[AI] Planning ${scheduleId} refusé`);

      return res.status(200).json({
        success: true,
        data: {
          rejectedScheduleId: scheduleId,
          teamName: existingSchedule.team.name,
        },
        message: "Planning refusé avec succès",
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
 *
 * MIGRATION POSTGRESQL:
 * - teamId validation number
 * - Requêtes Prisma pour Team et Employee
 */
router.post(
  "/conversation",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
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
        `[AI Conversation] Nouvelle interaction pour l'équipe ${teamId} par ${req.user.id}`
      );

      // ✅ Validation des champs obligatoires
      if (!teamId || !year || !weekNumber || !message) {
        return res.status(400).json({
          success: false,
          message:
            "Tous les champs obligatoires doivent être fournis : teamId, year, weekNumber, message",
        });
      }

      // MIGRATION POSTGRESQL: Validation teamId (number)
      const parsedTeamId = parseInt(String(teamId), 10);
      if (isNaN(parsedTeamId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide (doit être un nombre)",
        });
      }

      // MIGRATION POSTGRESQL: Récupération de l'équipe avec Prisma
      const team = await prisma.team.findUnique({
        where: { id: parsedTeamId },
        include: {
          employees: {
            where: { isActive: true },
            select: {
              id: true,
              position: true,
              contractualHours: true,
              preferences: true,
              hireDate: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès à l'équipe
      const userIsManager = team.managerId === req.user.id;
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId;
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "Vous n'êtes pas autorisé à interagir avec l'IA pour cette équipe",
        });
      }

      const employees = team.employees;

      if (!employees || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Aucun employé trouvé dans cette équipe",
        });
      }

      // 🧠 Construction du contexte enrichi pour l'IA
      let employeeDetails = "";
      employees.forEach((employee) => {
        const prefs = employee.preferences as any;
        const preferredDays = prefs?.preferredDays?.join(", ") || "Aucune préférence spécifiée";
        const preferredHours = prefs?.preferredHours?.join(", ") || "Aucune préférence spécifiée";
        const contractHours = employee.contractualHours || 35;
        const anciennete = employee.hireDate
          ? `${
              new Date().getFullYear() -
              new Date(employee.hireDate).getFullYear()
            } ans`
          : "Non spécifiée";

        employeeDetails += `- ${employee.user.firstName} ${employee.user.lastName}:
  * Contrat: ${contractHours}h/semaine (soit ${Math.round(contractHours / 5)}h/jour en moyenne)
  * Jours préférés: ${preferredDays}
  * Horaires préférés: ${preferredHours}
  * Ancienneté: ${anciennete}
  * Statut: Actif
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
 *
 * MIGRATION POSTGRESQL:
 * - teamId validation number
 * - Sauvegarde dans GeneratedSchedule avec nouvelle structure
 * - Gestion des exceptions et validations complètes
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
    console.log('👤 [AI GENERATION] Utilisateur:', req.user ? req.user.id : 'NON DÉFINI');
    console.log('📊 [AI GENERATION] Body de la requête:', JSON.stringify(req.body, null, 2));

    try {
      console.log('✅ [AI GENERATION] Entrée dans le try-catch principal');

      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        console.log('❌ [AI GENERATION] Utilisateur non authentifié');
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      console.log('✅ [AI GENERATION] Utilisateur authentifié:', req.user.id);

      const startTime = Date.now();
      const constraints: PlanningConstraints = req.body;

      // MIGRATION POSTGRESQL: Validation teamId (number)
      const parsedTeamId = parseInt(String(constraints.teamId), 10);
      if (isNaN(parsedTeamId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'équipe invalide (doit être un nombre)",
        });
      }

      console.log(
        `[AI Wizard] Génération de planning avec contraintes structurées pour l'équipe ${parsedTeamId}`
      );

      // MIGRATION POSTGRESQL: Récupération de l'équipe avec Prisma
      const team = await prisma.team.findUnique({
        where: { id: parsedTeamId },
        include: {
          employees: {
            where: { isActive: true },
            select: {
              id: true,
              userId: true,
              position: true,
              skills: true,
              contractualHours: true,
              preferences: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Équipe introuvable",
        });
      }

      // 🔐 Vérification des droits d'accès
      const userIsManager = team.managerId === req.user.id;
      const userIsDirecteur =
        req.user.role === "directeur" &&
        req.user.companyId === team.companyId;
      const userIsAdmin = req.user.role === "admin";

      if (!userIsManager && !userIsDirecteur && !userIsAdmin) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette équipe",
        });
      }

      const employees = team.employees;

      // 🧠 Construction du prompt structuré pour l'IA
      const weekDate = new Date(constraints.year, 0, 1 + (constraints.weekNumber - 1) * 7);
      const weekInfo = `Semaine ${constraints.weekNumber}/${constraints.year} (${weekDate.toLocaleDateString("fr-FR")})`;

      let employeeDetails = "";
      constraints.employees.forEach((emp) => {
        const employee = employees.find(e => e.id === parseInt(emp.id));
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
        const dayFr: Record<string, string> = {
          monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
          thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
        };
        const hours = constraints.companyConstraints.openingHours.find(h => h.day === day);
        return `${dayFr[day]}: ${hours?.hours.join(', ') || 'Horaires standards'}`;
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
        const dayFr: Record<string, string> = {
          monday: 'LUNDI', tuesday: 'MARDI', wednesday: 'MERCREDI',
          thursday: 'JEUDI', friday: 'VENDREDI', saturday: 'SAMEDI', sunday: 'DIMANCHE'
        };
        return `- ${dayFr[dayHours.day]}: ${dayHours.hours.join(' et ')} (COUVERTURE OBLIGATOIRE INTEGRALE)`;
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

      // 🌐 Appel à l'API OpenRouter
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
                const dayEn: Record<string, string> = {
                  lundi: 'monday',
                  mardi: 'tuesday',
                  mercredi: 'wednesday',
                  jeudi: 'thursday',
                  vendredi: 'friday'
                };

                const dayHours = defaultHours.find(h => h.day === dayEn[day]);

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
        }

        if (!generatedScheduleData) {
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
      const dayMapping: Record<string, string> = {
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
      }

      // MIGRATION POSTGRESQL: Sauvegarde dans GeneratedSchedule
      console.log('🔍 [AI GENERATION] Sauvegarde du planning généré...');

      // Calculer les dates de la semaine
      function getWeekDates(year: number, weekNumber: number) {
        const january4th = new Date(year, 0, 4);
        const dayOfWeek = january4th.getDay() || 7;
        const weekStart = new Date(january4th);
        weekStart.setDate(january4th.getDate() - dayOfWeek + 1);
        weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { weekStartDate: weekStart, weekEndDate: weekEnd };
      }

      const { weekStartDate, weekEndDate } = getWeekDates(constraints.year, constraints.weekNumber);

      // Convertir le planning en format team-based
      const scheduleJson: Record<string, any[]> = {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      };

      const dayMappingReverse: Record<string, string> = {
        lundi: "monday",
        mardi: "tuesday",
        mercredi: "wednesday",
        jeudi: "thursday",
        vendredi: "friday",
        samedi: "saturday",
        dimanche: "sunday",
      };

      for (const [dayFr, employeeSchedules] of Object.entries(generatedScheduleData)) {
        const dayEn = dayMappingReverse[dayFr] || dayFr;

        if (!scheduleJson[dayEn]) {
          scheduleJson[dayEn] = [];
        }

        for (const [employeeName, slots] of Object.entries(employeeSchedules)) {
          // Trouver l'employé correspondant
          const employeeConstraint = constraints.employees.find(e => e.name === employeeName);
          const employee = employeeConstraint ? employees.find(e => e.id === parseInt(employeeConstraint.id)) : null;

          if (employee && Array.isArray(slots) && slots.length > 0) {
            slots.forEach((slot: string) => {
              const [startTime, endTime] = slot.split("-");
              if (startTime && endTime) {
                scheduleJson[dayEn].push({
                  employeeId: employee.id,
                  startTime,
                  endTime,
                  position: employee.position || null,
                  skills: employee.skills || [],
                  breakStart: null,
                  breakEnd: null
                });
              }
            });
          }
        }
      }

      const generationConfig = {
        strategy: "ai_wizard",
        weekStartDate: weekStartDate.toISOString(),
        weekEndDate: weekEndDate.toISOString(),
        weekNumber: constraints.weekNumber,
        year: constraints.year,
        selectedEmployees: employees.map(e => e.id),
        constraints: constraints
      };

      const savedSchedule = await prisma.generatedSchedule.create({
        data: {
          companyId: team.companyId,
          teamId: parsedTeamId,
          generationConfig: generationConfig,
          generatedPlanning: scheduleJson,
          metrics: {
            generationTime: Date.now() - startTime,
            strategy: "ai_wizard",
            qualityScore: 100 - (validationErrors.length * 5),
            constraintsRespected: constraints.employees.length,
            employeesSatisfaction: 0,
            validationWarnings: validationErrors
          },
          modelVersion: "openrouter-wizard-v1",
          algorithm: "OpenRouter",
          status: "generated",
          generatedById: req.user.id
        }
      });

      const processingTime = Date.now() - startTime;

      console.log(
        `[AI Wizard] Planning généré avec succès en ${processingTime}ms pour ${employees.length} employés`
      );

      return res.status(201).json({
        success: true,
        message: `Planning généré avec succès pour ${employees.length} employés de l'équipe ${team.name}`,
        schedule: [],
        processingTime,
        data: {
          teamId: team.id,
          teamName: team.name,
          weekNumber: constraints.weekNumber,
          year: constraints.year,
          employeesCount: employees.length,
          generatedSchedules: [{
            id: savedSchedule.id,
            status: savedSchedule.status,
            timestamp: savedSchedule.generatedAt,
          }],
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
 *
 * MIGRATION POSTGRESQL:
 * - Validation des IDs (number[])
 * - Requêtes Prisma pour permissions et delete
 */
router.delete(
  "/generated-schedules/bulk",
  authenticateToken,
  checkRole(["manager", "directeur", "admin"]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 🔐 Validation de l'utilisateur authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié",
        });
      }

      const { scheduleIds, deleteAll } = req.body;

      console.log(
        `[AI] Suppression demandée par ${req.user.id} (${req.user.role}) - deleteAll: ${deleteAll}, IDs: ${scheduleIds?.length || 0}`
      );

      // ✅ Validation des paramètres
      if (!deleteAll && (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Liste des IDs de plannings à supprimer requise ou flag deleteAll manquant",
        });
      }

      // MIGRATION POSTGRESQL: Validation des IDs (number[])
      let validatedIds: number[] = [];
      if (!deleteAll && scheduleIds) {
        validatedIds = scheduleIds
          .map((id: any) => parseInt(String(id), 10))
          .filter((id: number) => !isNaN(id));

        if (validatedIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Aucun ID valide fourni",
          });
        }
      }

      // MIGRATION POSTGRESQL: Construction de la requête selon le rôle
      let whereClause: any = { status: "generated" };

      if (req.user.role === "manager") {
        // Manager : seulement les plannings des équipes qu'il gère
        whereClause.team = {
          managerId: req.user.id
        };
      } else if (req.user.role === "directeur") {
        // Directeur : seulement les plannings de sa société
        whereClause.companyId = req.user.companyId;
      }
      // Admin : pas de filtre supplémentaire

      // Ajouter le filtre sur les IDs si spécifiques
      if (!deleteAll && validatedIds.length > 0) {
        whereClause.id = { in: validatedIds };
      }

      console.log(`[AI] Requête de suppression:`, JSON.stringify(whereClause, null, 2));

      // MIGRATION POSTGRESQL: Suppression avec Prisma
      const deleteResult = await prisma.generatedSchedule.deleteMany({
        where: whereClause
      });

      console.log(`[AI] ${deleteResult.count} plannings supprimés`);

      return res.status(200).json({
        success: true,
        data: {
          deletedCount: deleteResult.count,
          deletedIds: deleteAll ? "tous" : validatedIds,
        },
        message: `${deleteResult.count} planning(s) supprimé(s) avec succès`,
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
