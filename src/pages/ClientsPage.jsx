// Trainer: every custom-coaching relationship, grouped by where it stands.
// General-program buyers are not listed here; they are not coaching clients.
import { Users } from 'lucide-react';
import CoachingRow from '../components/coaching/CoachingRow.jsx';
import Empty from '../components/ui/Empty.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getTrainerClients } from '../lib/marketplace.js';

const SECTIONS = [
  ['pending', 'clients.sec.pending'],
  ['accepted', 'clients.sec.accepted'],
  ['awaitingPayment', 'clients.sec.awaitingPayment'],
  ['active', 'clients.sec.active'],
  ['renewals', 'clients.sec.renewals'],
  ['expired', 'clients.sec.expired'],
];

export default function ClientsPage() {
  const { db, user, setPage, t } = useApp();
  const clients = getTrainerClients(db, user.id);
  const shown = SECTIONS.filter(([key]) => clients[key].length);

  if (!shown.length) {
    return <Empty icon={Users} title={t('clients.emptyTitle')} text={t('clients.emptyText')} actionLabel={t('nav.programs')} onAction={() => setPage('programs')} />;
  }

  return (
    <div className="stack desk-grid">
      {shown.map(([key, title]) => (
        <section className="panel half" key={key}>
          <div className="section-title"><h2>{t(title)}</h2></div>
          <div className="list">
            {clients[key].map((item) => <CoachingRow key={item.request.id} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
