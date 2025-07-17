/**
 * Gestionnaire d'erreurs unifié pour SmartPlanning
 * 
 * Centralise la gestion des erreurs avec intégration monitoring
 * et messages d'erreur cohérents.
 */

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { metricsService } from '../monitoring/metrics';

/**
 * Types d'erreurs personnalisées
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation métier
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', { field, ...details });
  }
}

/**
 * Erreur d'authentification
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentification requise') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Erreur d'autorisation
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Accès refusé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Erreur de ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(`${resource} non trouvé(e)`, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Erreur de conflit (ressource déjà existante)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Erreur de limite de taux (rate limiting)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de requêtes, veuillez réessayer plus tard') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Erreur de service externe
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'Service temporairement indisponible') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Interface pour la réponse d'erreur standardisée
 */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: any;
  details?: any;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * Gestionnaire d'erreurs principal
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let code = 'INTERNAL_ERROR';
  let errors: any = null;
  let details: any = null;

  // Logging de l'erreur
  console.error(`🚨 Erreur ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    user: (req as any).user?.id,
    timestamp: new Date().toISOString()
  });

  // Traitement selon le type d'erreur
  if (error instanceof AppError) {
    // Erreurs applicatives personnalisées
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = error.details;
  } 
  else if (error instanceof ZodError) {
    // Erreurs de validation Zod (au cas où elles échappent au middleware)
    statusCode = 400;
    message = 'Données de requête invalides';
    code = 'VALIDATION_ERROR';
    errors = error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
  else if (error.name === 'CastError') {
    // Erreur de cast MongoDB (ID invalide)
    statusCode = 400;
    message = 'Identifiant invalide';
    code = 'INVALID_ID';
  }
  else if (error.name === 'ValidationError') {
    // Erreur de validation Mongoose
    statusCode = 400;
    message = 'Erreur de validation des données';
    code = 'MONGOOSE_VALIDATION_ERROR';
    errors = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
  }
  else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // Erreurs MongoDB
    statusCode = 500;
    message = 'Erreur de base de données';
    code = 'DATABASE_ERROR';
    
    // Erreur de doublon (clé unique)
    if ((error as any).code === 11000) {
      statusCode = 409;
      message = 'Cette ressource existe déjà';
      code = 'DUPLICATE_KEY_ERROR';
      const field = Object.keys((error as any).keyValue || {})[0];
      details = { field };
    }
  }
  else if (error.name === 'JsonWebTokenError') {
    // Erreurs JWT
    statusCode = 401;
    message = 'Token d\'authentification invalide';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    // Token expiré
    statusCode = 401;
    message = 'Token d\'authentification expiré';
    code = 'EXPIRED_TOKEN';
  }
  else if (error.name === 'MulterError') {
    // Erreurs d'upload de fichier
    statusCode = 400;
    message = 'Erreur lors de l\'upload du fichier';
    code = 'UPLOAD_ERROR';
    
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      message = 'Fichier trop volumineux';
    } else if ((error as any).code === 'LIMIT_FILE_COUNT') {
      message = 'Trop de fichiers';
    }
  }

  // Masquer les détails sensibles en production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'Une erreur est survenue';
      details = null;
    }
  }

  // Métriques d'erreur
  recordErrorMetrics(req, statusCode, code);

  // Construction de la réponse
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Ajout conditionnel des champs
  if (errors) errorResponse.errors = errors;
  if (details) errorResponse.details = details;
  
  // Ajout d'un ID de requête pour le suivi
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'] as string;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Gestionnaire pour les routes non trouvées (404)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

/**
 * Wrapper pour les fonctions async pour capturer automatiquement les erreurs
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Enregistrement des métriques d'erreur
 */
function recordErrorMetrics(req: Request, statusCode: number, errorCode: string) {
  try {
    if (metricsService) {
      // Créer une erreur simulée pour les métriques
      const error = new Error(`${statusCode} - ${errorCode}`);
      metricsService.recordError(error, `${req.method} ${req.path}`, (req as any).user?.id);
    }
  } catch (metricError) {
    console.warn('Erreur lors de l\'enregistrement des métriques d\'erreur:', metricError);
  }
}

/**
 * Helper pour créer des erreurs de validation personnalisées
 */
export const createValidationError = (field: string, message: string, value?: any) => {
  return new ValidationError(message, field, { value });
};

/**
 * Helper pour vérifier si une erreur est opérationnelle
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};


export default errorHandler;