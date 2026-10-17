import { ChevronLeft, Play } from 'lucide-react';
import SessionRow from '../components/SessionRow';
import Metrics from '../components/ui/Metrics';
import { useApp } from '../context/AppContext';
import { sessionsCalories } from '../lib/calories';
import { faNum } from '../lib/format';
import {
  countActiveDays,
  getActiveAssignment,
  getCompletedSessions,
  getProgram,
  lastSevenDays,
} from '../lib/selectors';

/** Athlete dashboard: today's workout, headline numbers, week streak, coach link and last workout. */
export default function AthleteHome() {
  const { db, user, workout, startWorkout, setPage, openModal } = useApp();

  const assignment = getActiveAssignment(db, user.id);
  const program = assignment ? getProgram(db, assignment.programId) : null;
  const nextSession = program?.sessions?.[0];
  const coach = db.users.find((u) => u.id === user.coachId);
  const sessions = getCompletedSessions(db, user.id);
  const lastSession = sessions[0];

  const moves = (nextSession?.items ?? program?.exercises ?? [])
    .map((id) => db.exercises.find((e) => e.id === id))
    .filter(Boolean);
  const week = lastSevenDays(sessions);

  const goToWorkout = () => (workout ? setPage('player') : startWorkout(program, nextSession));

  return (
    <div className="stack">
      <section className="today">
        <small>{workout ? 'در حال اجرا' : assignment ? 'تمرین امروز' : 'تمرین آزاد'}</small>
        <h2>{workout ? 'ادامه تمرین' : nextSession?.name ?? 'یک تمرین ساده'}</h2>
        <p>{program ? `${program.name} · ${faNum(moves.length)} حرکت` : 'مربی انتخاب کن تا برنامه‌ات اینجا بیاید.'}</p>

        {moves.length > 0 && (
          <ul className="today-list">
            {moves.slice(0, 4).map((e) => (
              <li key={e.id}>{e.fa}</li>
            ))}
            {moves.length > 4 && <li>+{faNum(moves.length - 4)}</li>}
          </ul>
        )}

        <button className="cta" onClick={goToWorkout}>
          <Play size={18} fill="currentColor" />
          {workout ? 'ادامه' : 'شروع تمرین'}
        </button>
      </section>

      <Metrics
        items={[
          { value: sessions.length, label: 'تمرین' },
          { value: countActiveDays(sessions), label: 'روز فعال' },
          { value: sessionsCalories(sessions, db.exercises), label: 'کالری سوزانده (≈)' },
        ]}
      />

      <section className="panel">
        <div className="week">
          {week.map((day, i) => (
            <span key={i} className={day.count ? 'on' : ''}>
              <i />
              {day.label}
            </span>
          ))}
        </div>
      </section>

      <section className="panel coach-row">
        <div>
          <b>{coach ? `مربی: ${coach.name}` : 'مربی انتخاب نشده'}</b>
          <small>
            شناسه تو <code>{user.publicId}</code>
          </small>
        </div>
        <button className="btn ghost" onClick={() => openModal({ type: 'choose-coach' })}>
          {coach ? 'تغییر' : 'انتخاب مربی'}
        </button>
      </section>

      {lastSession && (
        <section className="panel">
          <div className="section-title">
            <h2>آخرین تمرین</h2>
            <button className="link" onClick={() => setPage('progress')}>
              تاریخچه <ChevronLeft size={14} />
            </button>
          </div>
          <SessionRow session={lastSession} />
        </section>
      )}
    </div>
  );
}
