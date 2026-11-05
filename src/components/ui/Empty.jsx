// Empty-state block with an optional action.
import Icon3D from '../story/Icon3D.jsx';
import { ArrowForward } from './Arrow.jsx';

/** `art` (a 3D icon name) replaces the small round icon with a larger clay illustration. */
export default function Empty({ icon: Icon, art, title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {art ? (
        <span className="empty-art" aria-hidden="true"><Icon3D name={art} /></span>
      ) : (
        <span>
          <Icon size={24} />
        </span>
      )}
      <b>{title}</b>
      <p>{text}</p>
      {onAction && (
        <button className="btn ghost" onClick={onAction}>
          {actionLabel} <ArrowForward size={15} />
        </button>
      )}
    </div>
  );
}
