import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

/**
 * Opens what a shared link points to: ?trainer=<publicId> shows the trainer's profile and &program=<id> opens
 * that program. It runs once after sign-in. Until there is a server, a link only finds trainers and
 * programs that exist on this device (the sample ones do), otherwise a short message says so.
 */
export function useDeepLink() {
  const { db, go, openModal, notify, t } = useApp();
  const handled = useRef(false);

  useEffect(() => {
    if (!db.signedIn || handled.current) return;
    const params = new URLSearchParams(location.search);
    const publicId = params.get('trainer');
    const programId = params.get('program');
    if (!publicId && !programId) return;
    handled.current = true;
    history.replaceState(null, '', location.pathname); // keep the address bar clean

    const trainer = publicId ? db.users.find((u) => u.publicId === publicId && u.role === 'coach') : null;
    const program = programId ? db.programs.find((p) => p.id === programId && p.status === 'published') : null;
    if (trainer) go('trainer', { trainerId: trainer.id });
    if (program) openModal({ type: 'general-program', programId: program.id });
    if (!trainer && !program) notify(t('share.linkNotFound'));
  }, [db.signedIn]); // eslint-disable-line react-hooks/exhaustive-deps
}
