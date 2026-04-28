import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NewChallenge from './pages/NewChallenge';
import ChallengeDetail from './pages/ChallengeDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (token && userId) {
      setUser({ id: userId, name: userName, token });
    }

    fetch(`${API_URL}/health`)
      .then(res => res.ok && setApiHealth(true))
      .catch(() => setApiHealth(false))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userName', userData.name);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
  };

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes — plein écran, sans layout */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />

        {/* App routes — avec navbar + main-content */}
        <Route path="*" element={
          <div className="app">
            {user && (
              <nav className="navbar">
                <div className="navbar-container">
                  <div className="nav-menu">
                    <a href="/home" className="nav-link">🏠 Accueil</a>
                    <a href="/dashboard" className="nav-link">📊 Dashboard</a>
                    <a href="/leaderboard" className="nav-link">🏆 Classement</a>
                    <a href="/profile" className="nav-link">👤 Profil</a>
                  </div>
                  <div className="nav-right">
                    <span className="nav-user">👋 {user.name}</span>
                    <button
                      onClick={() => { handleLogout(); window.location.href = '/login'; }}
                      className="btn-logout"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </nav>
            )}
            <main className="main-content">
              <Routes>
                <Route path="/home" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard user={user} /></ProtectedRoute>} />
                <Route path="/challenges/new" element={<ProtectedRoute><NewChallenge user={user} /></ProtectedRoute>} />
                <Route path="/challenges/:id" element={<ProtectedRoute><ChallengeDetail user={user} /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard user={user} /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile user={user} /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
