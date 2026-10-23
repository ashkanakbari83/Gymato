// Trainer dashboard: headline numbers and what needs attention (requests, payments, renewals).
import { Users } from 'lucide-react';
import CoachingRow from '../components/coaching/CoachingRow.jsx';
import Empty from '../components/ui/Empty.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import { ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PROGRAM_STATUS } from '../lib/constants.js';
import { getOwnPrograms, getTrainerClients } from '../lib/marketplace.js';

export default function TrainerHome() {
  const { db, user, setPage, t } = useApp();
  const clients = getTrainerClients(db, user.id);
  const published = getOwnPrograms(db, user.id).filter((p) => p.status === PROGRAM_STATUS.PUBLISHED).length;

  const sections = [
    ['home.sec.pending', clients.pending],
    ['home.sec.awaitingPayment', clients.awaitingPayment],
    ['home.sec.renewals', clients.renewals],
  ].filter(([, items]) => items.length);

  return (
    <div className="stack">
      <Metrics
        items={[
          { value: clients.pending.length, label: t('home.m.pending') },
          { value: clients.active.length, label: t('home.m.active') },
          { value: clients.awaitingPayment.length, label: t('home.m.awaitingPayment') },
          { value: published, label: t('home.m.programs') },
        ]}
      />

      {sections.map(([title, items]) => (
        <section className="panel" key={title}>
          <div className="section-title">
            <h2>{t(title)}</h2>
            <button className="link" onClick={() => setPage('clients')}>
              {t('common.all')} <ArrowForward size={14} />
            </button>
          </div>
          <div className="list">
            {items.slice(0, 4).map((item) => (
              <CoachingRow key={item.request.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {!sections.length && (
        <section className="panel">
          <Empty icon={Users} title={t('home.emptyTitle')} text={t('home.emptyText')} actionLabel={t('nav.programs')} onAction={() => setPage('programs')} />
        </section>
      )}
    </div>
  );
}
