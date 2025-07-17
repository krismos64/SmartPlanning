/**
 * Index des schémas de validation Zod
 * 
 * Centralise l'export de tous les schémas de validation
 * pour une importation facile dans les routes.
 */

// Export des schémas d'authentification
export * from './auth.schemas';

// Export des schémas d'entreprises et équipes
export * from './company.schemas';

// Export des schémas d'employés
export * from './employee.schemas';

// Export du middleware de validation
export { 
  validateRequest, 
  validateBody, 
  validateParams, 
  validateQuery,
  createObjectIdSchema,
  createEmailSchema,
  createPasswordSchema,
  createPhoneSchema
} from '../middlewares/validation.middleware';