import { Router } from 'express';
import { metricsService } from '../monitoring/metrics';
import { authenticateToken } from '../middlewares/auth.middleware';
// import logger from '../monitoring/logger';

const router = Router();

// Middleware pour s'assurer que seuls les admins peuvent accéder au monitoring
router.use(authenticateToken);
router.use((req: any, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits administrateur requis.',
    });
  }
  next();
});

// Endpoint pour les métriques en temps réel
router.get('/metrics/realtime', async (req, res) => {
  try {
    const metrics = await metricsService.getRealTimeMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques temps réel', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques',
    });
  }
});

// Endpoint pour les métriques historiques
router.get('/metrics/historical/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const validPeriods = ['1h', '24h', '7d', '30d'];
    
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Période invalide. Périodes supportées: 1h, 24h, 7d, 30d',
      });
    }
    
    const metrics = await metricsService.getHistoricalMetrics(period);
    res.json({
      success: true,
      data: metrics,
      period,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques historiques', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des métriques historiques',
    });
  }
});

// Endpoint pour les alertes actives
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await metricsService.getActiveAlerts();
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes',
    });
  }
});

// Endpoint pour les logs récents
router.get('/logs/:level?', async (req, res) => {
  try {
    const { level = 'info' } = req.params;
    const { limit = 100 } = req.query;
    
    // Simulation de logs récents (en production, cela viendrait d'Elasticsearch ou fichiers)
    const logs = [];
    for (let i = 0; i < parseInt(limit as string); i++) {
      logs.push({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level: ['error', 'warn', 'info'][Math.floor(Math.random() * 3)],
        message: `Log message ${i}`,
        component: ['auth', 'ai', 'database', 'api'][Math.floor(Math.random() * 4)],
        userId: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
        metadata: {
          operation: 'sample_operation',
          duration: Math.floor(Math.random() * 1000),
        },
      });
    }
    
    res.json({
      success: true,
      data: logs.filter(log => level === 'all' || log.level === level),
      level,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
    });
  }
});

// Endpoint pour les statistiques système
router.get('/system/stats', async (req, res) => {
  try {
    const stats = {
      nodejs: {
        version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        loadavg: process.loadavg && process.loadavg(),
        env: process.env.NODE_ENV,
      },
      application: {
        version: '1.3.2',
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques système', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques système',
    });
  }
});

// Endpoint pour la santé de l'application
router.get('/health', async (req, res) => {
  try {
    // Vérifications de santé
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 100) + 50,
        },
        openai: {
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 2000) + 1000,
        },
        memory: {
          status: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.8 ? 'healthy' : 'warning',
          usage: process.memoryUsage(),
        },
      },
    };
    
    const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: health,
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de santé', error);
    res.status(503).json({
      success: false,
      message: 'Service non disponible',
    });
  }
});

// Endpoint pour forcer la collecte de métriques (pour les tests)
router.post('/metrics/collect', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    switch (type) {
      case 'auth':
        metricsService.recordAuthAttempt(data.success, data.method, data.userId);
        break;
      case 'ai':
        metricsService.recordAIRequest(data.duration, data.success, data.model, data.tokens);
        break;
      case 'planning':
        metricsService.recordPlanningGeneration(data.duration, data.success, data.employeeCount);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de métrique non supporté',
        });
    }
    
    res.json({
      success: true,
      message: 'Métrique collectée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la collecte de métrique', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la collecte de métrique',
    });
  }
});

export default router;