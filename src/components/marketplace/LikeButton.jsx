// Heart with the like count. Athletes can toggle; everyone else (trainers) just sees the number.
import { Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { hasLiked, likeCount } from '../../lib/analytics.js';
import { num } from '../../lib/format.js';

export default function LikeButton({ programId }) {
  const { db, user, likeProgram, t } = useApp();
  const liked = hasLiked(db, user.id, programId);
  const count = likeCount(db, programId);
  const canLike = user.role === 'athlete';

  return (
    <button className={`like-btn ${liked ? 'on' : ''}`} disabled={!canLike} onClick={() => likeProgram(programId)} aria-pressed={liked} aria-label={t('like.label')}>
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> {num(count)}
    </button>
  );
}
