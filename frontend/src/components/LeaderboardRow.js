import React from 'react';
import './LeaderboardRow.css';

function LeaderboardRow({ rank, user, isCurrentUser }) {
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="rank-col">
        <span className="medal">{getMedalEmoji(rank)}</span>
      </div>
      
      <div className="user-col">
        <div className="user-name">{user.userName}</div>
      </div>
      
      <div className="challenges-col">
        <span className="value">{user.completedChallenges || 0}</span>
      </div>
      
      <div className="streak-col">
        <span className={`streak ${user.streak > 0 ? 'active' : ''}`}>
          🔥 {user.streak || 0}
        </span>
      </div>
      
      <div className="rate-col">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${user.successRate || 0}%` }}
          ></div>
        </div>
        <span className="percentage">{(user.successRate || 0).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export default LeaderboardRow;
