import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Profile({ user }) {
  const [userStats, setUserStats] = useState(null);
  const [createdChallenges, setCreatedChallenges] = useState([]);
  const [participatedChallenges, setParticipatedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('created');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, [user.id]);

  const fetchUserProfile = async () => {
    try {
      const [statsRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${user.id}/stats`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/users/${user.id}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);

      if (!statsRes.ok || !userRes.ok) throw new Error('Erreur de chargement');

      const statsData = await statsRes.json();
      const userData = await userRes.json();

      setUserStats(statsData.stats);
      setCreatedChallenges(userData.user?.createdChallenges || []);
      setParticipatedChallenges(userData.user?.participatedChallenges || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Chargement du profil...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <div className="avatar">👤</div>
          <div className="user-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {userStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{userStats.completedChallenges || 0}</div>
            <div className="stat-label">Défis relevés</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.createdChallenges || 0}</div>
            <div className="stat-label">Défis créés</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.streak || 0}</div>
            <div className="stat-label">Streak 🔥</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{(userStats.successRate || 0).toFixed(1)}%</div>
            <div className="stat-label">Taux de réussite</div>
          </div>
        </div>
      )}

      <div className="profile-content">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'created' ? 'active' : ''}`}
            onClick={() => setActiveTab('created')}
          >
            Défis créés ({createdChallenges.length})
          </button>
          <button 
            className={`tab ${activeTab === 'participated' ? 'active' : ''}`}
            onClick={() => setActiveTab('participated')}
          >
            Défis relevés ({participatedChallenges.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'created' ? (
            <div className="challenges-list">
              {createdChallenges.length === 0 ? (
                <p className="empty-state">Vous n'avez pas encore créé de défi</p>
              ) : (
                createdChallenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className="challenge-row"
                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                  >
                    <div className="challenge-info">
                      <h3>{challenge.title}</h3>
                      <p>{new Date(challenge.deadline).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="participants">👥 {challenge.participantCount || 0}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="challenges-list">
              {participatedChallenges.length === 0 ? (
                <p className="empty-state">Vous n'avez pas encore relevé de défi</p>
              ) : (
                participatedChallenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className={`challenge-row ${challenge.completed ? 'completed' : ''}`}
                    onClick={() => navigate(`/challenges/${challenge.id}`)}
                  >
                    <div className="challenge-info">
                      <h3>{challenge.title}</h3>
                      <p>{new Date(challenge.deadline).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="status">
                      {challenge.completed ? '✅ Relevé' : '⏳ En cours'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
