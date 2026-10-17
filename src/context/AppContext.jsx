import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccountActions } from '../hooks/useAccountActions';
import { useBackup } from '../hooks/useBackup';
import { useOnboarding } from '../hooks/useOnboarding';
import { useProgramActions } from '../hooks/useProgramActions';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useWorkoutActions } from '../hooks/useWorkoutActions';
import { loadState, saveState } from '../lib/storage';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
};

/**
 * Single source of truth: persisted data (`db`), navigation, the open modal and
 * every action the screens can trigger. Screens read what they need via useApp().
 */
export function AppProvider({ children }) {
  const [db, setDb] = useState(loadState);
  const [page, setPage] = useState('home');
  const [modal, openModal] = useState(null);
  const [draft, setDraft] = useState({});
  const [workout, setWorkout] = useState(db.activeWorkout ?? null);
  const [toast, notify] = useToast();
  const onboarding = useOnboarding();

  useEffect(() => saveState({ ...db, activeWorkout: workout }), [db, workout]);
  useTheme(db.theme, db.language);

  const update = useCallback(
    (patch) => setDb((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })),
    [],
  );
  const closeModal = useCallback(() => openModal(null), []);

  const user = db.users.find((u) => u.id === db.activeUser) ?? db.users[0];

  const changeUser = (id) => {
    update({ activeUser: id });
    setPage('home');
    notify('پروفایل فعال تغییر کرد');
  };

  const base = { db, setDb, update, user, isCoach: user.role === 'coach', page, setPage, modal, openModal, closeModal, draft, setDraft, workout, setWorkout, toast, notify, onboarding, changeUser };
  const programs = useProgramActions(base);
  const workouts = useWorkoutActions(base);
  const accounts = useAccountActions(base);
  const backup = useBackup(base);

  const value = useMemo(
    () => ({ ...base, ...programs, ...workouts, ...accounts, ...backup }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, page, modal, draft, workout, toast, onboarding.open],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
