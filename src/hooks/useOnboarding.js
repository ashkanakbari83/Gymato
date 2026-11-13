import { useCallback, useState } from 'react';
import { ONBOARDING_KEY, TOUR_KEY } from '../lib/constants.js';

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode: it only lasts for this session */
  }
};

/**
 * First-run guide: the story slides, then a short tour of the screen. Stored separately from app data so "reset data"
 * does not hide it forever. Finishing the story queues the tour; people who had already seen the story before the tour
 * existed are marked as done, so only new people (or someone replaying the guide) get it.
 */
export function useOnboarding() {
  const [seen, setSeen] = useState(() => {
    const storySeen = read(ONBOARDING_KEY) === 'done';
    if (storySeen && read(TOUR_KEY) === null) write(TOUR_KEY, 'done');
    return storySeen;
  });
  const [tourPending, setTourPending] = useState(() => read(TOUR_KEY) === 'pending');

  const finish = useCallback(() => {
    write(ONBOARDING_KEY, 'done');
    write(TOUR_KEY, 'pending');
    setSeen(true);
    setTourPending(true);
  }, []);

  const reopen = useCallback(() => {
    write(ONBOARDING_KEY, null);
    setSeen(false);
  }, []);

  const finishTour = useCallback(() => {
    write(TOUR_KEY, 'done');
    setTourPending(false);
  }, []);

  return { open: !seen, finish, reopen, tourPending, finishTour };
}
