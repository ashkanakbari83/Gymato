import { useEffect } from 'react';
import { canKeepAwake } from '../lib/feedback.js';

/**
 * Keeps the screen on while `active` (a workout is running), so the phone does not lock between sets.
 * The browser drops the lock whenever the page is hidden, so it is requested again on return.
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !canKeepAwake()) return undefined;
    let lock = null;
    let stopped = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (stopped) next.release().catch(() => {});
        else lock = next;
      } catch {
        // denied (battery saver, hidden tab, ...): the workout still works, the screen may just dim
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && acquire();

    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
