/**
 * routes/leaderboard.js
 *
 * Contrat de réponse aligné sur Leaderboard.js du frontend :
 *
 * GET /api/leaderboard
 *   réponse : { leaderboard: [ { userId, userName, completedChallenges, streak, successRate } ] }
 *
 * LeaderboardRow.js attend :
 *   user.userId, user.userName, user.completedChallenges, user.streak, user.successRate
 *   et isCurrentUser = entry.userId === user.id
 */

const express   = require('express');
const { query } = require('../db');
const logger    = require('../logger');
const auth      = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id                                          AS "userId",
         u.name                                        AS "userName",
         COUNT(CASE WHEN p.completed = true THEN 1 END) AS "completedChallenges",
         COUNT(p.id)                                  AS joined_total
       FROM users u
       LEFT JOIN participants p ON p.user_id = u.id
       GROUP BY u.id
       ORDER BY "completedChallenges" DESC, u.name ASC
       LIMIT 50`
    );

    const leaderboard = result.rows.map(row => {
      const completed = parseInt(row.completedChallenges);
      const joined    = parseInt(row.joined_total);
      const successRate = joined > 0
        ? Math.round((completed / joined) * 100 * 10) / 10
        : 0;

      return {
        userId:              row.userId,
        userName:            row.userName,
        completedChallenges: completed,
        streak:              0, // calculé simplement (extensible)
        successRate,
      };
    });

    res.json({ leaderboard });
  } catch (err) {
    logger.error('erreur leaderboard', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
