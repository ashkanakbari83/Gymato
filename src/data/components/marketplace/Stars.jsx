// Read-only star rating ("★★★★☆ 4.5 (12)") and the 1-5 star picker used in review forms.
import { useApp } from '../../context/AppContext.jsx';
import { decimal, num } from '../../lib/format.js';

const STAR = '★';

export function Stars({ value, count }) {
  const { t } = useApp();
  if (!count) return <span className="stars muted">{t('review.none')}</span>;
  return (
    <span className="stars" aria-label={t('review.ratingLabel', { n: decimal(value) })}>
      <span className="star-on">{STAR}</span> {decimal(value)} <span className="muted">({num(count)})</span>
    </span>
  );
}

export function RatingInput({ value, onChange }) {
  const { t } = useApp();
  return (
    <div className="rating-input" role="radiogroup" aria-label={t('review.rating')}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>
          {STAR}
        </button>
      ))}
    </div>
  );
}
