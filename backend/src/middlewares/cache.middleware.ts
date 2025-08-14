/**
 * Middleware de Cache pour les API SmartPlanning
 * 
 * Fournit des middlewares automatiques pour mettre en cache
 * les réponses API les plus fréquentes et réduire la charge MongoDB.
 */

import { Request, Response, NextFunction } from 'express';
import { cacheService, CacheKeyType, CacheHelpers } from '../services/cache.service';
import { AuthRequest } from './auth.middleware';

/**
 * Options de configuration du cache pour un middleware
 */
interface CacheMiddlewareOptions {
  keyType: CacheKeyType;
  keyGenerator: (req: Request) => string;
  ttl?: number;
  skipCache?: (req: Request) => boolean;
  onHit?: (key: string) => void;
  onMiss?: (key: string) => void;
}

/**
 * Middleware générique de cache
 */
export function cacheMiddleware(options: CacheMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si le cache est disponible
    if (!cacheService.isAvailable()) {
      return next();
    }

    // Vérifier si on doit ignorer le cache pour cette requête
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    // Générer la clé de cache
    const cacheKey = options.keyGenerator(req);
    
    try {
      // Tenter de récupérer depuis le cache
      const cachedData = await cacheService.get(options.keyType, cacheKey);
      
      if (cachedData) {
        // Cache HIT - retourner les données mises en cache
        if (options.onHit) options.onHit(cacheKey);
        
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheTimestamp: new Date().toISOString()
        });
      }

      // Cache MISS - continuer vers le contrôleur
      if (options.onMiss) options.onMiss(cacheKey);

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(body) {
        // Mettre en cache seulement les réponses de succès
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          cacheService.set(
            options.keyType,
            cacheKey,
            body,
            options.ttl
          ).catch(error => {
            console.error('Erreur mise en cache:', error);
          });
        }

        // Appeler la méthode json originale
        return originalJson.call(this, body);
      };

      next();

    } catch (error) {
      console.error('Erreur middleware cache:', error);
      next(); // Continuer sans cache en cas d'erreur
    }
  };
}

/**
 * Middleware de cache pour les plannings générés
 */
export const cachePlannings = cacheMiddleware({
  keyType: CacheKeyType.PLANNING_GENERATED,
  keyGenerator: (req) => {
    const { employeeId, year, weekNumber } = req.query;
    return CacheHelpers.planningKey(
      employeeId as string,
      parseInt(year as string),
      parseInt(weekNumber as string)
    );
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.PLANNING_GENERATED),
  skipCache: (req) => {
    // Ignorer le cache pour les requêtes POST/PUT/DELETE
    return req.method !== 'GET';
  }
});

/**
 * Middleware de cache pour les employés par équipe
 */
export const cacheEmployeesByTeam = cacheMiddleware({
  keyType: CacheKeyType.EMPLOYEES_BY_TEAM,
  keyGenerator: (req) => {
    const { teamId } = req.params;
    return CacheHelpers.teamEmployeesKey(teamId);
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.EMPLOYEES_BY_TEAM),
  skipCache: (req) => req.method !== 'GET'
});

/**
 * Middleware de cache pour les employés par entreprise
 */
export const cacheEmployeesByCompany = cacheMiddleware({
  keyType: CacheKeyType.EMPLOYEES_BY_COMPANY,
  keyGenerator: (req: AuthRequest) => {
    // Utiliser l'ID de l'entreprise de l'utilisateur connecté
    const companyId = req.user?.companyId || req.params.companyId;
    return CacheHelpers.companyEmployeesKey(companyId);
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.EMPLOYEES_BY_COMPANY),
  skipCache: (req) => req.method !== 'GET'
});

/**
 * Middleware de cache pour les statistiques d'entreprise
 */
export const cacheCompanyStats = cacheMiddleware({
  keyType: CacheKeyType.COMPANY_STATS,
  keyGenerator: (req: AuthRequest) => {
    const companyId = req.user?.companyId || req.params.companyId;
    return companyId;
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.COMPANY_STATS),
  skipCache: (req) => req.method !== 'GET'
});

/**
 * Middleware de cache pour les permissions utilisateur
 */
export const cacheUserPermissions = cacheMiddleware({
  keyType: CacheKeyType.USER_PERMISSIONS,
  keyGenerator: (req: AuthRequest) => {
    return CacheHelpers.userPermissionsKey(req.user?.id || req.user?._id);
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.USER_PERMISSIONS),
  skipCache: (req) => req.method !== 'GET'
});

/**
 * Middleware de cache pour les membres d'équipe
 */
export const cacheTeamMembers = cacheMiddleware({
  keyType: CacheKeyType.TEAM_MEMBERS,
  keyGenerator: (req) => {
    const { teamId } = req.params;
    return teamId;
  },
  ttl: CacheHelpers.getTTL(CacheKeyType.TEAM_MEMBERS),
  skipCache: (req) => req.method !== 'GET'
});

/**
 * Middleware pour invalider automatiquement le cache après modifications
 */
export function invalidateCache(cacheKeys: {
  type: CacheKeyType;
  keyGenerator: (req: Request) => string;
}[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Intercepter la réponse pour invalider le cache après succès
    const originalJson = res.json;
    res.json = function(body) {
      // Invalider le cache seulement pour les opérations de succès
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheKeys.forEach(async ({ type, keyGenerator }) => {
          try {
            const key = keyGenerator(req);
            await cacheService.delete(type, key);
          } catch (error) {
            console.error('Erreur invalidation cache:', error);
          }
        });
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Middleware pour invalider le cache des plannings après modification
 */
export const invalidatePlanningCache = invalidateCache([
  {
    type: CacheKeyType.PLANNING_GENERATED,
    keyGenerator: (req) => {
      const employeeId = req.body?.employeeId || req.params?.employeeId;
      return `${employeeId}:*`; // Invalide tous les plannings de l'employé
    }
  }
]);

/**
 * Middleware pour invalider le cache des employés après modification
 */
export const invalidateEmployeeCache = invalidateCache([
  {
    type: CacheKeyType.EMPLOYEES_BY_TEAM,
    keyGenerator: (req) => req.body?.teamId || req.params?.teamId || '*'
  },
  {
    type: CacheKeyType.EMPLOYEES_BY_COMPANY,
    keyGenerator: (req) => req.body?.companyId || req.params?.companyId || '*'
  }
]);

/**
 * Middleware pour vider complètement le cache (admin seulement)
 */
export const flushCache = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const flushed = await cacheService.flush();
    
    if (flushed) {
      res.json({
        success: true,
        message: 'Cache vidé avec succès'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage du cache'
      });
    }

  } catch (error) {
    console.error('Erreur vidage cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du vidage du cache'
    });
  }
};

/**
 * Endpoint pour obtenir les statistiques du cache
 */
export const getCacheStats = async (req: AuthRequest, res: Response) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Admin requis'
      });
    }

    const stats = await cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        smartplanning: {
          available: cacheService.isAvailable(),
          keyTypes: Object.values(CacheKeyType),
          defaultTtls: Object.fromEntries(
            Object.values(CacheKeyType).map(type => [
              type,
              CacheHelpers.getTTL(type)
            ])
          )
        }
      }
    });

  } catch (error) {
    console.error('Erreur stats cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};