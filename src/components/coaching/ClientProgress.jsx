// What a trainer reviews for an active client: completion and recent workouts.
import { useApp } from '../../context/AppContext.jsx';
import { sessionsCalories } from '../../lib/calories.js';
import { formatDate, num } from '../../lib/format.js';
import { getClientProgress } from '../../lib/marketplace.js';
import SessionRow from '../SessionRow.jsx';
import Empty from '../ui/Empty.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { Activity } from 'lucide-react';

export default function ClientProgress({ program }) {
  const { db, t } = useApp();
  const { sessions, planned, percent, lastActivity } = getClientProgress(db, program);

  return (
    <section className="co-section">
      <h3>{t('co.progress')}</h3>
      <div className="modal-subtitle">
        <b>{t('co.sessionsDone', { done: num(sessions.length), planned: num(planned) })}</b>
        <small>{num(percent)}%</small>
      </div>
      <ProgressBar value={percent} spaced />
      <dl className="detail-list">
        <div>
          <dt>{t('co.lastActivity')}</dt>
          <dd>{lastActivity ? formatDate(lastActivity, { month: 'long', day: 'numeric' }) : '—'}</dd>
        </div>
        <div>
          <dt>{t('co.calories')}</dt>
          <dd>≈ {num(sessionsCalories(sessions, db.exercises))}</dd>
        </div>
      </dl>
      {sessions.length ? (
        <div className="list">
          {sessions.slice(0, 5).map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <Empty icon={Activity} title={t('co.noActivityTitle')} text={t('co.noActivityText')} />
      )}
    </section>
  );
}
