// Program-related sheets: program editor, deck editor, and the two "assign" flows.
import { CalendarDays, ChevronLeft, Plus, Save } from 'lucide-react';
import AthleteBodyInfo from '../components/athlete/AthleteBodyInfo';
import ExercisePlanner from '../components/exercise/ExercisePlanner';
import { Field, SelectField } from '../components/ui/Field';
import Sheet from '../components/ui/Sheet';
import { useApp } from '../context/AppContext';
import { GOALS, LEVELS } from '../lib/constants';
import { faNum } from '../lib/format';
import { getAthletesOf, getTemplates } from '../lib/selectors';

const PROGRAM_LEVELS = [...LEVELS, 'مبتدی تا متوسط'];

/**
 * Program editor. With `athlete` it builds a program for that person (their body info is shown
 * for reference) and saving assigns it straight away.
 */
export function ProgramModal({ editing, athlete }) {
  const { db, user, draft, setDraft, saveProgram } = useApp();
  const set = (key) => (value) => setDraft({ ...draft, [key]: value });

  return (
    <Sheet title={athlete ? `برنامه جدید برای ${athlete.name}` : editing ? 'ویرایش برنامه' : 'ساخت برنامه جدید'}>
      {athlete && <AthleteBodyInfo athlete={athlete} />}

      <Field label="نام برنامه" value={draft.name ?? ''} onChange={set('name')} />
      <div className="form-grid">
        <SelectField label="هدف تمرینی" value={draft.goal ?? GOALS[0]} onChange={set('goal')} options={GOALS} />
        <SelectField label="سطح" value={draft.level ?? LEVELS[0]} onChange={set('level')} options={PROGRAM_LEVELS} />
        <Field label="روز در هفته" type="number" value={draft.days ?? 3} onChange={set('days')} />
        <Field label="مدت (هفته)" type="number" value={draft.weeks ?? 4} onChange={set('weeks')} />
      </div>

      <ExercisePlanner
        exercises={db.exercises}
        draft={draft}
        setDraft={setDraft}
        decks={db.decks.filter((d) => d.owner === user.id)}
      />

      {athlete && (
        <label className="check-row">
          <input type="checkbox" checked={Boolean(draft.alsoTemplate)} onChange={(e) => set('alsoTemplate')(e.target.checked)} />
          ذخیره به‌عنوان قالب هم
        </label>
      )}

      <button className="btn wide" onClick={() => saveProgram(athlete)}>
        <Save size={17} /> {athlete ? 'ذخیره و تخصیص' : 'ذخیره برنامه'}
      </button>
    </Sheet>
  );
}

export function DeckModal({ editing }) {
  const { db, draft, setDraft, saveDeck } = useApp();
  return (
    <Sheet title={editing ? 'ویرایش دک' : 'ساخت دک'}>
      <Field label="نام دک" value={draft.name ?? ''} onChange={(name) => setDraft({ ...draft, name })} />
      <Field label="توضیح کوتاه" value={draft.desc ?? ''} onChange={(desc) => setDraft({ ...draft, desc })} />
      <ExercisePlanner exercises={db.exercises} draft={draft} setDraft={setDraft} />
      <button className="btn wide" onClick={saveDeck}>
        <Save size={17} /> ذخیره دک
      </button>
    </Sheet>
  );
}

/** Coach picked a program: choose which athlete receives it. */
export function AssignModal({ program }) {
  const { db, user, assignProgram } = useApp();
  const athletes = getAthletesOf(db, user.id);

  return (
    <Sheet title="تخصیص برنامه">
      <div className="assign-program-preview">
        <span className="summary-icon">
          <CalendarDays />
        </span>
        <div>
          <b>{program.name}</b>
          <small>
            {faNum(program.exercises?.length ?? 0)} حرکت · {faNum(program.weeks)} هفته
          </small>
        </div>
      </div>
      <p className="modal-description">برای هر ورزشکار یک نسخه مستقل از این برنامه ذخیره می‌شود.</p>
      {!athletes.length && <p>هنوز شاگردی نداری؛ ابتدا از صفحه شاگردها با شناسه او را اضافه کن.</p>}
      {athletes.map((athlete) => (
        <button className="select-user-row" key={athlete.id} onClick={() => assignProgram(program, athlete.id)}>
          <span className="avatar">{athlete.name[0]}</span>
          <span>
            <b>{athlete.name}</b>
            <small>{athlete.goal}</small>
          </span>
          <ChevronLeft size={17} />
        </button>
      ))}
    </Sheet>
  );
}

/**
 * Coach picked an athlete: either build a brand-new program for them right here,
 * or hand over one of the existing templates.
 */
export function AssignSelectModal({ athlete }) {
  const { db, user, assignProgram, openProgramForm } = useApp();
  const templates = getTemplates(db, user.id);

  return (
    <Sheet title={`برنامه برای ${athlete.name}`}>
      <button className="btn wide" onClick={() => openProgramForm(null, athlete)}>
        <Plus size={17} /> ساخت برنامه جدید برای {athlete.name}
      </button>

      <p className="modal-description sep">{templates.length ? 'یا یکی از قالب‌ها را انتخاب کن:' : 'هنوز قالبی نساخته‌ای.'}</p>
      {templates.map((program) => (
        <button className="select-user-row" key={program.id} onClick={() => assignProgram(program, athlete.id)}>
          <span className="summary-icon">
            <CalendarDays />
          </span>
          <span>
            <b>{program.name}</b>
            <small>
              {faNum(program.exercises?.length ?? 0)} حرکت · {program.goal}
            </small>
          </span>
          <ChevronLeft size={17} />
        </button>
      ))}
    </Sheet>
  );
}
