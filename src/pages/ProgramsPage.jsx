// "Programs": a trainer manages general programs and decks; an athlete sees their own library.
import { useApp } from '../context/AppContext.jsx';
import AthleteProgramsPage from './AthleteProgramsPage.jsx';
import TrainerProgramsPage from './TrainerProgramsPage.jsx';

export default function ProgramsPage() {
  const { isTrainer } = useApp();
  return isTrainer ? <TrainerProgramsPage /> : <AthleteProgramsPage />;
}
