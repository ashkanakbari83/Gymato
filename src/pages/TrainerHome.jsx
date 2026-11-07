// Trainer dashboard: headline numbers and what needs attention (requests, payments, renewals).
import GettingStarted from '../components/GettingStarted.jsx';
import CoachingRow from '../components/coaching/CoachingRow.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import { ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getIncome } from '../lib/analytics.js';
import { PREMIUM, PROGRAM_STATUS } from '../lib/constants.js';
import { formatMoney, groupNumber, num } from '../lib/format.js';
import { Crown } from 'lucide-react';
import { getOwnPrograms, getTrainerClients } from '../lib/marketplace.js';
import { isPremium, premiumDaysLeft } from '../lib/premium.js';

export default function TrainerHome() {
  const { db, user, setPage, openModal, t } = useApp();
  const clients = getTrainerClients(db, user.id);
  const published = getOwnPrograms(db, user.id).filter((p) => p.status === PROGRAM_STATUS.PUBLISHED).length;

  const income = getIncome(db, user.id);
  const sections = [
    ['home.sec.pending', clients.pending],
    ['home.sec.awaitingPayment', clients.awaitingPayment],
    ['home.sec.renewals', clients.renewals],
  ].filter(([, items]) => items.length);

  return (
    <div className="stack desk-grid">
      <GettingStarted
        steps={[
          { id: 'profile', title: t('guide.trainer.profile'), text: t('guide.trainer.profile.text'), actionLabel: t('guide.trainer.profile.cta'), onAction: () => setPage('profile', { from: 'guide' }), done: Boolean(user.avatar && user.bio) },
          { id: 'program', title: t('guide.trainer.program'), text: t('guide.trainer.program.text'), actionLabel: t('guide.trainer.program.cta'), onAction: () => setPage('programs'), done: published > 0 },
          { id: 'share', title: t('guide.trainer.share'), text: t('guide.trainer.share.text'), actionLabel: t('guide.trainer.share.cta'), onAction: () => openModal({ type: 'share', kind: 'trainer', id: user.id }),
            done: db.requests.some((r) => r.trainerId === user.id) },
        ]}
      />

      <Metrics
        items={[
          { value: clients.pending.length, label: t('home.m.pending') },
          { value: clients.active.length, label: t('home.m.active') },
          { value: clients.awaitingPayment.length, label: t('home.m.awaitingPayment') },
          { value: published, label: t('home.m.programs') },
        ]}
      />

      <button className="attention calm" onClick={() => setPage('insights')}>
        <span>{t('insights.home', { amount: formatMoney(income.last30, t) })}</span>
        <ArrowForward size={16} />
      </button>

      {isPremium(user) ? (
        <button className="attention calm" onClick={() => setPage('premium')}>
          <span>{t('premium.home', { text: t('premium.homeActive', { n: num(premiumDaysLeft(user)) }) })}</span>
          <ArrowForward size={16} />
        </button>
      ) : (
        <button className="premium-promo" onClick={() => setPage('premium')}>
          <Crown size={18} aria-hidden="true" />
          <span>{t('premium.promoSlim', { price: groupNumber(PREMIUM.price) })}</span>
          <ArrowForward size={14} />
        </button>
      )}

      {sections.map(([title, items]) => (
        <section className="panel half" key={title}>
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

      {!sections.length && <p className="calm-note">{t('home.emptyTitle')}</p>}

      <button className="link quiet-link" onClick={() => setPage('exercises')}>{t('trainer.exercisesLink')} <ArrowForward size={14} /></button>
    </div>
  );
}
