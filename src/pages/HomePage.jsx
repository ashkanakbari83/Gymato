// Home: the trainer dashboard or the athlete dashboard, depending on the active account.
import InstallCard from '../components/pwa/InstallCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import AthleteHome from './AthleteHome.jsx';
import TrainerHome from './TrainerHome.jsx';

export default function HomePage() {
  const { isTrainer } = useApp();
  return (
    <>
      <InstallCard compact />
      {isTrainer ? <TrainerHome /> : <AthleteHome />}
    </>
  );
}
