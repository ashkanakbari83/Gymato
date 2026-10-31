// Transient confirmation message. Two visually hidden live regions stay mounted for the whole session (screen
// readers only announce changes to a region that already exists); the visible bubble is hidden from them so
// the message is not read twice. Errors use role="alert", everything else is a polite status.
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function Toast() {
  const { toast, toastTone } = useApp();
  const isAlert = toastTone === 'alert';
  return (
    <>
      <div className="sr-only" data-keep-live role="status" aria-live="polite" aria-atomic="true">
        {isAlert ? '' : toast}
      </div>
      <div className="sr-only" data-keep-live role="alert" aria-atomic="true">
        {isAlert ? toast : ''}
      </div>
      {toast && (
        <div className="toast" data-keep-live aria-hidden="true">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
