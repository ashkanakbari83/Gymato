// Athlete statistics: headline numbers, last-7-days chart, per-exercise totals (with calories) and history.
import { Activity, History } from 'lucide-react';
import SessionRow from '../components/SessionRow.jsx';
import Empty from '../components/ui/Empty.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { sessionsCalories } from '../lib/calories.js';
import { num } from '../lib/format.js';
import { exerciseName, getCompletedSessions, lastSevenDays, nextMilestone, totalsByExercise } from '../lib/selectors.js';

export default function ProgressPage() {
  const { db, user, lang, t } = useApp();
  const sessions = getCompletedSessions(db, user.id);
  const week = lastSevenDays(sessions);
  const peak = Math.max(1, ...week.map((d) => d.count));
  const minutes = Math.round(sessions.reduce((n, s) => n + (s.duration || 0), 0) / 60);
  const totals = totalsByExercise(sessions, db.exercises).slice(0, 6);

  return (
    <div className="stack desk-grid">
      <Metrics items={[{ value: sessions.length, label: t('stat.workouts') }, { value: minutes, label: t('stat.minutes') }, { value: sessionsCalories(sessions, db.exercises), label: t('stat.kcal') }]} />

      <section className="panel half">
        <div className="section-title"><h2>{t('progress.week')}</h2></div>
        <div className="bars">
          {week.map((day, i) => (
            <div key={i}>
              <span className={day.count ? 'on' : ''} style={{ height: Math.max(6, (day.count / peak) * 96) }} />
              <small>{day.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('progress.totals')}</h2></div>
        {totals.length ? (
          totals.map(({ id, exercise, n, timed, kcal }) => {
            const goal = nextMilestone(n);
            return (
              <div className="tot" key={id}>
                <div>
                  <b>{exerciseName(exercise, lang)}</b>
                  <span>{num(n)} <i>{t(timed ? 'common.seconds' : 'common.reps')}</i></span>
                </div>
                <ProgressBar value={(n / goal) * 100} />
                <small>{t('progress.nextGoal', { goal: num(goal), kcal: num(Math.round(kcal)) })}</small>
              </div>
            );
          })
        ) : (
          <Empty icon={Activity} title={t('progress.noDataTitle')} text={t('progress.noDataText')} />
        )}
      </section>

      <section className="panel">
        <div className="section-title"><h2>{t('progress.history')}</h2></div>
        {sessions.length ? (
          <div className="list">{sessions.map((s) => <SessionRow key={s.id} session={s} />)}</div>
        ) : (
          <Empty icon={History} title={t('progress.noHistoryTitle')} text={t('progress.noHistoryText')} />
        )}
      </section>

      <p className="muted foot">{t('progress.kcalNote')}</p>
    </div>
  );
}
