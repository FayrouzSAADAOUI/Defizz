import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout, apiHealth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {user ? (
          <>
            <Link to="/" className="navbar-logo">
              🎯 Defizz
            </Link>

            <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
              <Link to="/home" className="nav-link">
                🏠 Accueil
              </Link>
              <Link to="/dashboard" className="nav-link">
                📊 Dashboard
              </Link>
              <Link to="/leaderboard" className="nav-link">
                🏆 Classement
              </Link>
              <Link to="/profile" className="nav-link">
                👤 Profil
              </Link>
              <div className="nav-divider"></div>
              <span className="nav-user">
                👋 {user.name}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </div>

            <div className="navbar-actions">
              <button 
                className={`hamburger ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </>
        ) : (
          <Link to="/" className="navbar-logo navbar-center">
            🎯 Defizz
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
