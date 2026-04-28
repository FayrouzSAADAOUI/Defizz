import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeCard from '../components/ChallengeCard';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Home({ user }) {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ongoing, completed
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`${API_URL}/api/challenges`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      setChallenges(data.challenges || []);
      applyFilter(data.challenges || [], filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (challengeList, filterType) => {
    const now = new Date();
    let filtered = challengeList;

    if (filterType === 'ongoing') {
      filtered = challengeList.filter(c => new Date(c.deadline) > now && !c.completed);
    } else if (filterType === 'completed') {
      filtered = challengeList.filter(c => c.completed);
    }

    setFilteredChallenges(filtered);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilter(challenges, newFilter);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>🎯 Défis Publics</h1>
        <button onClick={() => navigate('/challenges/new')} className="btn-secondary">
          ➕ Créer un défi
        </button>
      </div>

      <div className="filter-section">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          Tous les défis
        </button>
        <button 
          className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
          onClick={() => handleFilterChange('ongoing')}
        >
          En cours
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilterChange('completed')}
        >
          Terminés
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Chargement des défis...</div>
      ) : filteredChallenges.length === 0 ? (
        <div className="no-challenges">
          <p>Aucun défi trouvé pour ce filtre</p>
        </div>
      ) : (
        <div className="challenges-grid">
          {filteredChallenges.map(challenge => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge}
              onSelect={() => navigate(`/challenges/${challenge.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
