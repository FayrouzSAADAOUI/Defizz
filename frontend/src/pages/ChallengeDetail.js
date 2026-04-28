import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import './ChallengeDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function ChallengeDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchChallengeDetail();
  }, [id]);

  const fetchChallengeDetail = async () => {
    try {
      const [challengeRes, participantsRes] = await Promise.all([
        fetch(`${API_URL}/api/challenges/${id}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }),
        fetch(`${API_URL}/api/challenges/${id}/participants`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
      ]);

      if (!challengeRes.ok || !participantsRes.ok) throw new Error('Erreur de chargement');

      const challengeData = await challengeRes.json();
      const participantsData = await participantsRes.json();

      setChallenge(challengeData.challenge);
      setParticipants(participantsData.participants || []);
      
      // Vérifier si l'utilisateur a déjà participé
      const userParticipant = participantsData.participants?.find(p => p.userId === user.id);
      setHasJoined(!!userParticipant);
      setIsCompleted(userParticipant?.completed || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    try {
      const response = await fetch(`${API_URL}/api/challenges/${id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Erreur lors de la participation');

      setHasJoined(true);
      fetchChallengeDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteChallenge = async () => {
    try {
      const response = await fetch(`${API_URL}/api/challenges/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Erreur lors de la validation');

      setIsCompleted(true);
      fetchChallengeDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!challenge) return <div className="error-message">Défi non trouvé</div>;

  const getDifficultyColor = (difficulty) => {
    const colors = { 'facile': '#10b981', 'moyen': '#f59e0b', 'difficile': '#ef4444' };
    return colors[difficulty] || '#6b7280';
  };

  return (
    <div className="challenge-detail-container">
      <button onClick={() => navigate('/home')} className="btn-back">← Retour</button>

      <div className="challenge-header">
        <h1>{challenge.title}</h1>
        <div className="challenge-meta">
          <span 
            className="difficulty-badge"
            style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
          >
            {challenge.difficulty}
          </span>
          <span className="participants-count">👥 {participants.length} participants</span>
        </div>
      </div>

      <div className="challenge-content">
        <div className="challenge-main">
          <section className="section">
            <h2>Description</h2>
            <p>{challenge.description}</p>
          </section>

          <section className="section">
            <h2>Informations</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Créateur:</strong> {challenge.creator?.name || 'Anonyme'}
              </div>
              <div className="info-item">
                <strong>Date limite:</strong> {new Date(challenge.deadline).toLocaleDateString('fr-FR')}
              </div>
              <div className="info-item">
                <strong>Statut:</strong> {challenge.completed ? '✅ Terminé' : '⏳ En cours'}
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Participants ({participants.length})</h2>
            <div className="participants-list">
              {participants.map(p => (
                <div key={p.id} className="participant-item">
                  <span className="participant-name">{p.userName}</span>
                  {p.completed && <span className="completed-badge">✅ Relevé</span>}
                </div>
              ))}
            </div>
          </section>

          <CommentSection challengeId={id} user={user} />
        </div>

        <aside className="challenge-sidebar">
          <div className="action-card">
            {!hasJoined ? (
              <button onClick={handleJoinChallenge} className="btn-primary btn-large">
                ➕ Rejoindre le défi
              </button>
            ) : (
              <button 
                onClick={handleCompleteChallenge} 
                disabled={isCompleted}
                className={`btn-primary btn-large ${isCompleted ? 'disabled' : ''}`}
              >
                {isCompleted ? '✅ Défi relevé' : '☑️ Marquer comme relevé'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ChallengeDetail;
