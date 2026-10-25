// One coaching relationship in a list, for the athlete or the trainer. Opens the coaching sheet.
import { useApp } from '../../context/AppContext.jsx';
import { formatDate, num } from '../../lib/format.js';
import { daysLeft } from '../../lib/marketplace.js';
import { ArrowForward } from '../ui/Arrow.jsx';
import { PhaseBadge } from '../marketplace/Badges.jsx';

export default function CoachingRow({ item }) {
  const { user, openModal, t } = useApp();
  const { request, phase, athlete, trainer, subscription } = item;
  const other = user.id === request.trainerId ? athlete : trainer;

  let detail = formatDate(request.createdAt, { month: 'short', day: 'numeric' });
  if (phase === 'active') detail = t('co.daysLeft', { n: num(daysLeft(subscription)) });
  if (phase === 'expired') detail = t('co.endedOn', { date: formatDate(subscription.endAt, { month: 'short', day: 'numeric' }) });

  return (
    <button className="row" onClick={() => openModal({ type: 'coaching', requestId: request.id })}>
      <span className="avatar">{other.name[0]}</span>
      <span className="row-main">
        <b>{other.name}</b>
        <small>{detail}</small>
      </span>
      <PhaseBadge phase={phase} />
      <ArrowForward size={16} />
    </button>
  );
}
