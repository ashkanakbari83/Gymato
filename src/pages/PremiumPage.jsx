// Trainer: what the Featured (Premium) subscription gives, how the trainer's score is made, and the way to get it.
// Nothing here promises more than the app does: featured trainers form a labelled group at the top of their province
// list, and inside that group the score (not the payment) sets the order.
import { Crown, Check, ShoppingBag } from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getProvince, locationLabel } from '../data/locations.js';
import { PAYMENT_KIND, PREMIUM } from '../lib/constants.js';
import { decimal, formatDate, groupNumber, num } from '../lib/format.js';
import { PREMIUM_BENEFITS, canGoPremium, isPremium, premiumDaysLeft, premiumSlots, provinceStanding, trainerScore } from '../lib/premium.js';

const discountPercent = Math.round((1 - PREMIUM.price / PREMIUM.listPrice) * 100);

/** A card drawn only to compare: not a link, hidden from screen readers (the real list is the accessible one). */
function PreviewCard({ user, featured, label, t }) {
  return (
    <div className={`card trainer-card preview ${featured ? 'is-premium' : ''}`.trim()} aria-hidden="true">
      <Avatar user={user} size="lg" />
      <span className="trainer-main">
        <span className="trainer-name-row">
          <b>{user.name}</b>
          {featured && <span className="premium-badge"><Crown size={12} /> {t('premium.badge')}</span>}
        </span>
        <span className="trainer-meta-line"><span className="trainer-place">{label}</span></span>
      </span>
    </div>
  );
}

export default function PremiumPage() {
  const { db, user, isTrainer, go, openCheckout, lang, t } = useApp();
  if (!isTrainer) return <Empty icon={ShoppingBag} title={t('co.notFoundTitle')} text={t('co.notFoundText')} />; // trainer-only page

  const active = isPremium(user);
  const daysLeft = premiumDaysLeft(user);
  const can = canGoPremium(db, user);
  const slots = premiumSlots(db, user.province);
  const { score, parts } = trainerScore(db, user.id);
  const standing = user.province ? provinceStanding(db, user) : null;
  const weakest = [...parts].sort((a, b) => a.points / a.weight - b.points / b.weight)[0];
  const place = locationLabel(user.province, user.city, lang);
  const reasonText = !can.ok ? t(`premium.reason.${can.reason}`, { n: num(PREMIUM.renewWindowDays) }) : '';

  return (
    <div className="stack desk-grid">
      <section className="panel premium-hero">
        <span className="premium-crown" aria-hidden="true"><Crown size={22} /></span>
        <h1>{t('premium.hero')}</h1>
        <p className="muted">{t('premium.heroText')}</p>
        <p className="premium-price">
          <s>{groupNumber(PREMIUM.listPrice)}</s> <b>{groupNumber(PREMIUM.price)}</b> {t('common.currency')} <span>{t('premium.price')}</span>
          <Badge tone="ok">{t('premium.discount', { n: num(discountPercent) })}</Badge>
        </p>
        <p className={active ? 'premium-status on' : 'premium-status'} role="status">
          {active ? t('premium.statusActive', { date: formatDate(user.premium.until), n: num(daysLeft) }) : t('premium.statusOff')}
        </p>
        {user.province && (
          <p className="muted">
            {t('premium.slots', { province: lang === 'fa' ? getProvince(user.province)?.fa : getProvince(user.province)?.en })}: <b>{t('premium.slotsLeft', { left: num(slots.left), total: num(slots.total) })}</b>
          </p>
        )}
        <button className="btn wide" disabled={!can.ok} onClick={() => openCheckout(PAYMENT_KIND.PREMIUM, user.id)}>
          <Crown size={16} /> {t(active ? 'premium.renew' : 'premium.subscribe')}
        </button>
        {!can.ok && <p className="muted">{reasonText}</p>}
        {can.reason === 'no_province' && <button className="btn ghost wide" onClick={() => go('profile')}>{t('premium.goProfile')}</button>}
        <p className="muted">{t('premium.note')}</p>
      </section>

      <section className="panel half">
        <h2 className="panel-title">{t('premium.benefits')}</h2>
        <ul className="check-list">
          {PREMIUM_BENEFITS.map((id) => (
            <li key={id}><Check size={16} aria-hidden="true" /> {t(`premium.${id}`)}</li>
          ))}
        </ul>
        <p className="note-box">{t('premium.honest')}</p>
      </section>

      <section className="panel half">
        <h2 className="panel-title">{t('premium.compare')}</h2>
        <div className="stack">
          <b className="muted">{t('premium.regular')}</b>
          <PreviewCard user={user} featured={false} label={place || t('premium.cardPreviewBio')} t={t} />
          <b className="muted">{t('premium.featured')}</b>
          <PreviewCard user={user} featured label={place || t('premium.cardPreviewBio')} t={t} />
        </div>
      </section>

      <section className="panel half">
        <h2 className="panel-title">{t('premium.scoreTitle')}: {decimal(score)} <small className="muted">{t('premium.scoreOf')}</small></h2>
        <ul className="score-list">
          {parts.map((part) => (
            <li key={part.id}>
              <span>{t(`premium.part.${part.id}`)}</span>
              <span className="score-bar" aria-hidden="true"><i style={{ width: `${Math.round((part.points / part.weight) * 100)}%` }} /></span>
              <b>{t('premium.partOf', { points: decimal(part.points), max: num(part.weight) })}</b>
            </li>
          ))}
        </ul>
        <p className="muted">{t(`premium.tip.${weakest.id}`)}</p>
        {standing && <p><b>{t('premium.standing')}:</b> {t('premium.standingText', { rank: num(standing.featuredRank), total: num(standing.featuredCount) })}</p>}
      </section>
    </div>
  );
}
