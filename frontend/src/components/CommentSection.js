import React, { useState, useEffect } from 'react';
import './CommentSection.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function CommentSection({ challengeId, user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [challengeId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/challenges/${challengeId}/comments`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }
      );

      if (!response.ok) throw new Error('Erreur de chargement');

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(
        `${API_URL}/api/challenges/${challengeId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ text: newComment })
        }
      );

      if (!response.ok) throw new Error('Erreur lors du commentaire');

      setNewComment('');
      fetchComments();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="comment-section">
      <h2>💬 Commentaires</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAddComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Partagez vos pensées, vos progrès, vos encouragements..."
          rows="3"
        />
        <button type="submit" className="btn-primary">
          Ajouter un commentaire
        </button>
      </form>

      <div className="comments-list">
        {loading ? (
          <p>Chargement des commentaires...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">Aucun commentaire pour le moment</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <strong className="comment-author">{comment.authorName}</strong>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;
