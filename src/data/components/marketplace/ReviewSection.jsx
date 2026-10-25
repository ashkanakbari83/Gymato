// Reviews of a target (a program or a coaching relationship): the list, plus the form when the viewer is
// allowed to review it (they must have actually used it).
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { reviewBlocker } from '../../lib/domain/engagement.js';
import { formatDate } from '../../lib/format.js';
import { TextArea } from '../ui/Field.jsx';
import { RatingInput, Stars } from './Stars.jsx';

export function ReviewList({ reviews }) {
  const { db, t } = useApp();
  if (!reviews.length) return <p className="muted">{t('review.empty')}</p>;
  return (
    <div className="list">
      {reviews.map((review) => (
        <div className="review" key={review.id}>
          <div className="review-head">
            <b>{db.users.find((u) => u.id === review.athleteId)?.name}</b>
            <Stars value={review.rating} count={1} />
          </div>
          {review.text && <p>{review.text}</p>}
          <small className="muted">
            {t(`review.target.${review.targetKind}`)} · {formatDate(review.updatedAt, { month: 'short', day: 'numeric' })}
          </small>
        </div>
      ))}
    </div>
  );
}

/** Review form for one target. Prefilled with the athlete's earlier review so they can edit it. */
export function ReviewForm({ targetKind, targetId }) {
  const { db, user, postReview, t } = useApp();
  const mine = db.reviews.find((r) => r.athleteId === user.id && r.targetKind === targetKind && r.targetId === targetId);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [text, setText] = useState(mine?.text ?? '');
  const [errors, setErrors] = useState({});
  useEffect(() => { setRating(mine?.rating ?? 0); setText(mine?.text ?? ''); }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (reviewBlocker(db, user.id, targetKind, targetId)) return <p className="muted">{t('review.onlyAfterUse')}</p>;

  const submit = () => {
    const result = postReview({ targetKind, targetId, rating, text });
    setErrors(result.ok ? {} : result.fields ?? {});
  };

  return (
    <div className="form-stack review-form">
      <b>{t(mine ? 'review.edit' : 'review.write')}</b>
      <RatingInput value={rating} onChange={setRating} />
      {errors.rating && <small className="field-error">{t('field.required')}</small>}
      <TextArea label={t('review.comment')} value={text} onChange={setText} maxLength={600} />
      <button className="btn" onClick={submit}>{t('review.submit')}</button>
    </div>
  );
}
