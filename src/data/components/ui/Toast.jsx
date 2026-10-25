// Transient confirmation message.
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={18} />
      {toast}
    </div>
  );
}
