// Pure rules that keep the browser history in step with the app's navigation state.
//
// The app state is { page, params, modal }. A history entry stores a snapshot of it plus `depth`: how many modal
// entries sit on top of the page entry it belongs to (0 = the page itself). Given the entry we are on (`current`)
// and the state the app wants (`desired`), planNav says what to do next; the caller runs it and asks again until
// the answer is 'none'. Opening a modal pushes an entry, so Back closes it first. Closing a modal in code unwinds
// the entries it pushed, so no stray duplicates are left. A page change pushes one entry.

const sameParams = (a = {}, b = {}) => JSON.stringify(a) === JSON.stringify(b);

const sameProps = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => a[key] === b[key]);
};

export const sameBase = (a, b) => a.page === b.page && sameParams(a.params, b.params);

export function planNav(current, desired) {
  const base = sameBase(current, desired);
  const wantModal = desired.modal ?? null;

  if (base && sameProps(current.modal ?? null, wantModal)) return { type: 'none' };

  // Leaving the page, or closing the modal(s): first step back over the modal entries that were pushed.
  if (current.depth > 0 && (!base || !wantModal)) return { type: 'unwind', steps: current.depth };

  if (!base) return { type: 'push', entry: { page: desired.page, params: desired.params ?? {}, modal: null, depth: 0 } };

  // Same page, a modal wanted.
  if (current.depth === 0) return { type: 'push', entry: { page: current.page, params: current.params, modal: wantModal, depth: 1 } };
  // The same kind of modal with new props updates its entry; a different modal stacks on top.
  if (current.modal?.type === wantModal.type) return { type: 'replace', entry: { ...current, modal: wantModal } };
  return { type: 'push', entry: { page: current.page, params: current.params, modal: wantModal, depth: current.depth + 1 } };
}
