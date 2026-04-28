import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [ongoingChallenges, setOngoingChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, challengesRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/stats`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/challenges?status=ongoing`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);

      if (!statsRes.ok || !challengesRes.ok) throw new Error('Erreur de chargement');

      const statsData = await statsRes.json();
      const challengesData = await challengesRes.json();

      setStats(statsData.stats);
      setOngoingChallenges(challengesData.challenges?.slice(0, 5) || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMotivationalMessage = (streak) => {
    if (streak === 0) return "Commencez une série en relevant un défi! 🚀";
    if (streak < 3) return "Vous êtes lancé! 💪";
    if (streak < 7) return "Excellent travail! 🔥";
    return "Vous êtes une machine à défis! ⚡";
  };

  if (loading) return <div className="loading">Chargement du tableau de bord...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Mon Tableau de Bord</h1>
        <p className="welcome">Bienvenue {user.name} ! 👋</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <>
          <div className="stats-section">
            <div className="main-stat">
              <div className="stat-box primary">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <div className="stat-value">{stats.streak || 0}</div>
                  <div className="stat-label">Jour(s) de Streak</div>
                </div>
              </div>
              <p className="motivation">{getMotivationalMessage(stats.streak || 0)}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.completedChallenges || 0}</div>
                <div className="stat-label">Défis relevés</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">📈</div>
                <div className="stat-value">{(stats.successRate || 0).toFixed(1)}%</div>
                <div className="stat-label">Taux de réussite</div>
              </div>
              <div className="stat-box">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{stats.ranking || 'N/A'}</div>
                <div className="stat-label">Classement</div>
              </div>
            </div>
          </div>

          <div className="challenges-section">
            <div className="section-header">
              <h2>Défis en cours</h2>
              <button 
                onClick={() => navigate('/home')} 
                className="btn-secondary"
              >
                Voir tous les défis
              </button>
            </div>

            {ongoingChallenges.length === 0 ? (
              <div className="empty-state">
                <p>Aucun défi en cours. Commencez-en un ! 🎯</p>
                <button 
                  onClick={() => navigate('/home')} 
                  className="btn-primary"
                >
                  ➕ Rejoindre un défi
                </button>
              </div>
            ) : (
              <div className="ongoing-challenges">
                {ongoingChallenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className="challenge-mini-card"
                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                  >
                    <div className="challenge-title">{challenge.title}</div>
                    <div className="challenge-deadline">
                      ⏰ {new Date(challenge.deadline).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="challenge-difficulty">
                      Difficulté: {challenge.difficulty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="quick-actions">
            <h3>Actions rapides</h3>
            <div className="actions-grid">
              <button 
                onClick={() => navigate('/challenges/new')}
                className="action-btn"
              >
                ➕ Créer un défi
              </button>
              <button 
                onClick={() => navigate('/leaderboard')}
                className="action-btn"
              >
                🏆 Voir le classement
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="action-btn"
              >
                👤 Mon profil
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
