// modal.type -> component. Open one with openModal({ type, ...props }); the props are passed to the component.
import { AccountMenuModal, NotificationsModal, SignupModal } from './AccountModals.jsx';
import CheckoutModal from './CheckoutModal.jsx';
import CoachingModal from './CoachingModal.jsx';
import DeckModal from './DeckModal.jsx';
import ExerciseModal from './ExerciseModal.jsx';
import GeneralProgramModal from './GeneralProgramModal.jsx';
import ProgramEditorModal from './ProgramEditorModal.jsx';
import RequestFormModal from './RequestFormModal.jsx';

export const MODALS = {
  account: AccountMenuModal,
  signup: SignupModal,
  notifications: NotificationsModal,
  exercise: ExerciseModal,
  deck: DeckModal,
  'program-editor': ProgramEditorModal,
  'general-program': GeneralProgramModal,
  'coaching-request': RequestFormModal,
  coaching: CoachingModal,
  checkout: CheckoutModal,
};
