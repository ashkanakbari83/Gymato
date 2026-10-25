// Modal shell: centered dialog on desktop, bottom sheet on mobile. Closes on Escape or backdrop click.
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';

/** Modal shell: centered dialog on desktop, bottom sheet on mobile. */
export default function Sheet({ title, children, onClose, bodyClassName = '' }) {
  const { closeModal, t } = useApp();
  const close = onClose ?? closeModal;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <header className="modal-head">
            <h2>{title}</h2>
            <button className="icon-btn" onClick={close} aria-label={t("common.close")}>
              <X size={20} />
            </button>
          </header>
        )}
        <div className={`modal-body ${bodyClassName}`}>{children}</div>
      </section>
    </div>
  );
}
