/**
 * db/index.js
 * Pool de connexions PostgreSQL.
 *
 * Stateless : toute la config vient des variables d'environnement (12-factor).
 * Aucun état gardé en mémoire entre les requêtes.
 */

const { Pool } = require('pg');
const logger   = require('../logger');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'defizz',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => logger.debug('nouvelle connexion DB établie'));
pool.on('error',  (err) => logger.error('erreur pool DB', { err: err.message }));

async function query(text, params) {
  const start = Date.now();
  try {
    const result   = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('requête exécutée', { duration_ms: duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('échec requête', { query: text, err: err.message });
    throw err;
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT 1');
    logger.info('connexion base de données OK');
  } catch (err) {
    logger.error('impossible de se connecter à la BDD — arrêt', { err: err.message });
    process.exit(1);
  }
}

module.exports = { query, testConnection };
