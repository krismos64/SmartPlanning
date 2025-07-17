/**
 * Schémas de validation pour les entreprises
 * 
 * Valide toutes les données liées à la gestion des entreprises,
 * équipes et structure organisationnelle.
 */

import { z } from 'zod';
import { createObjectIdSchema, createEmailSchema, createPhoneSchema } from '../middlewares/validation.middleware';

/**
 * Schéma de validation pour création d'entreprise
 */
export const createCompanySchema = z.object({
  // Informations de base
  name: z.string()
    .min(2, "Le nom d'entreprise doit contenir au moins 2 caractères")
    .max(100, "Le nom d'entreprise ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]+$/, "Le nom d'entreprise contient des caractères invalides")
    .transform(name => name.trim()),
  
  // Adresse complète
  address: z.string()
    .min(10, "L'adresse doit contenir au moins 10 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .transform(addr => addr.trim()),
  
  // Taille de l'entreprise
  size: z.number()
    .int("La taille d'entreprise doit être un nombre entier")
    .min(1, "La taille d'entreprise doit être au moins 1")
    .max(50000, "La taille d'entreprise ne peut pas dépasser 50000"),
  
  // Secteur d'activité
  industry: z.string()
    .min(2, "Le secteur d'activité doit contenir au moins 2 caractères")
    .max(100, "Le secteur d'activité ne peut pas dépasser 100 caractères")
    .transform(industry => industry.trim())
    .optional(),
  
  // Informations de contact
  phone: createPhoneSchema().optional(),
  
  email: createEmailSchema().optional(),
  
  // Site web
  website: z.string()
    .url("L'URL du site web n'est pas valide")
    .max(200, "L'URL ne peut pas dépasser 200 caractères")
    .optional(),
  
  // SIRET français
  siret: z.string()
    .regex(/^[0-9]{14}$/, "Le SIRET doit contenir exactement 14 chiffres")
    .optional(),
  
  // Logo de l'entreprise (URL Cloudinary)
  logoUrl: z.string()
    .url("URL du logo invalide")
    .optional(),
  
  // Description
  description: z.string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .transform(desc => desc?.trim())
    .optional(),
  
  // Statut actif par défaut
  isActive: z.boolean().optional().default(true)
});

/**
 * Schéma de validation pour mise à jour d'entreprise
 */
export const updateCompanySchema = createCompanySchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Schéma de validation pour création d'équipe
 */
export const createTeamSchema = z.object({
  // Nom de l'équipe
  name: z.string()
    .min(2, "Le nom d'équipe doit contenir au moins 2 caractères")
    .max(100, "Le nom d'équipe ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-&'.,()]+$/, "Le nom d'équipe contient des caractères invalides")
    .transform(name => name.trim()),
  
  // Description de l'équipe
  description: z.string()
    .max(300, "La description ne peut pas dépasser 300 caractères")
    .transform(desc => desc?.trim())
    .optional(),
  
  // Entreprise parente
  companyId: createObjectIdSchema('companyId'),
  
  // Manager de l'équipe
  managerId: createObjectIdSchema('managerId').optional(),
  
  // Département
  department: z.string()
    .min(2, "Le département doit contenir au moins 2 caractères")
    .max(50, "Le département ne peut pas dépasser 50 caractères")
    .transform(dept => dept?.trim())
    .optional(),
  
  // Localisation
  location: z.string()
    .min(2, "La localisation doit contenir au moins 2 caractères")
    .max(100, "La localisation ne peut pas dépasser 100 caractères")
    .transform(loc => loc?.trim())
    .optional(),
  
  // Capacité maximum d'employés
  maxEmployees: z.number()
    .int("La capacité maximum doit être un nombre entier")
    .min(1, "La capacité minimum est de 1 employé")
    .max(1000, "La capacité maximum est de 1000 employés")
    .optional(),
  
  // Couleur pour l'affichage (hex color)
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "La couleur doit être au format hexadécimal (#RRGGBB)")
    .optional(),
  
  // Statut actif par défaut
  isActive: z.boolean().optional().default(true)
});

/**
 * Schéma de validation pour mise à jour d'équipe
 */
export const updateTeamSchema = createTeamSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: "Au moins un champ doit être fourni pour la mise à jour" }
);

/**
 * Schéma de validation pour ajout de membre à l'équipe
 */
export const addTeamMemberSchema = z.object({
  employeeId: createObjectIdSchema('employeeId'),
  
  // Rôle dans l'équipe
  role: z.string()
    .min(2, "Le rôle doit contenir au moins 2 caractères")
    .max(50, "Le rôle ne peut pas dépasser 50 caractères")
    .optional(),
  
  // Date de début dans l'équipe
  startDate: z.string()
    .datetime("Date de début invalide")
    .transform(str => new Date(str))
    .optional()
});

/**
 * Schéma de validation pour suppression de membre d'équipe
 */
export const removeTeamMemberSchema = z.object({
  employeeId: createObjectIdSchema('employeeId'),
  
  // Date de fin dans l'équipe
  endDate: z.string()
    .datetime("Date de fin invalide")
    .transform(str => new Date(str))
    .optional()
});

/**
 * Schéma de validation pour paramètres d'entreprise (route params)
 */
export const companyParamsSchema = z.object({
  id: createObjectIdSchema('companyId')
});

/**
 * Schéma de validation pour paramètres d'équipe (route params)
 */
export const teamParamsSchema = z.object({
  id: createObjectIdSchema('teamId')
});

/**
 * Schéma de validation pour query parameters de recherche d'entreprises
 */
export const companyQuerySchema = z.object({
  // Recherche par nom
  search: z.string()
    .min(2, "Le terme de recherche doit contenir au moins 2 caractères")
    .max(100, "Le terme de recherche ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtrage par secteur
  industry: z.string()
    .max(100, "Le secteur ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtrage par taille (min)
  minSize: z.string()
    .regex(/^\d+$/, "La taille minimum doit être un nombre")
    .transform(str => parseInt(str))
    .optional(),
  
  // Filtrage par taille (max)
  maxSize: z.string()
    .regex(/^\d+$/, "La taille maximum doit être un nombre")
    .transform(str => parseInt(str))
    .optional(),
  
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
  sortBy: z.enum(['name', 'size', 'createdAt', 'updatedAt'], {
    errorMap: () => ({ message: "Tri autorisé: name, size, createdAt, updatedAt" })
  }).optional().default('name'),
  
  sortOrder: z.enum(['asc', 'desc'], {
    message: "Ordre de tri: asc ou desc"
  }).optional().default('asc')
});

/**
 * Schéma de validation pour query parameters de recherche d'équipes
 */
export const teamQuerySchema = z.object({
  // Recherche par nom
  search: z.string()
    .min(2, "Le terme de recherche doit contenir au moins 2 caractères")
    .max(100, "Le terme de recherche ne peut pas dépasser 100 caractères")
    .optional(),
  
  // Filtrage par entreprise
  companyId: createObjectIdSchema('companyId').optional(),
  
  // Filtrage par département
  department: z.string()
    .max(50, "Le département ne peut pas dépasser 50 caractères")
    .optional(),
  
  // Filtrage par manager
  managerId: createObjectIdSchema('managerId').optional(),
  
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
  sortBy: z.enum(['name', 'department', 'createdAt', 'updatedAt'], {
    errorMap: () => ({ message: "Tri autorisé: name, department, createdAt, updatedAt" })
  }).optional().default('name'),
  
  sortOrder: z.enum(['asc', 'desc'], {
    message: "Ordre de tri: asc ou desc"
  }).optional().default('asc')
});

/**
 * Types TypeScript générés automatiquement
 */
export type CreateCompanyRequest = z.infer<typeof createCompanySchema>;
export type UpdateCompanyRequest = z.infer<typeof updateCompanySchema>;
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;
export type UpdateTeamRequest = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberRequest = z.infer<typeof addTeamMemberSchema>;
export type RemoveTeamMemberRequest = z.infer<typeof removeTeamMemberSchema>;
export type CompanyParams = z.infer<typeof companyParamsSchema>;
export type TeamParams = z.infer<typeof teamParamsSchema>;
export type CompanyQuery = z.infer<typeof companyQuerySchema>;
export type TeamQuery = z.infer<typeof teamQuerySchema>;