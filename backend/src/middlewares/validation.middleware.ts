/**
 * Middleware de validation Zod pour SmartPlanning
 * 
 * Fournit une validation robuste et typée des données d'entrée
 * avec des messages d'erreur en français et intégration monitoring.
 */

import { NextFunction, Request, Response } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { metricsService } from '../monitoring/metrics';

/**
 * Interface pour les erreurs de validation formatées
 */
interface ValidationError {
  field: string;
  message: string;
  code: string;
  received?: any;
}

/**
 * Messages d'erreur personnalisés en français
 */
const customErrorMessages = {
  required_error: "Ce champ est obligatoire",
  invalid_type_error: "Type de données invalide",
  too_small: "Valeur trop petite ou trop courte",
  too_big: "Valeur trop grande ou trop longue",
  invalid_string: "Format de chaîne invalide",
  invalid_email: "L'adresse email n'est pas valide",
  invalid_url: "L'URL n'est pas valide",
  invalid_date: "Date invalide",
  invalid_enum_value: "Valeur non autorisée",
  unrecognized_keys: "Champs non autorisés détectés",
  custom: "Validation personnalisée échouée"
};

/**
 * Traduit les erreurs Zod en messages français compréhensibles
 */
function translateZodError(error: z.ZodIssue): ValidationError {
  const field = error.path.join('.');
  let message = customErrorMessages.custom;

  switch (error.code) {
    case 'invalid_type':
      if ((error as any).received === 'undefined') {
        message = customErrorMessages.required_error;
      } else {
        message = `Attendu ${(error as any).expected}, reçu ${(error as any).received}`;
      }
      break;
    
    case 'too_small':
      if ((error as any).type === 'string') {
        message = `Minimum ${(error as any).minimum} caractères requis`;
      } else if ((error as any).type === 'number') {
        message = `Valeur minimum: ${(error as any).minimum}`;
      } else if ((error as any).type === 'array') {
        message = `Minimum ${(error as any).minimum} éléments requis`;
      }
      break;
    
    case 'too_big':
      if ((error as any).type === 'string') {
        message = `Maximum ${(error as any).maximum} caractères autorisés`;
      } else if ((error as any).type === 'number') {
        message = `Valeur maximum: ${(error as any).maximum}`;
      } else if ((error as any).type === 'array') {
        message = `Maximum ${(error as any).maximum} éléments autorisés`;
      }
      break;
    
    case 'invalid_string':
      if ((error as any).validation === 'email') {
        message = customErrorMessages.invalid_email;
      } else if ((error as any).validation === 'url') {
        message = customErrorMessages.invalid_url;
      } else if ((error as any).validation === 'regex') {
        message = "Format invalide";
      }
      break;
    
    case 'invalid_date':
      message = customErrorMessages.invalid_date;
      break;
    
    case 'invalid_enum_value':
      message = `Valeur autorisée: ${(error as any).options.join(', ')}`;
      break;
    
    case 'unrecognized_keys':
      message = `Champs non autorisés: ${(error as any).keys.join(', ')}`;
      break;
    
    default:
      message = error.message || customErrorMessages.custom;
  }

  return {
    field,
    message,
    code: error.code,
    received: error.code === 'invalid_type' ? error.received : undefined
  };
}

/**
 * Configuration du middleware de validation
 */
interface ValidationConfig {
  /** Valider le body de la requête */
  body?: ZodSchema;
  /** Valider les paramètres de route */
  params?: ZodSchema;
  /** Valider les query parameters */
  query?: ZodSchema;
  /** Nom du schéma pour les métriques */
  schemaName?: string;
  /** Validation stricte (rejeter les champs supplémentaires) */
  strict?: boolean;
}

/**
 * Middleware principal de validation
 * 
 * @param config Configuration de validation
 * @returns Middleware Express
 */
export const validateRequest = (config: ValidationConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const schemaName = config.schemaName || 'unknown';
    
    try {
      // Validation du body
      if (config.body) {
        req.body = await config.body.parseAsync(req.body);
      }
      
      // Validation des paramètres
      if (config.params) {
        req.params = await config.params.parseAsync(req.params);
      }
      
      // Validation des query parameters
      if (config.query) {
        req.query = await config.query.parseAsync(req.query);
      }
      
      // Métriques de succès
      const duration = Date.now() - startTime;
      recordValidationMetrics(schemaName, true, duration);
      
      next();
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof ZodError) {
        // Traduction des erreurs Zod
        const validationErrors = error.issues.map(translateZodError);
        
        // Métriques d'échec
        recordValidationMetrics(schemaName, false, duration, validationErrors.length);
        
        // Déterminer le type de validation basé sur la configuration
        let validationType: 'body' | 'params' | 'query' = 'body';
        if (config.params) validationType = 'params';
        else if (config.query) validationType = 'query';
        
        // Enregistrer la métrique de validation avec OpenTelemetry
        metricsService.incrementValidationError(req.originalUrl || req.path, validationType);
        
        // Incrémenter le compteur OpenTelemetry si disponible
        try {
          if (global.telemetryMetrics?.validationErrorsCounter) {
            global.telemetryMetrics.validationErrorsCounter.add(1, {
              route: req.originalUrl || req.path,
              type: validationType,
              schema: schemaName
            });
          }
        } catch (telemetryError) {
          // Ne pas faire échouer la validation pour un problème de télémétrie
          console.warn('Erreur lors de l\'enregistrement des métriques OpenTelemetry:', telemetryError);
        }
        
        return res.status(400).json({
          success: false,
          message: "Données de requête invalides",
          errors: validationErrors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Autres erreurs
      recordValidationMetrics(schemaName, false, duration, 1);
      console.error('Erreur de validation inattendue:', error);
      
      return res.status(500).json({
        success: false,
        message: "Erreur interne de validation",
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Raccourci pour valider uniquement le body
 */
export const validateBody = (schema: ZodSchema, schemaName?: string) => {
  return validateRequest({ body: schema, schemaName });
};

/**
 * Raccourci pour valider uniquement les paramètres
 */
export const validateParams = (schema: ZodSchema, schemaName?: string) => {
  return validateRequest({ params: schema, schemaName });
};

/**
 * Raccourci pour valider uniquement les query parameters
 */
export const validateQuery = (schema: ZodSchema, schemaName?: string) => {
  return validateRequest({ query: schema, schemaName });
};

/**
 * Enregistrement des métriques de validation
 */
function recordValidationMetrics(
  schemaName: string, 
  success: boolean, 
  duration: number, 
  errorCount: number = 0
) {
  try {
    // Intégration avec le système de monitoring existant
    if (metricsService) {
      // Enregistrer les métriques de performance de validation
      console.log(`📊 Validation ${schemaName}: ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)${errorCount > 0 ? ` - ${errorCount} erreurs` : ''}`);
    }
  } catch (error) {
    // Ne pas faire échouer la validation pour un problème de métriques
    console.warn('Erreur lors de l\'enregistrement des métriques de validation:', error);
  }
}

/**
 * Helper pour créer des schémas avec validation MongoDB ObjectId
 */
export const createObjectIdSchema = (fieldName: string = 'id') => {
  return z.string()
    .regex(/^[0-9a-fA-F]{24}$/, `${fieldName} doit être un ObjectId MongoDB valide`)
    .transform(str => str.toLowerCase());
};

/**
 * Helper pour validation d'email normalisée
 */
export const createEmailSchema = () => {
  return z.string()
    .email("L'adresse email n'est pas valide")
    .min(5, "L'email doit contenir au moins 5 caractères")
    .max(254, "L'email ne peut pas dépasser 254 caractères")
    .transform(email => email.toLowerCase().trim());
};

/**
 * Helper pour validation de mot de passe fort
 */
export const createPasswordSchema = () => {
  return z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Le mot de passe doit contenir au moins: 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial"
    );
};

/**
 * Helper pour validation de téléphone français
 */
export const createPhoneSchema = () => {
  return z.string()
    .regex(
      /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/,
      "Numéro de téléphone français invalide (format: +33XXXXXXXXX ou 0XXXXXXXXX)"
    )
    .transform(phone => phone.replace(/\s/g, ''));
};

export default validateRequest;