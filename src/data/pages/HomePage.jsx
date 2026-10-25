// Home: the trainer dashboard or the athlete dashboard, depending on the active account.
import { useApp } from '../context/AppContext.jsx';
import AthleteHome from './AthleteHome.jsx';
import TrainerHome from './TrainerHome.jsx';

export default function HomePage() {
  const { isTrainer } = useApp();
  return isTrainer ? <TrainerHome /> : <AthleteHome />;
}
