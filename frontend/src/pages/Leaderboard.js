import React, { useState, useEffect } from 'react';
import LeaderboardRow from '../components/LeaderboardRow';
import './Leaderboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Leaderboard({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Classement Global</h1>
        <p className="subtitle">Top des défis relevés</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Chargement du classement...</div>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-header-row">
            <div className="rank-col">Rang</div>
            <div className="user-col">Utilisateur</div>
            <div className="challenges-col">Défis relevés</div>
            <div className="streak-col">Streak</div>
            <div className="rate-col">Taux de réussite</div>
          </div>

          <div className="leaderboard-body">
            {leaderboard.map((entry, index) => (
              <LeaderboardRow 
                key={entry.userId}
                rank={index + 1}
                user={entry}
                isCurrentUser={entry.userId === user.id}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && leaderboard.length === 0 && (
        <div className="no-data">
          <p>Aucun utilisateur pour le moment</p>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
