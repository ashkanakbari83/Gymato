import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * The first-run guide is a normal modal, so Back closes it like any other. It opens by itself while the guide
 * has not been seen; closing it any other way than its own buttons (Back, Escape on a replaced modal) counts as skipping it.
 */
export function useOnboardingDialog() {
  const { db, modal, openModal, onboarding } = useApp();
  const previous = useRef(null);

  useEffect(() => {
    const type = modal?.type ?? null;
    const wasOnboarding = previous.current === 'onboarding';
    previous.current = type;
    if (wasOnboarding && type !== 'onboarding' && onboarding.open) {
      onboarding.finish();
      return;
    }
    if (db.signedIn && onboarding.open && !modal) openModal({ type: 'onboarding' });
  }, [modal, onboarding.open, db.signedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
