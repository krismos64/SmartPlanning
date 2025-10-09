/**
 * Configuration Sentry - SmartPlanning v2.2.1
 * 
 * Monitoring erreurs production avec alertes intelligentes
 * Développé par Christophe Mostefaoui - 14 août 2025
 */

import * as Sentry from '@sentry/node';
// MIGRATION PostgreSQL: Profiling désactivé temporairement
// import { nodeProfilingIntegration } from '@sentry/profiling-node';

export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release: string;
  sampleRate: number;
  profilesSampleRate: number;
  beforeSend: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => Sentry.ErrorEvent | null;
}

/**
 * Initialisation Sentry selon environnement
 */
export const initSentry = (): void => {
  const environment = (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development';
  
  // Configuration selon environnement
  const config: SentryConfig = {
    dsn: process.env.SENTRY_DSN || '',
    environment,
    release: `smartplanning@${process.env.npm_package_version || '2.2.1'}`,
    sampleRate: environment === 'production' ? 0.1 : 1.0, // 10% production, 100% dev
    profilesSampleRate: environment === 'production' ? 0.05 : 0.0, // 5% production seulement
    beforeSend: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => {
      // Filtrer les erreurs non-critiques en production
      if (environment === 'production') {
        return filterProductionErrors(event);
      }
      return event;
    }
  };

  // Initialisation Sentry
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    sampleRate: config.sampleRate,
    profilesSampleRate: config.profilesSampleRate,
    beforeSend: config.beforeSend,
    
    // Intégrations spécialisées
    integrations: [
      // MIGRATION PostgreSQL: Profiling désactivé temporairement (module natif manquant)
      // nodeProfilingIntegration(),

      // Intégration Express automatique
      Sentry.httpIntegration(),

      // MIGRATION PostgreSQL: MongoDB supprimé
      // Sentry.mongooseIntegration(),
    ],
    
    // Configuration avancée
    tracesSampleRate: environment === 'production' ? 0.01 : 0.1,
    
    // Tags par défaut
    initialScope: {
      tags: {
        component: 'smartplanning-backend',
        version: '2.2.1',
        planning_engine: 'AdvancedSchedulingEngine'
      },
      level: 'info'
    }
  });

  console.log(`🛡️ Sentry initialisé - Environnement: ${environment}`);
};

/**
 * Filtrage erreurs production - Éviter spam
 */
const filterProductionErrors = (event: Sentry.ErrorEvent): Sentry.ErrorEvent | null => {
  // Ignorer certaines erreurs non-critiques
  const ignoredErrors = [
    'ECONNABORTED', // Timeouts réseau
    'ENOTFOUND', // DNS résolution
    'Request timeout',
    'Connection refused',
    'Invalid token', // Auth - normal behavior
    'ValidationError' // Zod validation - handled gracefully
  ];

  const errorMessage = event.exception?.values?.[0]?.value || event.message || '';
  
  if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
    return null; // Ignorer l'erreur
  }

  // Marquer erreurs critiques planning
  if (errorMessage.includes('generateSchedule') || errorMessage.includes('AdvancedSchedulingEngine')) {
    event.level = 'fatal';
    event.tags = {
      ...event.tags,
      critical: 'planning_engine',
      priority: 'P0'
    };
  }

  return event;
};

/**
 * Capture erreur avec contexte enrichi
 */
export const captureAdvancedError = (
  error: Error, 
  context: {
    userId?: string;
    companyId?: string;
    operation?: string;
    employeeCount?: number;
    weekNumber?: number;
    year?: number;
  }
): void => {
  Sentry.withScope(scope => {
    // Tags métier
    scope.setTags({
      operation: context.operation || 'unknown',
      has_user: !!context.userId,
      has_company: !!context.companyId,
      employee_count: context.employeeCount || 0
    });

    // Contexte métier
    scope.setContext('business_context', {
      userId: context.userId,
      companyId: context.companyId,
      employeeCount: context.employeeCount,
      planningWeek: context.weekNumber ? `${context.year}-W${context.weekNumber}` : undefined
    });

    // Niveau selon gravité
    if (context.operation === 'generateSchedule') {
      scope.setLevel('fatal'); // Planning = critique
    } else if (context.userId) {
      scope.setLevel('error'); // User impacté = erreur
    } else {
      scope.setLevel('warning'); // Système seulement = warning
    }

    Sentry.captureException(error);
  });
};

/**
 * Capture performance planification
 */
export const capturePlanningPerformance = (
  operation: string,
  duration: number,
  employeeCount: number,
  success: boolean
): void => {
  Sentry.addBreadcrumb({
    category: 'planning.performance',
    message: `${operation}: ${duration.toFixed(2)}ms for ${employeeCount} employees`,
    data: {
      duration_ms: duration,
      employee_count: employeeCount,
      success,
      performance_tier: duration < 5 ? 'excellent' : duration < 20 ? 'good' : 'slow'
    },
    level: success ? 'info' : 'error'
  });

  // Alert si performance dégradée
  if (success && duration > 100) { // >100ms = alerte
    Sentry.withScope(scope => {
      scope.setTag('performance_alert', 'slow_planning');
      scope.setLevel('warning');
      
      Sentry.captureMessage(`Planning generation slow: ${duration.toFixed(2)}ms for ${employeeCount} employees`, 'warning');
    });
  }
};

/**
 * Middleware Express Sentry
 */
export const sentryRequestHandler = Sentry.expressErrorHandler({
  shouldHandleError: (error: any) => {
    // Toujours capturer les erreurs 5xx
    return error.status >= 500;
  }
});

/**
 * Health check Sentry
 */
export const checkSentryHealth = (): boolean => {
  try {
    const client = Sentry.getClient();
    return !!client && !!client.getOptions().dsn;
  } catch {
    return false;
  }
};

/**
 * Export utilitaires
 */
export {
  Sentry,
  captureAdvancedError as captureError,
  capturePlanningPerformance as capturePerformance
};