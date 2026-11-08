// Sends the "your Featured subscription ends soon / has ended" notifications: when the app opens, and every few
// minutes while it stays open (a local-only app has no server to do it at the right moment).
import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { reconcilePremium } from '../lib/premium.js';

const EVERY_MS = 10 * 60 * 1000;

export function usePremiumReminders() {
  const { setDb, db } = useApp();
  const signedIn = db.signedIn;
  useEffect(() => {
    if (!signedIn) return undefined;
    // Returns the same object when nothing changed, so a quiet check causes no re-render and no re-save of the state.
    const run = () => setDb((d) => { const patch = reconcilePremium(d); return patch ? { ...d, ...patch } : d; });
    run();
    const id = setInterval(run, EVERY_MS);
    return () => clearInterval(id);
  }, [signedIn, setDb]);
}
