/**
 * index.js — Defizz Backend
 *
 * Design cloud-native / Kubernetes :
 *  ✅ Config 100% via variables d'environnement
 *  ✅ Logs JSON vers stdout/stderr uniquement
 *  ✅ Aucune session serveur — JWT stateless
 *  ✅ Aucun fichier local
 *  ✅ /health  → liveness + readiness probe
 *  ✅ /whoami  → démo load balancing (montre le nom du Pod)
 *  ✅ /crash   → démo auto-healing Kubernetes
 *  ✅ SIGTERM  → graceful shutdown
 */

const express       = require('express');
const cors          = require('cors');
const logger        = require('./logger');
const requestLogger = require('./middleware/requestLogger');
const { testConnection } = require('./db');
const { initDb }         = require('./db/init');

const usersRouter      = require('./routes/users');
const challengesRouter = require('./routes/challenges');
const leaderboardRouter = require('./routes/leaderboard');

const app      = express();
const PORT     = process.env.PORT || 4000;
const POD_NAME = process.env.HOSTNAME || 'local';

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ─── Routes système (démo Kubernetes) ────────────────────────

/**
 * GET /health
 * Utilisé par les liveness et readiness probes Kubernetes.
 * App.js du frontend appelle aussi cette route au démarrage.
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    pod:       POD_NAME,
    timestamp: new Date().toISOString(),
    log_level: logger.getLevel(),
  });
});

/**
 * GET /whoami
 * Retourne le nom du Pod — démo de load balancing.
 * En appelant cette route plusieurs fois, on voit des pods différents répondre.
 *
 * Demo :
 *   for i in {1..6}; do curl http://defizz.local/whoami | jq .pod; done
 */
app.get('/whoami', (req, res) => {
  logger.info('whoami appelé', { pod: POD_NAME });
  res.json({
    pod:            POD_NAME,
    message:        `Réponse du Pod ${POD_NAME}`,
    timestamp:      new Date().toISOString(),
    node_version:   process.version,
    log_level:      logger.getLevel(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

/**
 * GET /crash
 * Crash délibéré du processus.
 * Demo : Kubernetes détecte le crash et recrée le Pod automatiquement.
 *
 * Observer en direct :
 *   kubectl get pods -n defizz -w
 */
app.get('/crash', (req, res) => {
  logger.warn('endpoint /crash appelé — le processus va s\'arrêter dans 1s', { pod: POD_NAME });
  res.json({ message: 'Crash dans 1 seconde... Regardez kubectl get pods -w' });
  setTimeout(() => {
    logger.error('crash délibéré déclenché', { pod: POD_NAME });
    process.exit(1);
  }, 1000);
});

// ─── Routes API ───────────────────────────────────────────────
app.use('/api/users',        usersRouter);
app.use('/api/challenges',   challengesRouter);
app.use('/api/leaderboard',  leaderboardRouter);

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  logger.warn('route non trouvée', { method: req.method, path: req.path });
  res.status(404).json({ message: 'Route non trouvée' });
});

// ─── Gestion des erreurs globales ────────────────────────────
app.use((err, req, res, next) => {
  logger.error('erreur non gérée', { err: err.message, endpoint: req.path });
  res.status(500).json({ message: 'Erreur serveur interne' });
});

// ─── Démarrage ────────────────────────────────────────────────
async function start() {
  logger.info('démarrage Defizz backend', {
    pod:       POD_NAME,
    port:      PORT,
    log_level: logger.getLevel(),
    node_env:  process.env.NODE_ENV || 'development',
  });

  await testConnection();
  await initDb();

  app.listen(PORT, () => {
    logger.info('serveur en écoute', { port: PORT, pod: POD_NAME });
  });
}

// Graceful shutdown (SIGTERM envoyé par Kubernetes avant d'arrêter le Pod)
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu — arrêt propre', { pod: POD_NAME });
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('exception non catchée', { err: err.message });
  process.exit(1);
});

start();
