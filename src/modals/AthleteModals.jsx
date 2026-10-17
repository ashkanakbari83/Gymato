// Sheets a coach uses to add an athlete and to review one.
import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import AthleteBodyInfo from '../components/athlete/AthleteBodyInfo';
import SessionRow from '../components/SessionRow';
import { Field } from '../components/ui/Field';
import ProgressBar from '../components/ui/ProgressBar';
import Sheet from '../components/ui/Sheet';
import { useApp } from '../context/AppContext';
import { sessionsCalories } from '../lib/calories';
import { faNum, formatDate } from '../lib/format';
import { progressOf } from '../lib/selectors';

/** Coach adds an athlete by the athlete's public ID. */
export function AddAthleteModal() {
  const { db, user, linkAthlete } = useApp();
  const [publicId, setPublicId] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const athlete = db.users.find((u) => u.publicId === publicId.trim().toUpperCase());
    if (!athlete || athlete.role !== 'athlete') return setError('ورزشکاری با این شناسه پیدا نشد.');
    if (athlete.coachId === user.id) return setError('این ورزشکار از قبل در لیست توست.');
    if (athlete.coachId) return setError('این ورزشکار هم‌اکنون مربی دیگری دارد.');
    linkAthlete(athlete);
  };

  return (
    <Sheet title="افزودن ورزشکار با شناسه">
      <p>از ورزشکار بخواه شناسه‌اش را از صفحه پروفایل بفرستد؛ مثل JM-4F2A91.</p>
      <Field
        label="شناسه ورزشکار"
        value={publicId}
        placeholder="JM-XXXXXX"
        onChange={(value) => {
          setPublicId(value);
          setError('');
        }}
      />
      {error && <div className="form-error">{error}</div>}
      <button className="btn wide" onClick={submit}>
        <Plus size={17} /> افزودن به شاگردها
      </button>
    </Sheet>
  );
}

/** Everything a coach needs about one athlete: body info + BMI, program progress, recent workouts. */
export function AthleteDetailModal({ athlete }) {
  const { db, openModal } = useApp();
  const current = db.users.find((u) => u.id === athlete.id) ?? athlete; // pick up profile edits
  const { program, all, done, planned, percent } = progressOf(db, current);
  const lastWorkout = all[0];

  const stats = [
    { value: faNum(all.length), label: 'جلسه کل' },
    { value: `≈ ${faNum(sessionsCalories(all, db.exercises))}`, label: 'کالری سوزانده' },
    { value: lastWorkout ? formatDate(lastWorkout.date, { month: 'short', day: 'numeric' }) : '—', label: 'آخرین تمرین' },
  ];

  return (
    <Sheet title="پیشرفت ورزشکار">
      <div className="assign-program-preview">
        <span className="avatar">{current.name[0]}</span>
        <div>
          <b>
            {current.name} · {current.publicId}
          </b>
          <small>
            {current.goal} · {current.level}
          </small>
        </div>
      </div>

      <AthleteBodyInfo athlete={current} />

      <div className="modal-subtitle">
        <b>{program ? program.name : 'برنامه فعالی ندارد'}</b>
        {program && (
          <small>
            {faNum(done.length)} از {faNum(planned)} جلسه · {faNum(percent)}٪
          </small>
        )}
      </div>
      {program && <ProgressBar value={percent} spaced />}

      <div className="finish-stats">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>

      <div className="list">
        {all.slice(0, 3).map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>

      <button className="btn wide" style={{ marginTop: 20 }} onClick={() => openModal({ type: 'assign-select', athlete: current })}>
        <CalendarDays size={17} /> تخصیص برنامه جدید
      </button>
    </Sheet>
  );
}
