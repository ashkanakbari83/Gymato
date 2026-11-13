import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * The interface tour is a normal modal too. It opens by itself once, on the home screen, after the first-run story is
 * closed; closing it any way (its buttons, Escape, Back) counts as seen.
 */
export function useTourDialog() {
  const { db, page, modal, openModal, onboarding } = useApp();
  const previous = useRef(null);

  useEffect(() => {
    const type = modal?.type ?? null;
    const wasTour = previous.current === 'tour';
    previous.current = type;
    if (wasTour && type !== 'tour') {
      onboarding.finishTour();
      return undefined;
    }
    if (!db.signedIn || onboarding.open || !onboarding.tourPending || modal || page !== 'home') return undefined;
    const id = setTimeout(() => openModal({ type: 'tour' }), 450); // let the home screen settle first
    return () => clearTimeout(id);
  }, [modal, page, onboarding.open, onboarding.tourPending, db.signedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
