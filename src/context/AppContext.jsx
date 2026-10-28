// Single source of truth: persisted data (`db`), navigation, the open modal and every action the
// screens can trigger. Screens read what they need via useApp().
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAccountActions } from '../hooks/useAccountActions.js';
import { useBackup } from '../hooks/useBackup.js';
import { useCatalogActions } from '../hooks/useCatalogActions.js';
import { useCoachingActions } from '../hooks/useCoachingActions.js';
import { useEngagementActions } from '../hooks/useEngagementActions.js';
import { useOnboarding } from '../hooks/useOnboarding.js';
import { usePaymentActions } from '../hooks/usePaymentActions.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import { useWorkoutActions } from '../hooks/useWorkoutActions.js';
import { translate } from '../i18n/index.js';
import { setFormatLanguage } from '../lib/format.js';
import { loadState, saveState } from '../lib/storage.js';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
};

/** `initial` ({ page, params, modal }) lets a deep link (or a test) start on a given screen. */
export function AppProvider({ children, initial = {} }) {
  const [db, setDb] = useState(loadState);
  const [page, setPage] = useState(initial.page ?? 'home');
  const [pageParams, setPageParams] = useState(initial.params ?? {});
  const [modal, openModal] = useState(initial.modal ?? null);
  const [draft, setDraft] = useState({});
  const [workout, setWorkout] = useState(db.activeWorkout ?? null);
  const [toast, notify] = useToast();
  const onboarding = useOnboarding();

  const lang = db.language;
  setFormatLanguage(lang); // digits/dates/currency follow the language (read during render)
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  useEffect(() => saveState({ ...db, activeWorkout: workout }), [db, workout]);
  useTheme(db.theme, lang);

  // Domain functions are pure (db, ...args) => result. `dispatch` runs one against the latest db and
  // commits the result; the ref keeps back-to-back dispatches in one tick consistent.
  const dbRef = useRef(db);
  dbRef.current = db;
  const dispatch = useCallback(
    (fn, ...args) => {
      const result = fn(dbRef.current, ...args);
      if (result.ok) {
        dbRef.current = result.db;
        setDb(result.db);
      } else if (result.error !== 'validation') {
        notify(translate(lang, `error.${result.error}`));
      }
      return result;
    },
    [lang, notify],
  );

  const update = useCallback((patch) => setDb((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })), []);
  const closeModal = useCallback(() => openModal(null), []);
  const go = useCallback((next, params = {}) => {
    setPage(next);
    setPageParams(params);
    window.scrollTo?.({ top: 0 });
  }, []);

  const user = db.users.find((u) => u.id === db.activeUser) ?? db.users[0];
  /** Admins can hop between the starter accounts; everyone else stays in their own account. */
  const changeUser = (id) => {
    if (!user.isAdmin || !db.users.some((u) => u.id === id && u.passwordHash)) return;
    update({ activeUser: id });
    setWorkout((w) => (w && w.userId !== id ? null : w));
    go('home');
    notify(t('acct.switched'));
  };

  const base = { db, setDb, update, user, isTrainer: user.role === 'coach', isCoach: user.role === 'coach', page, setPage: go, go, pageParams, modal, openModal, closeModal, draft, setDraft, workout, setWorkout, toast, notify, onboarding, changeUser, t, lang, dispatch };
  const catalog = useCatalogActions(base);
  const coaching = useCoachingActions(base);
  const engagement = useEngagementActions(base);
  const payments = usePaymentActions(base);
  const workouts = useWorkoutActions(base);
  const accounts = useAccountActions(base);
  const backup = useBackup(base);

  const value = useMemo(
    () => ({ ...base, ...catalog, ...coaching, ...engagement, ...payments, ...workouts, ...accounts, ...backup }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, page, pageParams, modal, draft, workout, toast, onboarding.open, lang],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
