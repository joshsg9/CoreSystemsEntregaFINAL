// src/components/ReviewsSection/ReviewsSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../../services/authService';
import {
  getReviewsByProduct,
  getUserReview,
  upsertReview,
  deleteReview,
  type Review,
} from '../../services/reviewService';
import styles from './ReviewsSection.module.css';

interface Props {
  productId: string;
}

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`${styles.starBtn} ${n <= (hovered || value) ? styles.starActive : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
};

const StarDisplay: React.FC<{ value: number; size?: number }> = ({ value, size = 14 }) => (
  <span style={{ fontSize: size, color: '#f5a623', letterSpacing: 1 }}>
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
);

const Avatar: React.FC<{ name: string; url?: string | null }> = ({ name, url }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  if (url) return <img src={url} alt={name} className={styles.avatar} />;
  return <div className={styles.avatarInitials}>{initials}</div>;
};

const ReviewsSection: React.FC<Props> = ({ productId }) => {
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [myReview, setMyReview]       = useState<Review | null>(null);
  const [userId, setUserId]           = useState<string | null>(null);
  const [userName, setUserName]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [editing, setEditing]         = useState(false);

  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [allReviews, user] = await Promise.all([
      getReviewsByProduct(productId),
      getCurrentUser(),
    ]);
    setReviews(allReviews);
    if (user) {
      setUserId(user.id);
      setUserName(user.name || user.email);
      const mine = await getUserReview(productId, user.id);
      setMyReview(mine);
      if (mine) { setRating(mine.rating); setComment(mine.comment); }
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (comment.trim().length < 5) { setError('El comentario debe tener al menos 5 caracteres.'); return; }

    setSubmitting(true);
    setError(null);
    const result = await upsertReview(productId, userId, rating, comment.trim());
    setSubmitting(false);

    if (!result.success) { setError(result.error ?? 'Error al guardar.'); return; }

    setSuccess(true);
    setEditing(false);
    setTimeout(() => setSuccess(false), 2500);
    load();
  };

  const handleDelete = async () => {
    if (!userId || !myReview) return;
    if (!confirm('¿Eliminar tu reseña?')) return;
    await deleteReview(productId, userId);
    setMyReview(null);
    setRating(5);
    setComment('');
    load();
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const otherReviews = reviews.filter(r => r.user_id !== userId);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Reseñas</h2>
        {avg && (
          <div className={styles.avgBlock}>
            <span className={styles.avgNum}>{avg}</span>
            <StarDisplay value={Math.round(Number(avg))} size={16} />
            <span className={styles.avgCount}>({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
          </div>
        )}
      </div>

      {/* ── Mi reseña ── */}
      {userId && (
        <div className={styles.myReviewBlock}>
          {myReview && !editing ? (
            <div className={styles.myReviewCard}>
              <div className={styles.reviewCardTop}>
                <Avatar name={userName} />
                <div>
                  <p className={styles.reviewerName}>Tú</p>
                  <StarDisplay value={myReview.rating} />
                </div>
                <div className={styles.myReviewActions}>
                  <button className={styles.editBtn} onClick={() => setEditing(true)}>Editar</button>
                  <button className={styles.deleteBtn} onClick={handleDelete}>Eliminar</button>
                </div>
              </div>
              <p className={styles.reviewComment}>{myReview.comment}</p>
              {success && <p className={styles.successMsg}>✓ Reseña guardada</p>}
            </div>
          ) : !myReview || editing ? (
            <form className={styles.form} onSubmit={handleSubmit}>
              <p className={styles.formTitle}>{myReview ? 'Editar reseña' : 'Escribe una reseña'}</p>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                className={styles.textarea}
                placeholder="Cuéntanos tu experiencia con este producto..."
                value={comment}
                onChange={e => { setComment(e.target.value); setError(null); }}
                rows={3}
                maxLength={500}
              />
              {error && <p className={styles.errorMsg}>{error}</p>}
              <div className={styles.formActions}>
                {editing && (
                  <button type="button" className={styles.cancelBtn} onClick={() => { setEditing(false); setComment(myReview?.comment ?? ''); setRating(myReview?.rating ?? 5); }}>
                    Cancelar
                  </button>
                )}
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Guardando...' : myReview ? 'Actualizar' : 'Publicar reseña'}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {!userId && (
        <p className={styles.loginHint}>
          <a href="/login">Inicia sesión</a> para dejar una reseña.
        </p>
      )}

      {/* ── Otras reseñas ── */}
      {loading ? (
        <p className={styles.loadingText}>Cargando reseñas...</p>
      ) : otherReviews.length === 0 && !myReview ? (
        <p className={styles.emptyText}>Aún no hay reseñas. ¡Sé el primero!</p>
      ) : (
        <div className={styles.list}>
          {otherReviews.map(r => {
            const name = r.profiles?.full_name || r.profiles?.email || 'Usuario';
            const date = new Date(r.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
            return (
              <div key={r.id} className={styles.reviewCard}>
                <div className={styles.reviewCardTop}>
                  <Avatar name={name} url={r.profiles?.avatar_url} />
                  <div>
                    <p className={styles.reviewerName}>{name}</p>
                    <div className={styles.reviewMeta}>
                      <StarDisplay value={r.rating} />
                      <span className={styles.reviewDate}>{date}</span>
                    </div>
                  </div>
                </div>
                <p className={styles.reviewComment}>{r.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ReviewsSection;