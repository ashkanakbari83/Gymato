// Empty-state block with an optional action.
import { ChevronLeft } from 'lucide-react';

export default function Empty({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={24} />
      </span>
      <b>{title}</b>
      <p>{text}</p>
      {onAction && (
        <button className="btn ghost" onClick={onAction}>
          {actionLabel} <ChevronLeft size={15} />
        </button>
      )}
    </div>
  );
}
