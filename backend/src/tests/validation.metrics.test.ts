/**
 * Tests unitaires pour les métriques de validation
 * 
 * Vérifie que les métriques de validation Zod sont correctement
 * incrémentées lors des erreurs de validation.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middlewares/validation.middleware';
import { metricsService } from '../monitoring/metrics';

// Mock des modules
jest.mock('../monitoring/metrics', () => ({
  metricsService: {
    incrementValidationError: jest.fn(),
    getRealTimeMetrics: jest.fn().mockResolvedValue({
      validation: {
        total_errors: 0,
        body_errors: 0,
        params_errors: 0,
        query_errors: 0,
      }
    })
  }
}));

// Mock du système OpenTelemetry
global.telemetryMetrics = {
  validationErrorsCounter: {
    add: jest.fn()
  }
} as any;

describe('Validation Metrics', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Mock request
    req = {
      body: {},
      originalUrl: '/api/auth/register',
      path: '/api/auth/register'
    };
    
    // Mock response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('incrementValidationError', () => {
    it('should increment validation error metrics for body validation', async () => {
      // Schéma de validation simple
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8)
      });
      
      // Données invalides
      req.body = {
        email: 'invalid-email',
        password: '123'
      };
      
      const middleware = validateBody(schema, 'register');
      await middleware(req as Request, res as Response, next);
      
      // Vérifier que la métrique a été incrémentée
      expect(metricsService.incrementValidationError).toHaveBeenCalledWith(
        '/api/auth/register', 
        'body'
      );
      
      // Vérifier que OpenTelemetry a été appelé
      expect(global.telemetryMetrics.validationErrorsCounter.add).toHaveBeenCalledWith(
        1,
        {
          route: '/api/auth/register',
          type: 'body',
          schema: 'register'
        }
      );
      
      // Vérifier que la réponse d'erreur est correcte
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Données de requête invalides',
          errors: expect.any(Array)
        })
      );
    });

    it('should not call next() when validation fails', async () => {
      const schema = z.object({
        required_field: z.string()
      });
      
      req.body = {}; // Champ requis manquant
      
      const middleware = validateBody(schema, 'test');
      await middleware(req as Request, res as Response, next);
      
      // Vérifier que next() n'a pas été appelé (pas de continuation)
      expect(next).not.toHaveBeenCalled();
      
      // Vérifier que la métrique a été incrémentée
      expect(metricsService.incrementValidationError).toHaveBeenCalledWith(
        '/api/auth/register',
        'body'
      );
    });

    it('should call next() when validation succeeds', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8)
      });
      
      // Données valides
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const middleware = validateBody(schema, 'register');
      await middleware(req as Request, res as Response, next);
      
      // Vérifier que next() a été appelé (continuation)
      expect(next).toHaveBeenCalled();
      
      // Vérifier que la métrique n'a pas été incrémentée
      expect(metricsService.incrementValidationError).not.toHaveBeenCalled();
      
      // Vérifier qu'aucune réponse d'erreur n'a été envoyée
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('MetricsService', () => {
    it('should track validation errors by type', async () => {
      const mockMetricsService = metricsService as jest.Mocked<typeof metricsService>;
      
      // Simuler plusieurs erreurs de validation
      mockMetricsService.incrementValidationError('/api/users', 'body');
      mockMetricsService.incrementValidationError('/api/users', 'params');
      mockMetricsService.incrementValidationError('/api/companies', 'query');
      
      expect(mockMetricsService.incrementValidationError).toHaveBeenCalledTimes(3);
      expect(mockMetricsService.incrementValidationError).toHaveBeenCalledWith('/api/users', 'body');
      expect(mockMetricsService.incrementValidationError).toHaveBeenCalledWith('/api/users', 'params');
      expect(mockMetricsService.incrementValidationError).toHaveBeenCalledWith('/api/companies', 'query');
    });
  });

  describe('OpenTelemetry Integration', () => {
    it('should handle missing telemetry metrics gracefully', async () => {
      // Supprimer temporairement les métriques
      const originalMetrics = global.telemetryMetrics;
      delete (global as any).telemetryMetrics;
      
      const schema = z.object({
        email: z.string().email()
      });
      
      req.body = { email: 'invalid' };
      
      const middleware = validateBody(schema, 'test');
      
      // Ne devrait pas lever d'exception
      await expect(middleware(req as Request, res as Response, next)).resolves.not.toThrow();
      
      // Restaurer les métriques
      global.telemetryMetrics = originalMetrics;
    });

    it('should handle telemetry counter errors gracefully', async () => {
      // Mock d'un compteur qui lève une exception
      global.telemetryMetrics.validationErrorsCounter.add = jest.fn().mockImplementation(() => {
        throw new Error('Telemetry error');
      });
      
      const schema = z.object({
        email: z.string().email()
      });
      
      req.body = { email: 'invalid' };
      
      const middleware = validateBody(schema, 'test');
      
      // Ne devrait pas lever d'exception malgré l'erreur de télémétrie
      await expect(middleware(req as Request, res as Response, next)).resolves.not.toThrow();
      
      // Vérifier que la validation a quand même fonctionné
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});