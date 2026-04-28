/**
 * logger.js
 * Logs JSON structurés vers stdout/stderr uniquement.
 * Cloud-native : aucun fichier local, aucun état.
 *
 * Config via env :
 *   LOG_LEVEL=debug|info|warn|error  (défaut: info)
 *
 * Exemple de sortie :
 *   {"timestamp":"2024-01-15T10:23:45.123Z","level":"info","message":"challenge created","pod":"backend-xyz","userId":1}
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const configuredLevel     = (process.env.LOG_LEVEL || 'info').toLowerCase();
const configuredLevelValue = LEVELS[configuredLevel] ?? LEVELS.info;

// En Kubernetes, HOSTNAME = nom du Pod automatiquement
const POD_NAME = process.env.HOSTNAME || 'local';
const NODE_ENV  = process.env.NODE_ENV  || 'development';

function log(level, message, extra = {}) {
  if (LEVELS[level] < configuredLevelValue) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    pod: POD_NAME,
    env: NODE_ENV,
    ...extra,
  };

  const output = JSON.stringify(entry);

  // errors → stderr, reste → stdout (bonne pratique Kubernetes)
  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  debug: (msg, extra) => log('debug', msg, extra),
  info:  (msg, extra) => log('info',  msg, extra),
  warn:  (msg, extra) => log('warn',  msg, extra),
  error: (msg, extra) => log('error', msg, extra),
  getLevel: () => configuredLevel,
};

module.exports = logger;
