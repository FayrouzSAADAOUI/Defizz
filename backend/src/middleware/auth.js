/**
 * middleware/auth.js
 * Vérification JWT — 100% stateless.
 *
 * Le token contient toutes les infos user.
 * N'importe quel Pod peut vérifier n'importe quel token :
 * c'est ce qui rend le backend stateless et scalable.
 */

const jwt    = require('jsonwebtoken');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-changer-en-prod';

function auth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('auth échouée : token manquant', { endpoint: req.path });
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email }
    next();
  } catch (err) {
    logger.warn('auth échouée : token invalide', { endpoint: req.path, err: err.message });
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

module.exports = auth;
