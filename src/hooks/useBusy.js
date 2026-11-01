import { useCallback, useRef, useState } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs one action at a time. `run(name, fn)` marks `name` as busy (so its button can show a spinner and ignore
 * clicks), waits a beat so the feedback is visible, and then runs `fn`. A second call while one is running is
 * dropped, even within the same tick. Returns whatever `fn` returned.
 */
export function useBusy(delay = 280) {
  const [busy, setBusy] = useState(null);
  const locked = useRef(false);

  const run = useCallback(
    async (name, fn) => {
      if (locked.current) return undefined;
      locked.current = true;
      setBusy(name);
      try {
        await wait(delay);
        return await fn();
      } finally {
        locked.current = false;
        setBusy(null);
      }
    },
    [delay],
  );

  return { busy, run };
}
