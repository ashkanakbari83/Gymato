// Badges that keep the two business models visually distinct everywhere.
import { PHASE, PROGRAM_KIND } from '../../lib/constants.js';
import { formatPrice } from '../../lib/format.js';
import { useApp } from '../../context/AppContext.jsx';
import Badge from '../ui/Badge.jsx';

const PHASE_TONE = {
  [PHASE.PENDING]: 'warn',
  [PHASE.PREPARING]: 'info',
  [PHASE.AWAITING_PAYMENT]: 'warn',
  [PHASE.ACTIVE]: 'ok',
  [PHASE.EXPIRED]: 'danger',
  [PHASE.REJECTED]: 'danger',
  [PHASE.CANCELLED]: 'neutral',
};

/** State of a coaching relationship: Awaiting Trainer Review, Awaiting Payment, Active, Expired, ... */
export function PhaseBadge({ phase }) {
  const { t } = useApp();
  return <Badge tone={PHASE_TONE[phase]}>{t(`phase.${phase}`)}</Badge>;
}

/** "General Program" or "Custom Coaching". */
export function TypeBadge({ kind }) {
  const { t } = useApp();
  return <Badge tone={kind === PROGRAM_KIND.CUSTOM ? 'info' : 'neutral'}>{t(`type.${kind}`)}</Badge>;
}

export function PriceBadge({ amount }) {
  const { t } = useApp();
  return <Badge tone={amount === 0 ? 'ok' : 'neutral'}>{formatPrice(amount, t)}</Badge>;
}
