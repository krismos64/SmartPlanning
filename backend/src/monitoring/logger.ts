import winston from 'winston';
import { getTracer } from './telemetry';

// Configuration du logger avec corrélation de traces
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const tracer = getTracer();
      const span = tracer.startSpan('log_entry');
      
      const traceData = {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId,
      };
      
      span.end();
      
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...traceData,
        ...meta,
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Logs structurés pour différents contextes
export const authLogger = logger.child({ component: 'auth' });
export const aiLogger = logger.child({ component: 'ai' });
export const dbLogger = logger.child({ component: 'database' });
export const apiLogger = logger.child({ component: 'api' });
export const securityLogger = logger.child({ component: 'security' });

// Types pour les logs structurés
interface LogContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  success?: boolean;
  error?: Error;
  metadata?: Record<string, any>;
}

// Fonctions utilitaires pour les logs contextuels
export const logAuthEvent = (event: string, context: LogContext) => {
  authLogger.info(event, {
    userId: context.userId,
    sessionId: context.sessionId,
    success: context.success,
    duration: context.duration,
    metadata: context.metadata,
  });
};

export const logAIEvent = (event: string, context: LogContext) => {
  aiLogger.info(event, {
    userId: context.userId,
    operation: context.operation,
    duration: context.duration,
    success: context.success,
    metadata: context.metadata,
  });
};

export const logDBEvent = (event: string, context: LogContext) => {
  dbLogger.info(event, {
    operation: context.operation,
    duration: context.duration,
    success: context.success,
    metadata: context.metadata,
  });
};

export const logSecurityEvent = (event: string, context: LogContext) => {
  securityLogger.warn(event, {
    userId: context.userId,
    sessionId: context.sessionId,
    metadata: context.metadata,
  });
};

export const logError = (error: Error, context: LogContext) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    userId: context.userId,
    operation: context.operation,
    metadata: context.metadata,
  });
};

// Middleware pour logs de requêtes
export const requestLoggerMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  apiLogger.info('Request started', {
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    apiLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      contentLength: res.get('content-length'),
    });
  });
  
  next();
};

export default logger;