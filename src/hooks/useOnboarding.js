import { useCallback, useState } from 'react';
import { ONBOARDING_KEY } from '../lib/constants';

const wasSeen = () => {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'done';
  } catch {
    return false;
  }
};

/** First-run guide. Stored separately from app data so "reset data" does not hide it forever. */
export function useOnboarding() {
  const [seen, setSeen] = useState(wasSeen);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'done');
    } catch {
      /* private mode: just close it for this session */
    }
    setSeen(true);
  }, []);

  const reopen = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch {
      /* ignore */
    }
    setSeen(false);
  }, []);

  return { open: !seen, finish, reopen };
}
