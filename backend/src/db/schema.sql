-- ============================================================
-- Defizz — Schéma de base de données
-- Aligné sur le frontend de Fayrouz
-- Idempotent : safe à lancer à chaque démarrage de Pod
-- ============================================================

-- Utilisateurs
-- Note: on utilise "name" (et non "username") car le frontend
-- envoie { name } à l'inscription et attend data.user.name au login
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,  -- hash bcrypt
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- Défis
-- difficulty en français car le frontend envoie facile/moyen/difficile
CREATE TABLE IF NOT EXISTS challenges (
  id          SERIAL PRIMARY KEY,
  creator_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT         NOT NULL,
  difficulty  VARCHAR(20)  DEFAULT 'moyen'
                           CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
  deadline    TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Participants (qui a rejoint un défi)
CREATE TABLE IF NOT EXISTS participants (
  id           SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  completed    BOOLEAN DEFAULT FALSE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Commentaires
CREATE TABLE IF NOT EXISTS comments (
  id           SERIAL PRIMARY KEY,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  text         TEXT    NOT NULL,   -- champ "text" car le frontend envoie { text }
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_challenges_creator    ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_participants_challenge ON participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participants_user      ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_challenge     ON comments(challenge_id);
