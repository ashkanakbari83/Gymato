// Athlete dashboard: today's workout (from a program the athlete may actually use), headline numbers,
// week streak, items needing attention (payment / pending request) and the last workout.
import { Droplets, Play, UtensilsCrossed } from 'lucide-react';
import SessionRow from '../components/SessionRow.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import { ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { canStartProgram } from '../lib/access.js';
import { sessionsCalories } from '../lib/calories.js';
import { dailyTarget, dayKey, totalsFor, waterFor, waterGoal } from '../lib/domain/nutrition.js';
import { groupNumber, num } from '../lib/format.js';
import { getAthleteLibrary } from '../lib/marketplace.js';
import { nextSession } from '../lib/programs.js';
import { countActiveDays, exerciseName, getCompletedSessions, lastSevenDays } from '../lib/selectors.js';

export default function AthleteHome() {
  const { db, user, workout, startWorkout, setPage, lang, t } = useApp();
  const library = getAthleteLibrary(db, user.id);
  const sessions = getCompletedSessions(db, user.id);

  // First program the athlete can really train with: active coaching first, then purchased, then free.
  const program = [...library.active.map((c) => c.program), ...library.purchased, ...library.free].find((p) => canStartProgram(db, user, p)) ?? null;
  const finished = program ? sessions.filter((s) => s.programId === program.id).length : 0;
  const session = program ? nextSession(program, finished) : null;
  const moves = (session?.items ?? []).map((id) => db.exercises.find((e) => e.id === id)).filter(Boolean);
  const week = lastSevenDays(sessions);
  const today = dayKey();
  const eaten = totalsFor(db, user.id, today);
  const target = dailyTarget(user);

  const goToWorkout = () => (workout ? setPage('player') : startWorkout(program, session));
  const attention = [
    library.awaitingPayment.length && { key: 'home.awaitingPayment', n: library.awaitingPayment.length },
    library.pending.length && { key: 'home.pendingRequests', n: library.pending.length },
  ].filter(Boolean);

  return (
    <div className="stack">
      <section className="today">
        <small>{workout ? t('home.inProgress') : program ? t('home.todayWorkout') : t('home.freeWorkout')}</small>
        <h2>{workout ? t('home.continue') : session?.name ?? t('home.simpleWorkout')}</h2>
        <p>{program ? `${program.title} · ${t('home.moves', { n: num(moves.length) })}` : t('home.noProgram')}</p>
        {moves.length > 0 && (
          <ul className="today-list">
            {moves.slice(0, 4).map((e) => (
              <li key={e.id}>{exerciseName(e, lang)}</li>
            ))}
            {moves.length > 4 && <li>+{num(moves.length - 4)}</li>}
          </ul>
        )}
        <button className="cta" onClick={goToWorkout}>
          <Play size={18} fill="currentColor" />
          {workout ? t('home.resume') : t('home.startWorkout')}
        </button>
      </section>

      {attention.map(({ key, n }) => (
        <button key={key} className="attention" onClick={() => setPage('programs')}>
          <span>{t(key, { n: num(n) })}</span>
          <ArrowForward size={16} />
        </button>
      ))}

      <button className="nutri-card" onClick={() => setPage('nutrition')}>
        <span className="nutri-card-icon"><UtensilsCrossed size={20} /></span>
        <span className="nutri-card-text">
          <b>{t('nutrition.homeTitle')}</b>
          <small>
            {eaten.count || target ? t(target ? 'nutrition.homeLine' : 'nutrition.homeLineNoTarget', { kcal: groupNumber(eaten.kcal), target: target ? groupNumber(target.kcal) : '' }) : t('nutrition.homeEmpty')}
          </small>
          <small><Droplets size={13} /> {t('nutrition.homeWater', { n: num(waterFor(db, user.id, today)), goal: num(waterGoal(user)) })}</small>
        </span>
        <ArrowForward size={16} />
      </button>

      <Metrics
        items={[
          { value: sessions.length, label: t('stat.workouts') },
          { value: countActiveDays(sessions), label: t('stat.activeDays') },
          { value: sessionsCalories(sessions, db.exercises), label: t('stat.kcal') },
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

      {sessions[0] && (
        <section className="panel">
          <div className="section-title">
            <h2>{t('home.lastWorkout')}</h2>
            <button className="link" onClick={() => setPage('progress')}>
              {t('home.history')} <ArrowForward size={14} />
            </button>
          </div>
          <SessionRow session={sessions[0]} />
        </section>
      )}
    </div>
  );
}
