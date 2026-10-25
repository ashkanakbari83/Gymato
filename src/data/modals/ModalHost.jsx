// Renders the modal currently stored in context (see registry.js).
import { useApp } from '../context/AppContext.jsx';
import { MODALS } from './registry.js';

export default function ModalHost() {
  const { modal } = useApp();
  if (!modal) return null;
  const Modal = MODALS[modal.type];
  return Modal ? <Modal {...modal} /> : null;
}
