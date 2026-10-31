// modal.type -> component. Open one with openModal({ type, ...props }); the props are passed to the component.
import { AccountMenuModal, NotificationsModal } from './AccountModals.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import CoachingModal from './CoachingModal.jsx';
import DeckModal from './DeckModal.jsx';
import ExerciseModal from './ExerciseModal.jsx';
import FoodModal from './FoodModal.jsx';
import GeneralProgramModal from './GeneralProgramModal.jsx';
import ProgramEditorModal from './ProgramEditorModal.jsx';
import RequestFormModal from './RequestFormModal.jsx';
import ShareModal from './ShareModal.jsx';
import Onboarding from '../components/Onboarding.jsx';
import { HowToModal } from '../player/HowTo.jsx';

export const MODALS = {
  account: AccountMenuModal,
  notifications: NotificationsModal,
  exercise: ExerciseModal,
  'food-add': FoodModal,
  share: ShareModal,
  deck: DeckModal,
  'program-editor': ProgramEditorModal,
  'general-program': GeneralProgramModal,
  'coaching-request': RequestFormModal,
  coaching: CoachingModal,
  checkout: CheckoutModal,
  onboarding: Onboarding,
  'how-to': HowToModal,
};
