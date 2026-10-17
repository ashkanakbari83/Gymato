import { CalendarDays, Plus } from 'lucide-react';
import ProgramCard from '../components/ProgramCard';
import Empty from '../components/ui/Empty';
import { useApp } from '../context/AppContext';
import { ACTIVE } from '../lib/constants';
import { faNum } from '../lib/format';
import { getVisiblePrograms } from '../lib/selectors';

function DeckCard({ deck }) {
  const { openDeckForm, programFromDeck } = useApp();
  return (
    <article className="card deck">
      <h3>{deck.name}</h3>
      <p className="muted">
        {faNum(deck.exercises.length)} حرکت{deck.desc ? ` · ${deck.desc}` : ''}
      </p>
      <div className="btns">
        <button className="btn ghost" onClick={() => openDeckForm(deck)}>
          ویرایش
        </button>
        <button className="btn" onClick={() => programFromDeck(deck)}>
          ساخت برنامه
        </button>
      </div>
    </article>
  );
}

/** Programs list. Coaches also manage decks here; athletes only see the programs assigned to them. */
export default function ProgramsPage() {
  const { db, user, isCoach, openModal, openProgramForm, openDeckForm, copyProgram, startWorkout } = useApp();
  const programs = getVisiblePrograms(db, user);
  const decks = db.decks.filter((d) => d.owner === user.id);
  const isActive = (program) =>
    db.assignments.some((a) => a.userId === user.id && a.programId === program.id && a.status === ACTIVE);

  return (
    <section className="stack">
      <div className="grid-cards">
        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            isCoach={isCoach}
            assigned={isActive(program)}
            onEdit={() => openProgramForm(program)}
            onCopy={() => copyProgram(program)}
            onStart={() => startWorkout(program)}
            onAssign={() => openModal({ type: 'assign', program })}
          />
        ))}
      </div>

      {!programs.length && (
        <Empty
          icon={CalendarDays}
          title="هنوز برنامه‌ای نداری"
          text={isCoach ? 'اولین برنامه یا قالب را بساز.' : 'مربی‌ات را انتخاب کن تا برنامه‌ات اینجا بیاید.'}
          actionLabel={isCoach ? 'ساخت برنامه' : 'انتخاب مربی'}
          onAction={isCoach ? () => openProgramForm() : () => openModal({ type: 'choose-coach' })}
        />
      )}

      {isCoach && (
        <>
          <div className="section-title sec-gap">
            <div>
              <h2>دک‌های آماده</h2>
              <p>مجموعه حرکات آماده برای شروع سریع</p>
            </div>
            <button className="btn ghost" onClick={() => openDeckForm()}>
              <Plus size={18} /> دک
            </button>
          </div>
          {decks.length ? (
            <div className="grid-cards">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          ) : (
            <p className="muted">هنوز دکی نساخته‌ای. دک، مجموعه‌ای از حرکات است که با یک کلیک به برنامه اضافه می‌شود.</p>
          )}
        </>
      )}
    </section>
  );
}
