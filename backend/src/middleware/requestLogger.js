/**
 * middleware/requestLogger.js
 * Log chaque requête HTTP en JSON vers stdout.
 * Collecté automatiquement par Kubernetes / ELK / Loki.
 */

const logger = require('../logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]('requête HTTP', {
      method:      req.method,
      endpoint:    req.originalUrl,
      status:      res.statusCode,
      duration_ms: duration,
    });
  });

  next();
}

module.exports = requestLogger;
