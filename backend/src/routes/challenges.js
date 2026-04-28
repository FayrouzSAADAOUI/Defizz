/**
 * routes/challenges.js
 *
 * Contrat de réponse aligné sur le frontend de Fayrouz :
 *
 * GET /api/challenges
 *   réponse : { challenges: [ { id, title, description, difficulty, deadline,
 *                               participantCount, completed, creator } ] }
 *
 * POST /api/challenges
 *   body    : { title, description, deadline, difficulty }
 *   réponse : { challenge: { id, ... } }
 *             ↑ NewChallenge.js fait navigate(`/challenges/${data.challenge.id}`)
 *
 * GET /api/challenges/:id
 *   réponse : { challenge: { id, title, description, difficulty, deadline,
 *                            completed, creator: { id, name } } }
 *
 * GET /api/challenges/:id/participants
 *   réponse : { participants: [ { id, userId, userName, completed } ] }
 *             ↑ ChallengeDetail.js fait p.userId === user.id et affiche p.userName
 *
 * GET /api/challenges/:id/comments
 *   réponse : { comments: [ { id, authorName, text, createdAt } ] }
 *             ↑ CommentSection.js affiche comment.authorName, comment.text, comment.createdAt
 *
 * POST /api/challenges/:id/comments
 *   body    : { text }   ← CommentSection.js envoie { text: newComment }
 *
 * POST /api/challenges/:id/join
 * POST /api/challenges/:id/complete
 */

const express   = require('express');
const { query } = require('../db');
const logger    = require('../logger');
const auth      = require('../middleware/auth');

const router = express.Router();

// ── GET /api/challenges ───────────────────────────────────────
// Home.js : setChallenges(data.challenges || [])
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.difficulty,
         c.deadline,
         c.created_at,
         u.id   AS creator_id,
         u.name AS creator_name,
         COUNT(DISTINCT p.id) AS "participantCount"
       FROM challenges c
       JOIN users u ON u.id = c.creator_id
       LEFT JOIN participants p ON p.challenge_id = c.id
       GROUP BY c.id, u.id
       ORDER BY c.created_at DESC`
    );

    const challenges = result.rows.map(row => ({
      id:             row.id,
      title:          row.title,
      description:    row.description,
      difficulty:     row.difficulty,
      deadline:       row.deadline,
      created_at:     row.created_at,
      participantCount: parseInt(row.participantCount),
      // ChallengeCard.js filtre sur c.completed — on calcule si la deadline est passée
      completed:      new Date(row.deadline) < new Date(),
      creator: {
        id:   row.creator_id,
        name: row.creator_name,
      },
    }));

    res.json({ challenges });
  } catch (err) {
    logger.error('erreur liste challenges', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/challenges ──────────────────────────────────────
// NewChallenge.js : navigate(`/challenges/${data.challenge.id}`)
router.post('/', auth, async (req, res) => {
  const { title, description, deadline, difficulty = 'moyen' } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ message: 'title, description et deadline sont requis' });
  }

  try {
    const result = await query(
      `INSERT INTO challenges (creator_id, title, description, difficulty, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title, description, difficulty, deadline]
    );
    const challenge = result.rows[0];

    // Le créateur rejoint automatiquement son propre défi
    await query(
      'INSERT INTO participants (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [challenge.id, req.user.id]
    );

    logger.info('défi créé', { challengeId: challenge.id, userId: req.user.id, title });

    res.status(201).json({ challenge });
  } catch (err) {
    logger.error('erreur création challenge', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/challenges/:id ───────────────────────────────────
// ChallengeDetail.js : setChallenge(challengeData.challenge)
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         c.*,
         u.id   AS creator_user_id,
         u.name AS creator_user_name,
         COUNT(DISTINCT p.id) AS "participantCount"
       FROM challenges c
       JOIN users u ON u.id = c.creator_id
       LEFT JOIN participants p ON p.challenge_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, u.id`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Défi non trouvé' });
    }

    const row = result.rows[0];
    const challenge = {
      id:          row.id,
      title:       row.title,
      description: row.description,
      difficulty:  row.difficulty,
      deadline:    row.deadline,
      created_at:  row.created_at,
      // ChallengeDetail.js affiche challenge.completed pour le statut
      completed:   new Date(row.deadline) < new Date(),
      participantCount: parseInt(row.participantCount),
      // ChallengeDetail.js : challenge.creator?.name
      creator: {
        id:   row.creator_user_id,
        name: row.creator_user_name,
      },
    };

    res.json({ challenge });
  } catch (err) {
    logger.error('erreur get challenge', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/challenges/:id/participants ──────────────────────
// ChallengeDetail.js :
//   setParticipants(participantsData.participants || [])
//   const userParticipant = participantsData.participants?.find(p => p.userId === user.id)
//   affiche p.userName
router.get('/:id/participants', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         p.id,
         u.id   AS "userId",
         u.name AS "userName",
         p.completed,
         p.joined_at
       FROM participants p
       JOIN users u ON u.id = p.user_id
       WHERE p.challenge_id = $1
       ORDER BY p.joined_at ASC`,
      [req.params.id]
    );

    res.json({ participants: result.rows });
  } catch (err) {
    logger.error('erreur participants', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/challenges/:id/join ─────────────────────────────
router.post('/:id/join', auth, async (req, res) => {
  try {
    await query(
      'INSERT INTO participants (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    logger.info('défi rejoint', { challengeId: req.params.id, userId: req.user.id });
    res.status(201).json({ message: 'Défi rejoint !' });
  } catch (err) {
    logger.error('erreur join', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/challenges/:id/complete ────────────────────────
router.post('/:id/complete', auth, async (req, res) => {
  try {
    // Doit avoir rejoint le défi d'abord
    const participant = await query(
      'SELECT id FROM participants WHERE challenge_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!participant.rows[0]) {
      return res.status(400).json({ message: 'Vous devez rejoindre le défi avant de le compléter' });
    }

    await query(
      'UPDATE participants SET completed = true WHERE challenge_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    logger.info('défi complété', { challengeId: req.params.id, userId: req.user.id });
    res.json({ message: 'Défi relevé ! 🎉' });
  } catch (err) {
    logger.error('erreur complete', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/challenges/:id/comments ─────────────────────────
// CommentSection.js :
//   setComments(data.comments || [])
//   affiche comment.authorName, comment.text, comment.createdAt
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT
         c.id,
         u.name      AS "authorName",
         c.text,
         c.created_at AS "createdAt"
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.challenge_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json({ comments: result.rows });
  } catch (err) {
    logger.error('erreur get comments', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/challenges/:id/comments ────────────────────────
// CommentSection.js : body: JSON.stringify({ text: newComment })
router.post('/:id/comments', auth, async (req, res) => {
  const { text } = req.body;  // ← le frontend envoie "text" (pas "content")

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
  }

  try {
    const result = await query(
      `INSERT INTO comments (challenge_id, user_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, text, created_at AS "createdAt"`,
      [req.params.id, req.user.id, text.trim()]
    );

    const comment = {
      ...result.rows[0],
      authorName: req.user.name,
    };

    logger.info('commentaire ajouté', { challengeId: req.params.id, userId: req.user.id });
    res.status(201).json({ comment });
  } catch (err) {
    logger.error('erreur post comment', { err: err.message });
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
