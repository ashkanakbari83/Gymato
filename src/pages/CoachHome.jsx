import { ChevronLeft, Users } from 'lucide-react';
import AthleteRow from '../components/athlete/AthleteRow';
import Empty from '../components/ui/Empty';
import Metrics from '../components/ui/Metrics';
import { useApp } from '../context/AppContext';
import { ACTIVE, FREE_ATHLETE_LIMIT } from '../lib/constants';
import { faNum } from '../lib/format';
import { getAthletesOf } from '../lib/selectors';

const WEEK_MS = 7 * 86400000;

/** Coach dashboard: three headline numbers and the roster. */
export default function CoachHome() {
  const { db, user, setPage } = useApp();
  const athletes = getAthletesOf(db, user.id);
  const isMine = (userId) => athletes.some((a) => a.id === userId);

  const activePrograms = db.assignments.filter((a) => a.status === ACTIVE && isMine(a.userId)).length;
  const sessionsThisWeek = db.sessions.filter(
    (s) => s.status === 'completed' && isMine(s.userId) && Date.now() - new Date(s.date) < WEEK_MS,
  ).length;

  return (
    <div className="stack">
      <Metrics
        items={[
          { value: athletes.length, label: 'شاگرد', suffix: user.plan === 'pro' ? '' : `/${faNum(FREE_ATHLETE_LIMIT)}` },
          { value: activePrograms, label: 'برنامه فعال' },
          { value: sessionsThisWeek, label: 'تمرین این هفته' },
        ]}
      />

      <section className="panel">
        <div className="section-title">
          <h2>شاگردها</h2>
          <button className="link" onClick={() => setPage('athletes')}>
            همه <ChevronLeft size={14} />
          </button>
        </div>

        <div className="list">
          {athletes.map((athlete) => (
            <AthleteRow key={athlete.id} athlete={athlete} />
          ))}
          {!athletes.length && (
            <Empty icon={Users} title="هنوز شاگردی نداری" text="شناسه ورزشکار را وارد کن تا به لیست شاگردانت اضافه شود." actionLabel="افزودن شاگرد" onAction={() => setPage('athletes')} />
          )}
        </div>
      </section>
    </div>
  );
}
