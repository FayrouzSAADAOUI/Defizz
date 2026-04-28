import React from 'react';
import './ChallengeCard.css';

function ChallengeCard({ challenge, onSelect }) {
  const getDifficultyEmoji = (difficulty) => {
    const emojis = { 'facile': '⭐', 'moyen': '⭐⭐', 'difficile': '⭐⭐⭐' };
    return emojis[difficulty] || '';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { 'facile': '#10b981', 'moyen': '#f59e0b', 'difficile': '#ef4444' };
    return colors[difficulty] || '#6b7280';
  };

  const isExpired = new Date(challenge.deadline) < new Date();

  return (
    <div 
      className={`challenge-card ${isExpired ? 'expired' : ''}`}
      onClick={onSelect}
    >
      <div className="card-header">
        <h3>{challenge.title}</h3>
        <span 
          className="difficulty-badge"
          style={{ backgroundColor: getDifficultyColor(challenge.difficulty) }}
        >
          {getDifficultyEmoji(challenge.difficulty)}
        </span>
      </div>

      <p className="card-description">{challenge.description.substring(0, 100)}...</p>

      <div className="card-footer">
        <div className="card-meta">
          <span className="participants">👥 {challenge.participantCount || 0}</span>
          <span className="deadline">
            ⏰ {new Date(challenge.deadline).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <span className={`status ${isExpired ? 'expired' : 'active'}`}>
          {isExpired ? '❌ Expiré' : '✅ Actif'}
        </span>
      </div>
    </div>
  );
}

export default ChallengeCard;
