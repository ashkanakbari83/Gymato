// App shell: top bar, current page, bottom nav, workout player, toast, modals and onboarding.
import BottomNav from './components/layout/BottomNav';
import PageHead from './components/layout/PageHead';
import TopBar from './components/layout/TopBar';
import Onboarding from './components/Onboarding';
import Toast from './components/ui/Toast';
import { AppProvider, useApp } from './context/AppContext';
import ModalHost from './modals/ModalHost';
import AthletesPage from './pages/AthletesPage';
import ExercisesPage from './pages/ExercisesPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProgramsPage from './pages/ProgramsPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import WorkoutPlayer from './player/WorkoutPlayer';

const PAGES = {
  home: HomePage,
  exercises: ExercisesPage,
  programs: ProgramsPage,
  progress: ProgressPage,
  athletes: AthletesPage,
  profile: ProfilePage,
  settings: SettingsPage,
};

function Shell() {
  const { page } = useApp();
  const Page = PAGES[page];

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        <PageHead />
        {Page && <Page />}
      </main>
      <BottomNav />
      {page === 'player' && <WorkoutPlayer />}
      <Toast />
      <ModalHost />
      <Onboarding />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
