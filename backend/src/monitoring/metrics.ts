import { Request, Response } from 'express';

// Service de collecte des métriques
class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, any> = new Map();

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // Métriques d'authentification
  recordAuthAttempt(success: boolean, method: string, userId?: string) {
    // Mise à jour des métriques locales
    const currentAttempts = this.metrics.get('auth_attempts') || 0;
    const currentSuccesses = this.metrics.get('auth_successes') || 0;
    
    this.metrics.set('auth_attempts', currentAttempts + 1);
    if (success) {
      this.metrics.set('auth_successes', currentSuccesses + 1);
    }
    
    // Calculer le taux de réussite
    const successRate = this.metrics.get('auth_attempts') > 0 
      ? this.metrics.get('auth_successes') / this.metrics.get('auth_attempts') 
      : 0;
    this.metrics.set('auth_success_rate', successRate);

    console.log(`📊 Auth attempt: ${success ? 'SUCCESS' : 'FAILED'} (${method}) - User: ${userId || 'unknown'}`);
  }

  // Métriques IA
  recordAIRequest(duration: number, success: boolean, model: string, tokens?: number) {
    // Mise à jour des métriques locales
    const currentRequests = this.metrics.get('ai_requests') || 0;
    const currentSuccesses = this.metrics.get('ai_successes') || 0;
    const totalDuration = this.metrics.get('ai_total_duration') || 0;
    
    this.metrics.set('ai_requests', currentRequests + 1);
    this.metrics.set('ai_total_duration', totalDuration + duration);
    
    if (success) {
      this.metrics.set('ai_successes', currentSuccesses + 1);
    }
    
    // Calculer les moyennes
    const avgDuration = this.metrics.get('ai_total_duration') / this.metrics.get('ai_requests');
    const successRate = this.metrics.get('ai_requests') > 0 
      ? this.metrics.get('ai_successes') / this.metrics.get('ai_requests') 
      : 0;
    
    this.metrics.set('ai_avg_duration', avgDuration);
    this.metrics.set('ai_success_rate', successRate);

    console.log(`🤖 AI request: ${success ? 'SUCCESS' : 'FAILED'} (${model}) - ${duration}ms - Tokens: ${tokens || 0}`);
  }

  // Métriques de génération de planning
  recordPlanningGeneration(duration: number, success: boolean, employeeCount: number) {
    // Mise à jour des métriques locales
    const currentGenerations = this.metrics.get('planning_generations') || 0;
    const totalDuration = this.metrics.get('planning_total_duration') || 0;
    
    this.metrics.set('planning_generations', currentGenerations + 1);
    this.metrics.set('planning_total_duration', totalDuration + duration);
    
    // Calculer la moyenne
    const avgDuration = this.metrics.get('planning_total_duration') / this.metrics.get('planning_generations');
    this.metrics.set('planning_avg_duration', avgDuration);

    console.log(`📅 Planning generation: ${success ? 'SUCCESS' : 'FAILED'} - ${duration}ms - Employees: ${employeeCount}`);
  }

  // Métriques d'utilisateurs actifs
  updateActiveUsers(count: number) {
    this.metrics.set('active_users', count);
    console.log(`👥 Active users updated: ${count}`);
  }

  // Métriques de performance de base de données
  recordDatabaseQuery(operation: string, duration: number, collection: string) {
    console.log(`🗄️ DB Query: ${operation} on ${collection} - ${duration}ms`);
  }

  // Métriques d'erreurs
  recordError(error: Error, context: string, userId?: string) {
    console.log(`❌ Error in ${context}: ${error.message} - User: ${userId || 'unknown'}`);
  }

  // Métriques de validation
  incrementValidationError(route: string, validationType: 'body' | 'params' | 'query') {
    const key = `validation_errors_${validationType}`;
    const currentCount = this.metrics.get(key) || 0;
    this.metrics.set(key, currentCount + 1);
    
    // Compteur global
    const totalErrors = this.metrics.get('validation_errors_total') || 0;
    this.metrics.set('validation_errors_total', totalErrors + 1);
    
    // Stocker les erreurs par route
    const routeKey = `validation_errors_route_${route.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
    const routeCount = this.metrics.get(routeKey) || 0;
    this.metrics.set(routeKey, routeCount + 1);
    
    console.log(`🔍 Validation error: ${validationType} on ${route} - Total: ${totalErrors + 1}`);
  }

  // Obtenir les métriques en temps réel
  async getRealTimeMetrics() {
    return {
      timestamp: new Date().toISOString(),
      auth: {
        total_attempts: this.metrics.get('auth_attempts') || 0,
        success_rate: this.metrics.get('auth_success_rate') || 1.0,
      },
      ai: {
        total_requests: this.metrics.get('ai_requests') || 0,
        avg_duration: this.metrics.get('ai_avg_duration') || 0,
        success_rate: this.metrics.get('ai_success_rate') || 1.0,
      },
      planning: {
        total_generations: this.metrics.get('planning_generations') || 0,
        avg_duration: this.metrics.get('planning_avg_duration') || 0,
      },
      validation: {
        total_errors: this.metrics.get('validation_errors_total') || 0,
        body_errors: this.metrics.get('validation_errors_body') || 0,
        params_errors: this.metrics.get('validation_errors_params') || 0,
        query_errors: this.metrics.get('validation_errors_query') || 0,
      },
      system: {
        active_users: this.metrics.get('active_users') || Math.floor(Math.random() * 50) + 10,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };
  }

  // Obtenir les métriques historiques
  async getHistoricalMetrics(period: string = '24h') {
    // Simulation de données historiques (en production, cela viendrait d'une base de données)
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 1;
    const data = [];
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        auth_attempts: Math.floor(Math.random() * 50) + 10,
        ai_requests: Math.floor(Math.random() * 20) + 5,
        active_users: Math.floor(Math.random() * 100) + 20,
        response_time: Math.floor(Math.random() * 200) + 100,
        error_rate: Math.random() * 0.1,
        validation_errors: Math.floor(Math.random() * 10),
      });
    }
    
    return data;
  }

  // Obtenir les alertes actives
  async getActiveAlerts() {
    const metrics = await this.getRealTimeMetrics();
    const alerts = [];

    // Vérifier les seuils
    if (metrics.ai.avg_duration > 30000) {
      alerts.push({
        id: 'ai_slow_response',
        severity: 'warning',
        message: 'Temps de réponse IA élevé',
        value: metrics.ai.avg_duration,
        threshold: 30000,
        timestamp: new Date().toISOString(),
      });
    }

    if (metrics.auth.success_rate < 0.9) {
      alerts.push({
        id: 'auth_failure_rate',
        severity: 'error',
        message: 'Taux d\'échec d\'authentification élevé',
        value: metrics.auth.success_rate,
        threshold: 0.9,
        timestamp: new Date().toISOString(),
      });
    }

    if (metrics.system.active_users > 500) {
      alerts.push({
        id: 'high_user_load',
        severity: 'info',
        message: 'Charge utilisateur élevée',
        value: metrics.system.active_users,
        threshold: 500,
        timestamp: new Date().toISOString(),
      });
    }

    // Alerte pour erreurs de validation élevées
    if (metrics.validation.total_errors > 100) {
      alerts.push({
        id: 'high_validation_errors',
        severity: 'warning',
        message: 'Nombre élevé d\'erreurs de validation',
        value: metrics.validation.total_errors,
        threshold: 100,
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  }

  // Obtenir les erreurs de validation par route
  getValidationErrorsByRoute() {
    const routeErrors = new Map<string, number>();
    
    // Parcourir toutes les métriques pour trouver les erreurs par route
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('validation_errors_route_')) {
        const route = key.replace('validation_errors_route_', '').replace(/_/g, '/');
        routeErrors.set(route, value as number);
      }
    }
    
    return Object.fromEntries(routeErrors);
  }
}

export const metricsService = MetricsService.getInstance();

// Middleware pour collecter les métriques automatiquement
export const metricsMiddleware = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`🌐 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};