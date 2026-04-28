import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChallengeForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function NewChallenge({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    difficulty: 'moyen'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du défi');
      }

      const data = await response.json();
      navigate(`/challenges/${data.challenge.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>🚀 Créer un défi</h1>
        
        <form onSubmit={handleSubmit} className="challenge-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="title">Titre du défi</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Ex: Courir 5km en moins de 30 min"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Décrivez les règles et l'objectif du défi..."
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Date limite</label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulté</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value="facile">⭐ Facile</option>
              <option value="moyen">⭐⭐ Moyen</option>
              <option value="difficile">⭐⭐⭐ Difficile</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Création...' : 'Créer le défi'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/home')} 
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewChallenge;
