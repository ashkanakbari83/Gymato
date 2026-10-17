import {
  ChooseCoachModal,
  NotificationsModal,
  SignupModal,
  SwitchProfileModal,
  UpgradeModal,
} from './AccountModals';
import { AddAthleteModal, AthleteDetailModal } from './AthleteModals';
import ExerciseModal from './ExerciseModal';
import { AssignModal, AssignSelectModal, DeckModal, ProgramModal } from './ProgramModals';

/** modal.type -> component. Open one with openModal({ type, ...props }). */
export const MODALS = {
  program: ProgramModal,
  deck: DeckModal,
  assign: AssignModal,
  'assign-select': AssignSelectModal,
  exercise: ExerciseModal,
  switch: SwitchProfileModal,
  signup: SignupModal,
  notifications: NotificationsModal,
  'choose-coach': ChooseCoachModal,
  upgrade: UpgradeModal,
  'athlete-add': AddAthleteModal,
  'athlete-detail': AthleteDetailModal,
};
