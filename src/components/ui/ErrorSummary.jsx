// After a failed save: one box at the top of the form that says exactly which parts are incomplete, each one a
// button that scrolls to the field. The errors themselves also sit next to their fields.
import { AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

/** Scrolls to a field (by its data-field name) and focuses its first control. */
export function focusField(root, name) {
  const target = (root ?? document).querySelector(`[data-field="${name}"]`);
  if (!target) return;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.querySelector('input:not([type="hidden"]), select, textarea, button')?.focus({ preventScroll: true });
}

/** items: [{ name, label }] in the order they appear in the form. */
export default function ErrorSummary({ items, title, containerRef }) {
  const { t } = useApp();
  if (!items.length) return null;
  return (
    <div className="error-summary" role="alert" ref={containerRef} tabIndex={-1}>
      <b><AlertCircle size={16} aria-hidden="true" /> {title ?? t('form.fixThese')}</b>
      <ul>
        {items.map((item) => (
          <li key={item.name}>
            <button type="button" className="link" onClick={() => focusField(containerRef?.current?.closest('.modal-card') ?? document, item.name)}>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
