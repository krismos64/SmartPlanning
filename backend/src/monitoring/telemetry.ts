import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { metrics, trace } from '@opentelemetry/api';

// Configuration de la ressource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'smartplanning-backend',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.3.2',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// Configuration des exportateurs
const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

const prometheusExporter = new PrometheusExporter({
  port: 9090,
  endpoint: '/metrics',
});

// Configuration du SDK
const sdk = new NodeSDK({
  resource,
  traceExporter: process.env.NODE_ENV === 'production' ? jaegerExporter : new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: prometheusExporter,
    exportIntervalMillis: 5000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Désactiver pour éviter le bruit
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        requestHook: (span, request) => {
          span.setAttributes({
            'http.request.body.size': request.headers['content-length'] || 0,
          });
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
    }),
  ],
});

// Initialisation du SDK
export const initTelemetry = () => {
  sdk.start();
  console.log('✅ OpenTelemetry initialisé avec succès');
  
  // Métriques personnalisées
  setupCustomMetrics();
};

// Configuration des métriques personnalisées
const setupCustomMetrics = () => {
  const meter = metrics.getMeter('smartplanning-metrics');
  
  // Métriques business
  const authCounter = meter.createCounter('auth_attempts_total', {
    description: 'Nombre total de tentatives d\'authentification',
  });
  
  const aiRequestCounter = meter.createCounter('ai_requests_total', {
    description: 'Nombre total de requêtes IA',
  });
  
  const aiRequestDuration = meter.createHistogram('ai_request_duration_seconds', {
    description: 'Durée des requêtes IA en secondes',
  });
  
  const planningGenerationCounter = meter.createCounter('planning_generations_total', {
    description: 'Nombre total de générations de planning',
  });
  
  const activeUsersGauge = meter.createUpDownCounter('active_users', {
    description: 'Nombre d\'utilisateurs actifs',
  });
  
  // Métriques de validation
  const validationErrorsCounter = meter.createCounter('validation_errors_total', {
    description: 'Nombre total d\'erreurs de validation Zod',
  });
  
  // Export des métriques pour utilisation dans l'application
  global.telemetryMetrics = {
    authCounter,
    aiRequestCounter,
    aiRequestDuration,
    planningGenerationCounter,
    activeUsersGauge,
    validationErrorsCounter,
  };
};

// Utilitaires pour les traces
export const getTracer = () => {
  return trace.getTracer('smartplanning-backend');
};

// Middleware pour tracer les requêtes
export const tracingMiddleware = (req: any, res: any, next: any) => {
  const tracer = getTracer();
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  span.setAttributes({
    'http.method': req.method,
    'http.url': req.url,
    'http.scheme': req.protocol,
    'http.host': req.get('host'),
    'user.id': req.user?.id || 'anonymous',
    'user.role': req.user?.role || 'none',
  });
  
  // Ajouter le span au contexte de la requête
  req.span = span;
  
  res.on('finish', () => {
    span.setAttributes({
      'http.status_code': res.statusCode,
      'http.response.size': res.get('content-length') || 0,
    });
    span.end();
  });
  
  next();
};

// Gestionnaire d'arrêt propre
export const shutdownTelemetry = async () => {
  await sdk.shutdown();
  console.log('🔌 OpenTelemetry arrêté proprement');
};

// Types pour les métriques
declare global {
  var telemetryMetrics: {
    authCounter: any;
    aiRequestCounter: any;
    aiRequestDuration: any;
    planningGenerationCounter: any;
    activeUsersGauge: any;
    validationErrorsCounter: any;
  };
}