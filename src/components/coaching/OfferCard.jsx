// Price, duration, renewal price and what the coaching includes. `children` is the action area.
import { Check, RefreshCw, Utensils, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatPrice, num } from '../../lib/format.js';

const INCLUDED = ['co.inc.program', 'co.inc.chat', 'co.inc.review', 'co.inc.changes', 'co.inc.support'];

/** `meal`: 'included' (a meal plan is part of it) | 'missing' (the athlete asked, none included) | undefined (not relevant). */
export default function OfferCard({ price, renewalPrice, durationDays, meal, children }) {
  const { t } = useApp();
  return (
    <section className="offer-card">
      <div className="offer-price">
        <b>{formatPrice(price, t)}</b>
        <small>{t('co.forDays', { n: num(durationDays) })}</small>
      </div>
      <p className="offer-renewal">
        <RefreshCw size={14} /> {t('co.renewalPrice', { price: formatPrice(renewalPrice, t), n: num(durationDays) })}
      </p>
      <ul className="offer-list">
        {INCLUDED.map((key) => (
          <li key={key}>
            <Check size={15} /> {t(key)}
          </li>
        ))}
        {meal === 'included' && <li><Utensils size={15} /> {t('co.inc.meal')}</li>}
        {meal === 'missing' && <li className="muted"><X size={15} /> {t('co.inc.mealMissing')}</li>}
      </ul>
      {children}
    </section>
  );
}
