import React, { useState, useEffect } from 'react';
import './Footer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function Footer() {
  const [podName, setPodName] = useState('');

  useEffect(() => {
    fetchPodName();
  }, []);

  const fetchPodName = async () => {
    try {
      const response = await fetch(`${API_URL}/whoami`);
      if (response.ok) {
        const data = await response.json();
        setPodName(data.pod || data.hostname || 'unknown');
      }
    } catch (err) {
      // Silencieux si l'endpoint n'existe pas
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p>&copy; 2024 Defizz - Relevez les défis entre amis</p>
          {podName && (
            <p className="pod-info">
              🐳 Pod actif: <code>{podName}</code>
            </p>
          )}
        </div>
        <div className="footer-links">
          <a href="#privacy">Confidentialité</a>
          <a href="#terms">Conditions</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
