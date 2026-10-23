// App shell: top bar, current page, bottom nav, workout player, toast, modals and onboarding.
import BottomNav from './components/layout/BottomNav.jsx';
import PageHead from './components/layout/PageHead.jsx';
import TopBar from './components/layout/TopBar.jsx';
import Onboarding from './components/Onboarding.jsx';
import Toast from './components/ui/Toast.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';
import ModalHost from './modals/ModalHost.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ExercisesPage from './pages/ExercisesPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ProgramsPage from './pages/ProgramsPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import TrainerProfilePage from './pages/TrainerProfilePage.jsx';
import TrainersPage from './pages/TrainersPage.jsx';
import WorkoutPlayer from './player/WorkoutPlayer.jsx';

const PAGES = {
  home: HomePage,
  exercises: ExercisesPage,
  programs: ProgramsPage,
  progress: ProgressPage,
  clients: ClientsPage,
  trainers: TrainersPage,
  trainer: TrainerProfilePage,
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

export default function App({ initial }) {
  return (
    <AppProvider initial={initial}>
      <Shell />
    </AppProvider>
  );
}
