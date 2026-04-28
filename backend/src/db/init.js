const fs     = require('fs');
const path   = require('path');
const { query } = require('./index');
const logger    = require('../logger');

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await query(sql);
    logger.info('schéma base de données initialisé');
  } catch (err) {
    logger.error('échec initialisation schéma', { err: err.message });
    throw err;
  }
}

module.exports = { initDb };
