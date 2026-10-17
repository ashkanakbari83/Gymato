// Home: the coach dashboard or the athlete dashboard, depending on the active account.
import { useApp } from '../context/AppContext';
import AthleteHome from './AthleteHome';
import CoachHome from './CoachHome';

export default function HomePage() {
  const { isCoach } = useApp();
  return isCoach ? <CoachHome /> : <AthleteHome />;
}
