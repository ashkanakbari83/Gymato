import { Plus, Users } from 'lucide-react';
import AthleteRow from '../components/athlete/AthleteRow';
import Empty from '../components/ui/Empty';
import { useApp } from '../context/AppContext';
import { FREE_ATHLETE_LIMIT } from '../lib/constants';
import { faNum } from '../lib/format';
import { getAthletesOf } from '../lib/selectors';

/** Coach's student management: roster, free-plan usage and the add-by-ID entry point. */
export default function AthletesPage() {
  const { db, user, openModal } = useApp();
  const athletes = getAthletesOf(db, user.id);
  const isPro = user.plan === 'pro';
  const limitReached = !isPro && athletes.length >= FREE_ATHLETE_LIMIT;

  return (
    <div className="stack">
      <div className="bar-head">
        <span className="muted">
          {isPro ? 'اشتراک فعال است' : `${faNum(athletes.length)} از ${faNum(FREE_ATHLETE_LIMIT)} شاگرد رایگان`}
          {limitReached && (
            <>
              {' · '}
              <button className="link" onClick={() => openModal({ type: 'upgrade' })}>
                ارتقا
              </button>
            </>
          )}
        </span>
        <button className="btn" onClick={() => openModal({ type: limitReached ? 'upgrade' : 'athlete-add' })}>
          <Plus size={18} /> شاگرد جدید
        </button>
      </div>

      <section className="panel list">
        {athletes.map((athlete) => (
          <AthleteRow key={athlete.id} athlete={athlete} />
        ))}
        {!athletes.length && <Empty icon={Users} title="هنوز شاگردی نداری" text="با شناسه ورزشکار او را به لیست شاگردانت اضافه کن." />}
      </section>
    </div>
  );
}
