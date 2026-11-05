// Renders the modal currently stored in context (see registry.js). Modal code loads on first open.
import { Suspense } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { MODALS } from './registry.js';

export default function ModalHost() {
  const { modal } = useApp();
  if (!modal) return null;
  const Modal = MODALS[modal.type];
  return Modal ? <Suspense fallback={null}><Modal {...modal} /></Suspense> : null;
}
