// Everything a coach does with programs and decks: create, edit, copy, and give them to athletes.
import { ACTIVE, GOALS, LEVELS, REPLACED, TEMPLATE } from '../lib/constants';
import { isoDate, uid } from '../lib/format';
import { buildSessions, cloneProgram, duplicateProgram } from '../lib/programs';

const upsert = (list, item) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

export function useProgramActions({ user, update, notify, openModal, closeModal, draft, setDraft }) {
  const blankProgram = () => ({
    name: 'برنامه جدید',
    goal: GOALS[0],
    level: LEVELS[0],
    days: 3,
    weeks: 4,
    exercises: [],
    targets: {},
    status: TEMPLATE,
    owner: user.id,
    sessions: [],
  });

  /** Opens the editor. Pass `athlete` to build a program directly for that athlete. */
  const openProgramForm = (program = null, athlete = null) => {
    setDraft(program ? cloneProgram(program) : blankProgram());
    openModal({ type: 'program', editing: Boolean(program), athlete });
  };

  /**
   * Makes `copy` the athlete's active program: retires their previous one and sends a notification.
   * `extraPrograms` are added to the coach's own list at the same time (e.g. a saved template).
   */
  const activateFor = (copy, athleteId, extraPrograms = []) => {
    update((d) => ({
      programs: [copy, ...extraPrograms, ...d.programs],
      assignments: [
        { id: uid(), userId: athleteId, programId: copy.id, programName: copy.name, startDate: isoDate(), status: ACTIVE },
        ...d.assignments.map((a) => (a.userId === athleteId && a.status === ACTIVE ? { ...a, status: REPLACED } : a)),
      ],
      notifications: [
        { id: uid(), userId: athleteId, title: 'برنامه جدید از مربی', text: `برنامه «${copy.name}» برایت ثبت شد.`, read: false },
        ...d.notifications,
      ],
    }));
  };

  /**
   * Saves the editor's draft.
   * - without `athlete`: stores it as a reusable template
   * - with `athlete`: gives them their own copy (and keeps a template too when `draft.alsoTemplate` is set)
   */
  const saveProgram = (athlete = null) => {
    if (!draft.name?.trim()) return notify('نام برنامه را وارد کن');
    const { alsoTemplate, ...fields } = draft;
    const exercises = fields.exercises ?? [];
    const program = {
      ...fields,
      id: fields.id ?? uid(),
      days: Number(fields.days) || 3,
      weeks: Number(fields.weeks) || 4,
      exercises,
      targets: fields.targets ?? {},
      sessions: buildSessions(fields.sessions, exercises),
    };

    if (!athlete) {
      update((d) => ({ programs: upsert(d.programs, program) }));
      notify('برنامه ذخیره شد');
    } else {
      const copy = cloneProgram(program, { id: uid(), status: ACTIVE, assignedTo: athlete.id, owner: user.id });
      activateFor(copy, athlete.id, alsoTemplate ? [program] : []);
      notify(`برنامه برای ${athlete.name} ثبت شد`);
    }
    closeModal();
  };

  const copyProgram = (program) => {
    update((d) => ({ programs: [duplicateProgram(program), ...d.programs] }));
    notify('یک نسخه مستقل ساخته شد');
  };

  /** Each assignment is an independent copy, so later template edits never rewrite an athlete's plan. */
  const assignProgram = (template, athleteId) => {
    const copy = cloneProgram(template, {
      id: uid(),
      status: ACTIVE,
      assignedTo: athleteId,
      templateId: template.id,
      owner: user.id,
    });
    activateFor(copy, athleteId);
    closeModal();
    notify('نسخه مستقل برنامه برای ورزشکار ثبت شد');
  };

  const openDeckForm = (deck = null) => {
    setDraft(
      deck
        ? { ...deck, exercises: [...deck.exercises], targets: { ...deck.targets } }
        : { name: 'دک جدید', desc: '', exercises: [], targets: {}, owner: user.id },
    );
    openModal({ type: 'deck', editing: Boolean(deck) });
  };

  const saveDeck = () => {
    if (!draft.name?.trim()) return notify('نام دک را وارد کن');
    if (!draft.exercises?.length) return notify('حداقل یک حرکت انتخاب کن');
    const deck = {
      id: draft.id ?? uid(),
      name: draft.name,
      desc: draft.desc ?? '',
      exercises: draft.exercises,
      targets: draft.targets ?? {},
      owner: user.id,
    };
    update((d) => ({ decks: upsert(d.decks, deck) }));
    closeModal();
    notify('دک ذخیره شد');
  };

  /** Starts a new program pre-filled with a deck's exercises. */
  const programFromDeck = (deck) => {
    setDraft({
      ...blankProgram(),
      name: deck.name,
      goal: 'تناسب اندام',
      exercises: [...deck.exercises],
      targets: { ...deck.targets },
    });
    openModal({ type: 'program', editing: false, athlete: null });
  };

  return { openProgramForm, saveProgram, copyProgram, openDeckForm, saveDeck, programFromDeck, assignProgram };
}
