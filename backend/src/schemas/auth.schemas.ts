/**
 * Schémas de validation pour l'authentification
 * 
 * Valide toutes les données liées à l'authentification, inscription, 
 * connexion et gestion des mots de passe.
 */

import { z } from 'zod';
import { 
  createEmailSchema, 
  createPasswordSchema, 
  createPhoneSchema,
  createObjectIdSchema 
} from '../middlewares/validation.middleware';

/**
 * Rôles utilisateur autorisés
 */
export const UserRoleEnum = z.enum(['admin', 'directeur', 'manager', 'employee'], {
  message: "Rôle utilisateur invalide. Rôles autorisés: admin, directeur, manager, employee"
});

/**
 * Schéma de validation pour l'inscription (register)
 */
export const registerSchema = z.object({
  // Informations personnelles obligatoires
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
  
  // Email avec validation stricte
  email: createEmailSchema(),
  
  // Mot de passe fort obligatoire
  password: createPasswordSchema(),
  
  // Informations de contact
  phone: createPhoneSchema().optional(),
  
  // Informations entreprise (pour directeur)
  companyName: z.string()
    .min(2, "Le nom d'entreprise doit contenir au moins 2 caractères")
    .max(100, "Le nom d'entreprise ne peut pas dépasser 100 caractères")
    .transform(name => name.trim()),
  
  companyAddress: z.string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .transform(addr => addr.trim()),
  
  companyPostalCode: z.string()
    .min(5, "Le code postal doit contenir 5 chiffres")
    .max(5, "Le code postal doit contenir 5 chiffres")
    .regex(/^\d{5}$/, "Le code postal doit contenir uniquement des chiffres")
    .transform(code => code.trim()),
  
  companyCity: z.string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "La ville contient des caractères invalides")
    .transform(city => city.trim()),
  
  companySize: z.number()
    .int("La taille d'entreprise doit être un nombre entier")
    .min(1, "La taille d'entreprise doit être au moins 1")
    .max(10000, "La taille d'entreprise ne peut pas dépasser 10000"),
  
  // Acceptation des conditions (obligatoire)
  acceptTerms: z.boolean()
    .refine(val => val === true, {
      message: "Vous devez accepter les conditions d'utilisation"
    }),
  
  // Consentement marketing (optionnel)
  acceptMarketing: z.boolean().optional().default(false)
});

/**
 * Schéma de validation pour la connexion (login)
 */
export const loginSchema = z.object({
  email: createEmailSchema(),
  password: z.string()
    .min(1, "Le mot de passe est obligatoire")
    .max(128, "Mot de passe trop long"),
  rememberMe: z.boolean().optional().default(false)
});

/**
 * Schéma de validation pour demande de reset de mot de passe
 */
export const forgotPasswordSchema = z.object({
  email: createEmailSchema()
});

/**
 * Schéma de validation pour reset de mot de passe
 */
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, "Token de réinitialisation obligatoire")
    .max(500, "Token invalide"),
  
  newPassword: createPasswordSchema(),
  
  confirmPassword: z.string()
    .min(1, "Confirmation du mot de passe obligatoire")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

/**
 * Schéma de validation pour changement de mot de passe
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, "Mot de passe actuel obligatoire"),
  
  newPassword: createPasswordSchema(),
  
  confirmPassword: z.string()
    .min(1, "Confirmation du mot de passe obligatoire")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "Le nouveau mot de passe doit être différent de l'actuel",
  path: ["newPassword"]
});

/**
 * Schéma de validation pour création d'utilisateur (admin)
 */
export const createUserSchema = z.object({
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
  
  role: UserRoleEnum,
  
  phone: createPhoneSchema().optional(),
  
  companyId: createObjectIdSchema('companyId').optional(),
  
  teamIds: z.array(createObjectIdSchema('teamId')).optional(),
  
  // Génération automatique du mot de passe temporaire
  generateTempPassword: z.boolean().optional().default(true),
  
  // Statut actif par défaut
  isActive: z.boolean().optional().default(true)
});

/**
 * Schéma de validation pour mise à jour d'utilisateur
 */
export const updateUserSchema = z.object({
  firstName: z.string()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le prénom contient des caractères invalides")
    .transform(name => name.trim())
    .optional(),
  
  lastName: z.string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, "Le nom contient des caractères invalides")
    .transform(name => name.trim())
    .optional(),
  
  email: createEmailSchema().optional(),
  
  role: UserRoleEnum.optional(),
  
  phone: createPhoneSchema().optional(),
  
  companyId: createObjectIdSchema('companyId').optional(),
  
  teamIds: z.array(createObjectIdSchema('teamId')).optional(),
  
  isActive: z.boolean().optional(),
  
  // Photo de profil (URL Cloudinary)
  photoUrl: z.string()
    .url("URL de photo invalide")
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit être fourni pour la mise à jour"
});

/**
 * Schéma de validation pour paramètres utilisateur (route params)
 */
export const userParamsSchema = z.object({
  id: createObjectIdSchema('userId')
});

/**
 * Types TypeScript générés automatiquement
 */
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
export type UserParams = z.infer<typeof userParamsSchema>;
export type UserRole = z.infer<typeof UserRoleEnum>;