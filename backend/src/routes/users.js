/**
 * routes/users.js
 *
 * Contrat de réponse aligné sur le frontend de Fayrouz :
 *
 * POST /api/users/register
 *   body  : { name, email, password }
 *   réponse : 201 (redirige vers /login côté frontend, pas de token)
 *
 * POST /api/users/login
 *   body  : { email, password }
 *   réponse : { user: { id, name, email }, token }
 *             ↑ "name" car App.js fait localStorage.setItem('userName', userData.name)
 *
 * GET /api/users/:id
 *   réponse : { user: { id, name, email, createdChallenges: [], participatedChallenges: [] } }
 *
 * GET /api/users/:id/stats
 *   réponse : { stats: { completedChallenges, createdChallenges, streak, successRate, ranking } }
 */

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query } = require('../db');
const logger    = require('../logger');
const auth      = require('../middleware/auth');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-changer-en-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ── POST /api/users/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email et password sont requis' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hash]
    );
    logger.info('utilisateur inscrit', { name, email });
    res.status(201).json({ message: 'Inscription réussie' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Cet email est déjà utilisé' });
    }
    logger.error('échec inscription', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/users/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email et password sont requis' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user   = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn('login échoué : mauvais identifiants', { email });
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    logger.info('utilisateur connecté', { userId: user.id, name: user.name });

    // ⚠️ Réponse attendue par Login.js :
    // onLogin({ id: data.user.id, name: data.user.name, email: data.user.email, token: data.token })
    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    logger.error('erreur login', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────
// Attendu par Profile.js : { user: { id, name, email, createdChallenges, participatedChallenges } }
router.get('/:id', auth, async (req, res) => {
  try {
    const userRes = await query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const user = userRes.rows[0];

    // Défis créés
    const createdRes = await query(
      `SELECT c.id, c.title, c.deadline, c.difficulty,
              COUNT(DISTINCT p.id) AS "participantCount"
       FROM challenges c
       LEFT JOIN participants p ON p.challenge_id = c.id
       WHERE c.creator_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );

    // Défis rejoints (avec statut completed)
    const participatedRes = await query(
      `SELECT c.id, c.title, c.deadline, c.difficulty, p.completed
       FROM participants p
       JOIN challenges c ON c.id = p.challenge_id
       WHERE p.user_id = $1
       ORDER BY p.joined_at DESC`,
      [req.params.id]
    );

    res.json({
      user: {
        ...user,
        createdChallenges:     createdRes.rows,
        participatedChallenges: participatedRes.rows,
      },
    });
  } catch (err) {
    logger.error('erreur get user', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/users/:id/stats ──────────────────────────────────
// Attendu par Dashboard.js et Profile.js :
// { stats: { completedChallenges, createdChallenges, streak, successRate, ranking } }
router.get('/:id/stats', auth, async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    // Défis complétés
    const completedRes = await query(
      'SELECT COUNT(*) FROM participants WHERE user_id = $1 AND completed = true',
      [userId]
    );
    const completedChallenges = parseInt(completedRes.rows[0].count);

    // Défis rejoints (pour le taux de réussite)
    const joinedRes = await query(
      'SELECT COUNT(*) FROM participants WHERE user_id = $1',
      [userId]
    );
    const joined = parseInt(joinedRes.rows[0].count);

    // Défis créés
    const createdRes = await query(
      'SELECT COUNT(*) FROM challenges WHERE creator_id = $1',
      [userId]
    );
    const createdChallenges = parseInt(createdRes.rows[0].count);

    // Taux de réussite
    const successRate = joined > 0
      ? Math.round((completedChallenges / joined) * 100 * 10) / 10
      : 0;

    // Classement (position par nombre de défis complétés)
    const rankRes = await query(
      `SELECT COUNT(*) + 1 AS ranking
       FROM (
         SELECT user_id, COUNT(*) AS cnt
         FROM participants
         WHERE completed = true
         GROUP BY user_id
         HAVING COUNT(*) > (
           SELECT COUNT(*) FROM participants
           WHERE user_id = $1 AND completed = true
         )
       ) sub`,
      [userId]
    );
    const ranking = parseInt(rankRes.rows[0].ranking);

    // Streak : nombre de jours consécutifs avec au moins un défi complété
    // Simplifié : on compte les semaines actives récentes
    const streakRes = await query(
      `SELECT DATE(p.joined_at) AS day
       FROM participants p
       WHERE p.user_id = $1 AND p.completed = true
       ORDER BY day DESC`,
      [userId]
    );

    let streak = 0;
    const days = streakRes.rows.map(r => r.day?.toISOString().split('T')[0]);
    const today = new Date();
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (days[i] === expectedStr) streak++;
      else break;
    }

    logger.debug('stats calculées', { userId, completedChallenges, successRate, ranking });

    res.json({
      stats: {
        completedChallenges,
        createdChallenges,
        streak,
        successRate,
        ranking,
      },
    });
  } catch (err) {
    logger.error('erreur stats', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
