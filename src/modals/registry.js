// modal.type -> component (loaded when first opened). Open one with openModal({ type, ...props }); the props are passed to the component.

import { lazy } from 'react';

const modal = (loader, name) => lazy(() => loader().then((m) => ({ default: name ? m[name] : m.default })));

export const MODALS = {
  account: modal(() => import('./AccountModals.jsx'), 'AccountMenuModal'),
  notifications: modal(() => import('./AccountModals.jsx'), 'NotificationsModal'),
  exercise: modal(() => import('./ExerciseModal.jsx')),
  'food-add': modal(() => import('./FoodModal.jsx')),
  share: modal(() => import('./ShareModal.jsx')),
  deck: modal(() => import('./DeckModal.jsx')),
  'program-editor': modal(() => import('./ProgramEditorModal.jsx')),
  'general-program': modal(() => import('./GeneralProgramModal.jsx')),
  'coaching-request': modal(() => import('./RequestFormModal.jsx')),
  coaching: modal(() => import('./CoachingModal.jsx')),
  checkout: modal(() => import('./CheckoutModal.jsx')),
  onboarding: modal(() => import('../components/Onboarding.jsx')),
  'how-to': modal(() => import('../player/HowTo.jsx'), 'HowToModal'),
  'image-viewer': modal(() => import('./ImageViewerModal.jsx')),
};
