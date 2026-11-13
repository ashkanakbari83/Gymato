// App shell: top bar, current page, bottom nav, workout player, toast and modals (the first-run guide is a modal too).
import { lazy, Suspense, useEffect } from 'react';
import AuthScreen from './components/auth/AuthScreen.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import PageHead from './components/layout/PageHead.jsx';
import TopBar from './components/layout/TopBar.jsx';
import PwaNotices from './components/pwa/PwaNotices.jsx';
import Toast from './components/ui/Toast.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { useDeepLink } from './hooks/useDeepLink.js';
import { useDeviceNotifications } from './hooks/useDeviceNotifications.js';
import { usePremiumReminders } from './hooks/usePremiumReminders.js';
import { useOnboardingDialog } from './hooks/useOnboardingDialog.js';
import { useTourDialog } from './hooks/useTourDialog.js';
import ModalHost from './modals/ModalHost.jsx';

// Pages and the player load on first use, so the first screen only downloads what it shows. The service worker caches
// every chunk on install, so they still open with no connection.
const page = (loader) => lazy(loader);
const HomePage = page(() => import('./pages/HomePage.jsx'));
const ProgramsPage = page(() => import('./pages/ProgramsPage.jsx'));
const ClientsPage = page(() => import('./pages/ClientsPage.jsx'));
const ExercisesPage = page(() => import('./pages/ExercisesPage.jsx'));
const NutritionPage = page(() => import('./pages/NutritionPage.jsx'));
const PremiumPage = page(() => import('./pages/PremiumPage.jsx'));
const AdminPage = page(() => import('./pages/AdminPage.jsx'));
const InsightsPage = page(() => import('./pages/InsightsPage.jsx'));
const ProfilePage = page(() => import('./pages/ProfilePage.jsx'));
const ProgressPage = page(() => import('./pages/ProgressPage.jsx'));
const SettingsPage = page(() => import('./pages/SettingsPage.jsx'));
const TrainerProfilePage = page(() => import('./pages/TrainerProfilePage.jsx'));
const TrainersPage = page(() => import('./pages/TrainersPage.jsx'));
const WorkoutPlayer = page(() => import('./player/WorkoutPlayer.jsx'));

/** Once the first screen is up, fetch the other tabs and the player in the background so switching feels instant. */
const prefetch = () => [import('./pages/ExercisesPage.jsx'), import('./pages/TrainersPage.jsx'), import('./pages/ProgramsPage.jsx'), import('./pages/ProgressPage.jsx'), import('./player/WorkoutPlayer.jsx')];

const PAGES = {
  home: HomePage,
  exercises: ExercisesPage,
  programs: ProgramsPage,
  progress: ProgressPage,
  clients: ClientsPage,
  insights: InsightsPage,
  trainers: TrainersPage,
  trainer: TrainerProfilePage,
  profile: ProfilePage,
  settings: SettingsPage,
  nutrition: NutritionPage,
  premium: PremiumPage,
  admin: AdminPage,
};

function Shell() {
  const { db, page } = useApp();
  const Page = PAGES[page];
  useDeepLink();
  useDeviceNotifications();
  usePremiumReminders();
  useOnboardingDialog();
  useTourDialog();
  useEffect(() => {
    if (!db.signedIn) return undefined;
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 1500));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const id = idle(() => prefetch(), { timeout: 4000 });
    return () => cancel(id);
  }, [db.signedIn]);

  // Nothing of the app is shown until someone signs in.
  if (!db.signedIn) {
    return (
      <div className="app">
        <AuthScreen />
        <Toast />
        <PwaNotices />
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        <PageHead />
        <Suspense fallback={<div className="page-loading" role="status" aria-label="…" />}>{Page && <Page />}</Suspense>
      </main>
      <BottomNav />
      {page === 'player' && <Suspense fallback={null}><WorkoutPlayer /></Suspense>}
      <Toast />
      <PwaNotices />
      <ModalHost />
    </div>
  );
}

export default function App({ initial }) {
  return (
    <AppProvider initial={initial}>
      <Shell />
    </AppProvider>
  );
}
