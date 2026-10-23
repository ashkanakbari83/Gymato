// The four independent lifecycles of a coaching relationship, shown side by side:
// request, program, payment and subscription.
import { useApp } from '../../context/AppContext.jsx';
import { PAYMENT_KIND } from '../../lib/constants.js';
import Badge from '../ui/Badge.jsx';

const TONE = { pending: 'warn', accepted: 'ok', rejected: 'danger', cancelled: 'neutral', draft: 'neutral', published: 'ok', none: 'neutral',
  initiated: 'warn', confirmed: 'ok', failed: 'danger', pending_payment: 'warn', active: 'ok', expired: 'danger' };

export default function StatusOverview({ item }) {
  const { db, t } = useApp();
  const { request, program, subscription, subscriptionState } = item;
  const payment = subscription
    ? db.payments.filter((p) => [PAYMENT_KIND.COACHING, PAYMENT_KIND.RENEWAL].includes(p.kind) && p.targetId === subscription.id)[0]
    : null;

  const rows = [
    ['co.status.request', request.status, `request.${request.status}`],
    ['co.status.program', program?.status ?? 'none', `programStatus.${program?.status ?? 'none'}`],
    ['co.status.payment', payment?.status ?? 'none', `payment.${payment?.status ?? 'none'}`],
    ['co.status.subscription', subscriptionState ?? 'none', `subscription.${subscriptionState ?? 'none'}`],
  ];

  return (
    <dl className="status-grid">
      {rows.map(([label, tone, key]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd>
            <Badge tone={TONE[tone]}>{t(key)}</Badge>
          </dd>
        </div>
      ))}
    </dl>
  );
}
