// Payment state as a label with an icon and text (never colour alone), plus the order list shown to both people.
import { Ban, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { PAYMENT_STATUS } from '../../lib/constants.js';
import { formatDate, formatPrice } from '../../lib/format.js';

const LOOK = {
  [PAYMENT_STATUS.PENDING]: { tone: 'warn', Icon: Clock },
  [PAYMENT_STATUS.PAID]: { tone: 'ok', Icon: CheckCircle2 },
  [PAYMENT_STATUS.FAILED]: { tone: 'danger', Icon: XCircle },
  [PAYMENT_STATUS.CANCELLED]: { tone: 'neutral', Icon: Ban },
};

export default function PaymentStatus({ status }) {
  const { t } = useApp();
  const { tone, Icon } = LOOK[status] ?? LOOK[PAYMENT_STATUS.PENDING];
  return (
    <Badge tone={tone}>
      <Icon size={13} aria-hidden="true" /> {t(`pay.status.${status}`)}
    </Badge>
  );
}

/** Orders of one subscription (initial payment and renewals), newest first. Same view for the athlete and the trainer. */
export function PaymentHistory({ payments }) {
  const { t } = useApp();
  if (!payments.length) return null;
  return (
    <section className="co-section" aria-label={t('pay.history')}>
      <h3>{t('pay.history')}</h3>
      <ul className="pay-list">
        {payments.map((payment) => (
          <li key={payment.id}>
            <div>
              <b>{t(`pay.kind.${payment.kind}`)}</b>
              <small>{formatDate(payment.paidAt ?? payment.createdAt, { month: 'short', day: 'numeric' })} · {formatPrice(payment.amount, t)}</small>
            </div>
            <PaymentStatus status={payment.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
