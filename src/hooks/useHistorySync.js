import { useEffect, useRef } from 'react';
import { planNav } from '../lib/navPlan.js';

const nonce = Date.now().toString(36); // entries from an earlier page load have no snapshot here
const HOME = { page: 'home', params: {}, modal: null, depth: 0 };

/**
 * Mirrors { page, params, modal } into the browser history so that the Back and Forward buttons (and the Android
 * back gesture) move through the app instead of leaving it: Back closes an open dialog first, then returns to
 * the previous page. State -> history happens in the effect below; history -> state in the popstate handler.
 * `apply(view)` sets the app state without creating a new entry (it is used for popstate only).
 */
export function useHistorySync({ page, params, modal, signedIn, resetKey, apply }) {
  const entries = useRef(new Map()); // id -> snapshot (modal props can hold anything, so they never go into history.state)
  const current = useRef(null); // snapshot of the entry we are on
  const pending = useRef(false); // a history.go() is in flight; wait for its popstate before planning again
  const counter = useRef(0);
  const desiredRef = useRef(null);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  desiredRef.current = { page, params, modal };

  const remember = (snapshot, mode) => {
    const id = `${nonce}.${++counter.current}`;
    const entry = { ...snapshot, id };
    entries.current.set(id, entry);
    history[mode === 'push' ? 'pushState' : 'replaceState']({ jimato: id }, '');
    current.current = entry;
  };

  const sync = () => {
    if (pending.current || !current.current) return;
    // A handful of steps at most (unwind, page, modal); the cap only guards against a planning bug.
    for (let guard = 0; guard < 6; guard += 1) {
      const plan = planNav(current.current, desiredRef.current);
      if (plan.type === 'none') return;
      if (plan.type === 'unwind') {
        pending.current = true;
        history.go(-plan.steps);
        return;
      }
      remember(plan.entry, plan.type);
    }
  };

  // Start over whenever the person signs in or switches account: older entries belong to another session.
  useEffect(() => {
    if (!signedIn) {
      current.current = null;
      return;
    }
    entries.current.clear();
    pending.current = false;
    remember({ ...HOME, page: desiredRef.current.page, params: desiredRef.current.params ?? {} }, 'replace');
    sync();
  }, [signedIn, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(sync, [page, params, modal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onPop = (event) => {
      if (!current.current) return; // signed out
      const snapshot = entries.current.get(event.state?.jimato) ?? null;
      if (pending.current) {
        // The unwind we asked for has landed; carry on planning from the entry we arrived at.
        pending.current = false;
        current.current = snapshot ?? { ...HOME, page: desiredRef.current.page, params: desiredRef.current.params };
        sync();
        return;
      }
      const next = snapshot ?? HOME;
      current.current = next;
      applyRef.current({ page: next.page, params: next.params, modal: next.modal });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
