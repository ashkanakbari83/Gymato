import { Activity, History } from 'lucide-react';
import SessionRow from '../components/SessionRow';
import Empty from '../components/ui/Empty';
import Metrics from '../components/ui/Metrics';
import ProgressBar from '../components/ui/ProgressBar';
import { useApp } from '../context/AppContext';
import { sessionsCalories } from '../lib/calories';
import { faNum } from '../lib/format';
import { getCompletedSessions, lastSevenDays, nextMilestone, totalsByExercise } from '../lib/selectors';

/** Athlete statistics: headline numbers, last-7-days chart, per-exercise totals (with calories) and history. */
export default function ProgressPage() {
  const { db, user } = useApp();
  const sessions = getCompletedSessions(db, user.id);
  const week = lastSevenDays(sessions);
  const peak = Math.max(1, ...week.map((d) => d.count));
  const minutes = Math.round(sessions.reduce((n, s) => n + (s.duration || 0), 0) / 60);
  const totals = totalsByExercise(sessions, db.exercises).slice(0, 6);

  return (
    <div className="stack">
      <Metrics
        items={[
          { value: sessions.length, label: 'تمرین' },
          { value: minutes, label: 'دقیقه' },
          { value: sessionsCalories(sessions, db.exercises), label: 'کالری (≈)' },
        ]}
      />

      <section className="panel">
        <div className="section-title">
          <h2>هفته اخیر</h2>
        </div>
        <div className="bars">
          {week.map((day, i) => (
            <div key={i}>
              <span className={day.count ? 'on' : ''} style={{ height: Math.max(6, (day.count / peak) * 96) }} />
              <small>{day.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>مجموع حرکات</h2>
        </div>
        {totals.length ? (
          totals.map(({ name, n, unit, kcal }) => {
            const goal = nextMilestone(n);
            return (
              <div className="tot" key={name}>
                <div>
                  <b>{name}</b>
                  <span>
                    {faNum(n)} <i>{unit}</i>
                  </span>
                </div>
                <ProgressBar value={(n / goal) * 100} />
                <small>
                  هدف بعدی {faNum(goal)} · ≈ {faNum(Math.round(kcal))} کالری
                </small>
              </div>
            );
          })
        ) : (
          <Empty icon={Activity} title="هنوز داده‌ای نیست" text="بعد از چند تمرین، مجموع هر حرکت اینجا نمایش داده می‌شود." />
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <h2>تاریخچه</h2>
        </div>
        {sessions.length ? (
          <div className="list">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <Empty icon={History} title="تاریخچه خالی است" text="بعد از اولین تمرین، نتیجه اینجا ذخیره می‌شود." />
        )}
      </section>

      <p className="muted foot">کالری‌ها تخمینی‌اند و بر اساس میانگین هر حرکت محاسبه می‌شوند.</p>
    </div>
  );
}
