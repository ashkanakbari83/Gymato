// One coaching relationship in a list. Opens the coaching sheet.
// The athlete sees a simple row; the trainer sees a small client card: who, what they want, and one line that says what
// needs doing (a new request, a payment on its way, days left on a running subscription). Nothing wraps to a second line.
import { CalendarDays, Clock, Repeat, Wallet } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { DAY_MS, PHASE } from '../../lib/constants.js';
import { formatDate, formatPrice, num } from '../../lib/format.js';
import { daysLeft } from '../../lib/marketplace.js';
import { ArrowForward } from '../ui/Arrow.jsx';
import { PhaseBadge } from '../marketplace/Badges.jsx';

const TONE = { [PHASE.PENDING]: 'warn', [PHASE.PREPARING]: 'info', [PHASE.AWAITING_PAYMENT]: 'warn', [PHASE.ACTIVE]: 'ok', [PHASE.EXPIRED]: 'danger' };

/** One short fact with a small icon. */
function Fact({ icon: Icon, children, tone }) {
  return <span className={tone ? `cc-fact ${tone}` : 'cc-fact'}><Icon size={13} aria-hidden="true" /> <span>{children}</span></span>;
}

function ClientCard({ item }) {
  const { openModal, t } = useApp();
  const { request, phase, athlete, subscription } = item;
  const form = request.form ?? {};
  const goal = form.goal ? t(`goal.${form.goal}`) : '';
  const level = form.level ? t(`level.${form.level}`) : '';
  const left = phase === PHASE.ACTIVE && subscription ? daysLeft(subscription) : 0;
  const total = subscription?.durationDays || 30;
  const ago = Math.max(0, Math.floor((Date.now() - new Date(request.createdAt)) / DAY_MS));
  const renewals = subscription?.renewalCount ?? 0;

  let foot = null;
  if (phase === PHASE.ACTIVE) {
    foot = (
      <>
        <span className="cc-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.max(4, Math.round(((total - left) / total) * 100)))}%` }} /></span>
        <Fact icon={Clock} tone={left <= 7 ? 'warn' : ''}>{t('co.daysLeft', { n: num(left) })}</Fact>
        {renewals > 0 && <Fact icon={Repeat}>{t('client.renewals', { n: num(renewals) })}</Fact>}
      </>
    );
  } else if (phase === PHASE.EXPIRED && subscription) {
    foot = (
      <>
        <Fact icon={CalendarDays}>{t('co.endedOn', { date: formatDate(subscription.endAt, { month: 'short', day: 'numeric' }) })}</Fact>
        {renewals > 0 && <Fact icon={Repeat}>{t('client.renewals', { n: num(renewals) })}</Fact>}
      </>
    );
  } else if (phase === PHASE.AWAITING_PAYMENT) {
    foot = (
      <>
        {subscription?.price > 0 && <Fact icon={Wallet}>{formatPrice(subscription.price, t)}</Fact>}
        <Fact icon={Clock}>{ago ? t('client.ago', { n: num(ago) }) : t('client.today')}</Fact>
      </>
    );
  } else {
    foot = (
      <>
        <Fact icon={Clock}>{ago ? t('client.ago', { n: num(ago) }) : t('client.today')}</Fact>
        {form.daysPerWeek ? <Fact icon={CalendarDays}>{t('gp.daysPerWeek', { n: num(form.daysPerWeek) })}</Fact> : null}
      </>
    );
  }

  return (
    <button className={`client-card is-${phase}`} onClick={() => openModal({ type: 'coaching', requestId: request.id })}>
      <Avatar user={athlete} />
      <span className="cc-main">
        <b>{athlete.name}</b>
        <small>{[goal, level].filter(Boolean).join(' · ') || t('client.noGoal')}</small>
      </span>
      <Badge tone={TONE[phase] ?? 'neutral'}>{t(`client.phase.${phase}`)}</Badge>
      <span className="cc-foot">{foot}</span>
    </button>
  );
}

export default function CoachingRow({ item }) {
  const { user, openModal, t } = useApp();
  const { request, phase, athlete, trainer, subscription } = item;
  if (user.id === request.trainerId) return <ClientCard item={item} />;
  const other = trainer;

  let detail = formatDate(request.createdAt, { month: 'short', day: 'numeric' });
  if (phase === 'active') detail = t('co.daysLeft', { n: num(daysLeft(subscription)) });
  if (phase === 'expired') detail = t('co.endedOn', { date: formatDate(subscription.endAt, { month: 'short', day: 'numeric' }) });

  return (
    <button className="row" onClick={() => openModal({ type: 'coaching', requestId: request.id })}>
      <Avatar user={other} />
      <span className="row-main">
        <b>{other.name}</b>
        <small>{detail}</small>
      </span>
      <PhaseBadge phase={phase} />
      <ArrowForward size={16} />
    </button>
  );
}
