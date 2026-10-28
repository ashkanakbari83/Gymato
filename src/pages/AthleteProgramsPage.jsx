// The athlete's program area. Every item says what it is (General Program / Custom Coaching) and where it
// stands (Awaiting Trainer Review, Awaiting Payment, Active, Expired). Locked items are never shown as usable.
import { Search } from 'lucide-react';
import CoachingRow from '../components/coaching/CoachingRow.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import ProgramListing from '../components/marketplace/ProgramListing.jsx';
import { useApp } from '../context/AppContext.jsx';
import { canStartProgram } from '../lib/access.js';
import { getAthleteLibrary } from '../lib/marketplace.js';

function CoachingSection({ title, items }) {
  if (!items.length) return null;
  return (
    <section className="panel">
      <div className="section-title"><h2>{title}</h2></div>
      <div className="list">{items.map((item) => <CoachingRow key={item.request.id} item={item} />)}</div>
    </section>
  );
}

function GeneralSection({ title, programs, badgeKey }) {
  const { db, user, openModal, startWorkout, t } = useApp();
  if (!programs.length) return null;
  return (
    <>
      <div className="section-title"><h2>{title}</h2></div>
      <div className="grid-cards">
        {programs.map((program) => {
          const canStart = canStartProgram(db, user, program);
          return (
            <ProgramListing key={program.id} program={program} locked={!canStart} status={badgeKey && <Badge tone="ok">{t(badgeKey)}</Badge>} onOpen={() => openModal({ type: 'general-program', programId: program.id })}>
              <button className="btn ghost" onClick={() => openModal({ type: 'general-program', programId: program.id })}>{t('gp.viewDetails')}</button>
              {canStart && <button className="btn" onClick={() => startWorkout(program)}>{t('common.start')}</button>}
            </ProgramListing>
          );
        })}
      </div>
    </>
  );
}

export default function AthleteProgramsPage() {
  const { db, user, setPage, t } = useApp();
  const lib = getAthleteLibrary(db, user.id);
  const isEmpty = Object.values(lib).every((list) => list.length === 0);

  if (isEmpty) {
    return <Empty icon={Search} title={t('programs.emptyTitle')} text={t('programs.emptyText')} actionLabel={t('programs.browse')} onAction={() => setPage('trainers')} />;
  }

  return (
    <div className="stack">
      <CoachingSection title={t('programs.sec.active')} items={lib.active} />
      <CoachingSection title={t('programs.sec.awaitingPayment')} items={lib.awaitingPayment} />
      <CoachingSection title={t('programs.sec.pending')} items={lib.pending} />
      <GeneralSection title={t('programs.sec.purchased')} programs={lib.purchased} badgeKey="gp.purchased" />
      <GeneralSection title={t('programs.sec.free')} programs={lib.free} />
      <CoachingSection title={t('programs.sec.expired')} items={lib.expired} />
      <CoachingSection title={t('programs.sec.closed')} items={lib.closed} />
    </div>
  );
}
