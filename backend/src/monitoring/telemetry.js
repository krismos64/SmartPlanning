// Correction du problème d'import - version CommonJS compatible
module.exports = {
  tracingMiddleware: (req, res, next) => {
    // Middleware simplifié pour compatibilité
    next();
  },
  metricsMiddleware: (req, res, next) => {
    // Middleware simplifié pour compatibilité
    next();
  }
};