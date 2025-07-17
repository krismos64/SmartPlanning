/**
 * Schémas de validation pour les employés
 * 
 * Valide toutes les données liées à la gestion des employés,
 * compétences, horaires et informations professionnelles.
 */

import { z } from 'zod';
import { 
  createObjectIdSchema, 
  createEmailSchema, 
  createPhoneSchema 
} from '../middlewares/validation.middleware';

/**
 * Schémas pour les compétences
 */
export const skillSchema = z.string()
  .min(2, "Une compétence doit contenir au moins 2 caractères")
  .max(50, "Une compétence ne peut pas dépasser 50 caractères")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]+$/, "La compétence contient des caractères invalides")
  .transform(skill => skill.trim());

/**
 * Schéma pour les horaires de travail
 */
export const workingHoursSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], {
    errorMap: () => ({ message: "Jour invalide" })
  }),
  start: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Heure de début invalide (format HH:MM)")
    .optional(),
  end: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Heure de fin invalide (format HH:MM)")
    .optional(),
  isWorkingDay: z.boolean().default(true)
}).refine(data => {
  if (data.isWorkingDay && (!data.start || !data.end)) {
    return false;
  }
  if (data.start && data.end) {
    const startMinutes = parseInt(data.start.split(':')[0]) * 60 + parseInt(data.start.split(':')[1]);
    const endMinutes = parseInt(data.end.split(':')[0]) * 60 + parseInt(data.end.split(':')[1]);
    return endMinutes > startMinutes;
  }
  return true;
}, {
  message: "L'heure de fin doit être après l'heure de début"
});

/**
 * Schéma pour les disponibilités spéciales
 */
export const availabilitySchema = z.object({
  date: z.string()
    .datetime("Date de disponibilité invalide")
    .transform(str => new Date(str)),
  
  isAvailable: z.boolean(),
  
  reason: z.string()
    .min(2, "La raison doit contenir au moins 2 caractères")
    .max(200, "La raison ne peut pas dépasser 200 caractères")
    .optional(),
  
  timeSlots: z.array(z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Heure de début invalide"),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Heure de fin invalide")
  })).optional()
});

/**
 * Schéma de validation pour création d'employé
 */
export const createEmployeeSchema = z.object({
  // Informations personnelles
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom contient des caractères invalides")
    .transform(name => name.trim()),
  
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides")
    .transform(name => name.trim()),
  
  email: createEmailSchema(),
  
  phone: createPhoneSchema().optional(),
  
  // Informations professionnelles
  employeeId: z.string()
    .min(3, "L'identifiant employé doit contenir au moins 3 caractères")
    .max(20, "L'identifiant employé ne peut pas dépasser 20 caractères")
    .regex(/^[A-Z0-9\-]+$/, "L'identifiant doit contenir uniquement des lettres majuscules, chiffres et tirets")
    .optional(),
  
  position: z.string()
    .min(2, "Le poste doit contenir au moins 2 caractères")
    .max(100, "Le poste ne peut pas dépasser 100 caractères")
    .transform(pos => pos.trim()),
  
  department: z.string()
    .min(2, "Le département doit contenir au moins 2 caractères")
    .max(50, "Le département ne peut pas dépasser 50 caractères")
    .transform(dept => dept.trim())
    .optional(),
  
  // Références organisationnelles
  companyId: createObjectIdSchema('companyId'),
  
  teamId: createObjectIdSchema('teamId').optional(),
  
  managerId: createObjectIdSchema('managerId').optional(),
  
  userId: createObjectIdSchema('userId').optional(),
  
  // Compétences
  skills: z.array(skillSchema)
    .min(1, "Au moins une compétence est requise")
    .max(15, "Maximum 15 compétences autorisées"),
  
  // Niveau d'expérience
  experienceLevel: z.enum(['junior', 'intermediate', 'senior', 'expert'], {
    errorMap: () => ({ message: "Niveau d'expérience invalide: junior, intermediate, senior, expert" })
  }).optional(),
  
  // Horaires de travail par défaut
  defaultWorkingHours: z.array(workingHoursSchema)
    .length(7, "Les horaires doivent être définis pour les 7 jours de la semaine")
    .optional(),
  
  // Informations contractuelles
  contractType: z.enum(['cdi', 'cdd', 'stage', 'freelance', 'interim'], {
    errorMap: () => ({ message: "Type de contrat invalide: cdi, cdd, stage, freelance, interim" })
  }).optional(),
  
  startDate: z.string()
    .datetime("Date de début invalide")
    .transform(str => new Date(str)),
  
  endDate: z.string()
    .datetime("Date de fin invalide")
    .transform(str => new Date(str))
    .optional(),
  
  // Salaire (optionnel pour confidentialité)
  salary: z.number()
    .positive("Le salaire doit être positif")
    .max(1000000, "Salaire maximum dépassé")
    .optional(),
  
  // Informations supplémentaires
  notes: z.string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .transform(notes => notes?.trim())
    .optional(),
  
  // Photo de profil
  photoUrl: z.string()
    .url("URL de photo invalide")
    .optional(),
  
  // Statut
  isActive: z.boolean().optional().default(true),
  
  // Préférences de planning
  planningPreferences: z.object({
    preferredShifts: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])).optional(),
    maxHoursPerWeek: z.number().min(1).max(60).optional(),
    availableWeekends: z.boolean().optional(),
    preferredDaysOff: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional()
  }).optional()
});

/**
 * Schéma de validation pour mise à jour d'employé
 */
export const updateEmployeeSchema = createEmployeeSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Schéma de validation pour mise à jour des compétences
 */
export const updateSkillsSchema = z.object({
  skills: z.array(skillSchema)
    .min(1, "Au moins une compétence est requise")
    .max(15, "Maximum 15 compétences autorisées")
});

/**
 * Schéma de validation pour mise à jour des horaires
 */
export const updateWorkingHoursSchema = z.object({
  workingHours: z.array(workingHoursSchema)
    .length(7, "Les horaires doivent être définis pour les 7 jours de la semaine")
});

/**
 * Schéma de validation pour ajout de disponibilité
 */
export const addAvailabilitySchema = availabilitySchema;

/**
 * Schéma de validation pour paramètres d'employé (route params)
 */
export const employeeParamsSchema = z.object({
  id: createObjectIdSchema('employeeId')
});

/**
 * Schéma de validation pour query parameters de recherche d'employés
 */
export const employeeQuerySchema = z.object({
  // Recherche par nom/email
  search: z.string()
    .min(2, "Le terme de recherche doit contenir au moins 2 caractères")
    .max(100, "Le terme de recherche ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtrage par entreprise
  companyId: createObjectIdSchema('companyId').optional(),
  
  // Filtrage par équipe
  teamId: createObjectIdSchema('teamId').optional(),
  
  // Filtrage par département
  department: z.string()
    .max(50, "Le département ne peut pas dépasser 50 caractères")
    .optional(),
  
  // Filtrage par poste
  position: z.string()
    .max(100, "Le poste ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtrage par compétence
  skill: z.string()
    .max(50, "La compétence ne peut pas dépasser 50 caractères")
    .optional(),
  
  // Filtrage par niveau d'expérience
  experienceLevel: z.enum(['junior', 'intermediate', 'senior', 'expert']).optional(),
  
  // Filtrage par type de contrat
  contractType: z.enum(['cdi', 'cdd', 'stage', 'freelance', 'interim']).optional(),
  
  // Filtrage par statut
  isActive: z.string()
    .transform(str => str === 'true')
    .optional(),
  
  // Pagination
  page: z.string()
    .regex(/^\d+$/, "Le numéro de page doit être un nombre")
    .transform(str => Math.max(1, parseInt(str)))
    .optional()
    .default('1'),
  
  limit: z.string()
    .regex(/^\d+$/, "La limite doit être un nombre")
    .transform(str => Math.min(100, Math.max(1, parseInt(str))))
    .optional()
    .default('20'),
  
  // Tri
  sortBy: z.enum(['firstName', 'lastName', 'position', 'startDate', 'createdAt'], {
    message: "Tri autorisé: firstName, lastName, position, startDate, createdAt"
  }).optional().default('lastName'),
  
  sortOrder: z.enum(['asc', 'desc'], {
    message: "Ordre de tri: asc ou desc"
  }).optional().default('asc')
});

/**
 * Schéma de validation pour import d'employés en masse
 */
export const bulkImportEmployeesSchema = z.object({
  employees: z.array(createEmployeeSchema)
    .min(1, "Au moins un employé doit être fourni")
    .max(100, "Maximum 100 employés par import"),
  
  updateExisting: z.boolean()
    .optional()
    .default(false),
  
  skipErrors: z.boolean()
    .optional()
    .default(false)
});

/**
 * Types TypeScript générés automatiquement
 */
export type CreateEmployeeRequest = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeSchema>;
export type UpdateSkillsRequest = z.infer<typeof updateSkillsSchema>;
export type UpdateWorkingHoursRequest = z.infer<typeof updateWorkingHoursSchema>;
export type AddAvailabilityRequest = z.infer<typeof addAvailabilitySchema>;
export type EmployeeParams = z.infer<typeof employeeParamsSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
export type BulkImportEmployeesRequest = z.infer<typeof bulkImportEmployeesSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type WorkingHours = z.infer<typeof workingHoursSchema>;
export type Availability = z.infer<typeof availabilitySchema>;