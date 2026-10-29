// Trainer actions for general programs and decks, plus the athlete's "add free program".
import { LEVELS, PROGRAM_STATUS } from '../lib/constants.js';
import { claimFreeProgram, deleteGeneralProgram, saveGeneralProgram, setProgramStatus } from '../lib/domain/catalog.js';
import { uid } from '../lib/format.js';

const upsert = (list, item) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

export function useCatalogActions({ user, update, notify, t, dispatch, openModal, closeModal, draft, setDraft }) {
  const blankGeneral = () => ({
    title: '',
    description: '',
    goals: [],
    level: LEVELS[0],
    durationWeeks: 4,
    daysPerWeek: 3,
    price: 0,
    notes: '',
    safety: '',
    mealPlan: null,
    exercises: [],
    targets: {},
    sessions: [],
  });

  /** Opens the editor for a new general program, or for `program` to update it. */
  const openGeneralEditor = (program = null) => {
    setDraft(program ? { ...program, exercises: [...program.exercises], targets: { ...program.targets }, goals: [...program.goals] } : blankGeneral());
    openModal({ type: 'program-editor', kind: 'general', editing: Boolean(program) });
  };

  /** Save as draft or publish. Returns the domain result so the editor can show field errors. */
  const saveGeneral = (status = PROGRAM_STATUS.DRAFT) => {
    const result = dispatch(saveGeneralProgram, user.id, draft, status);
    if (result.ok) {
      closeModal();
      notify(t(status === PROGRAM_STATUS.PUBLISHED ? 'gp.published' : 'gp.savedDraft'));
    }
    return result;
  };

  const setStatus = (programId, status) => {
    const result = dispatch(setProgramStatus, user.id, programId, status);
    if (result.ok) notify(t(status === PROGRAM_STATUS.PUBLISHED ? 'gp.published' : 'gp.unpublished'));
    else if (result.error === 'validation') notify(t('gp.completeBeforePublish'));
  };

  const removeProgram = (programId) => {
    if (!confirm(t('gp.confirmDelete'))) return;
    const result = dispatch(deleteGeneralProgram, user.id, programId);
    if (result.ok) notify(t('gp.deleted'));
  };

  const claimFree = (programId) => {
    const result = dispatch(claimFreeProgram, user.id, programId);
    if (result.ok) notify(t('gp.addedFree'));
  };

  // ---- decks: reusable exercise bundles, only used to speed up building programs ----
  const openDeckForm = (deck = null) => {
    setDraft(deck ? { ...deck, exercises: [...deck.exercises], targets: { ...deck.targets } } : { name: '', desc: '', exercises: [], targets: {}, owner: user.id });
    openModal({ type: 'deck', editing: Boolean(deck) });
  };

  const saveDeck = () => {
    if (!draft.name?.trim()) return notify(t('deck.nameRequired'));
    if (!draft.exercises?.length) return notify(t('deck.exerciseRequired'));
    const deck = { id: draft.id ?? uid(), name: draft.name.trim(), desc: draft.desc ?? '', exercises: draft.exercises, targets: draft.targets ?? {}, owner: user.id };
    update((d) => ({ decks: upsert(d.decks, deck) }));
    closeModal();
    notify(t('deck.saved'));
  };

  return { openGeneralEditor, saveGeneral, setStatus, removeProgram, claimFree, openDeckForm, saveDeck };
}
