// Modal shell: centered dialog on desktop, bottom sheet on mobile. Every dialog in the app goes through it, so this
// is the one place that handles focus, the Escape key, the scroll lock and hiding the page behind it.
// (Android/browser Back is handled by useHistorySync, because the open modal lives in the app state.)
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// Only one Sheet is mounted at a time (modals replace each other), but a replacement unmounts the old one and
// mounts the new one in the same commit. These counters keep the lock and the focus target stable across that swap.
let openSheets = 0;
let returnFocusTo = null;
let lockedStyles = null;

function lockScroll() {
  if (openSheets++ > 0) return;
  const root = document.documentElement;
  const gutter = window.innerWidth - root.clientWidth; // keep the layout from jumping when the scrollbar disappears
  lockedStyles = { overflow: root.style.overflow, paddingInlineEnd: document.body.style.paddingInlineEnd };
  root.style.overflow = 'hidden';
  if (gutter > 0) document.body.style.paddingInlineEnd = `${gutter}px`;
}

function unlockScroll() {
  if (--openSheets > 0 || !lockedStyles) return;
  document.documentElement.style.overflow = lockedStyles.overflow;
  document.body.style.paddingInlineEnd = lockedStyles.paddingInlineEnd;
  lockedStyles = null;
}

/** Makes the rest of the page unreachable (keyboard, pointer and screen readers) while the dialog is open. */
function hidePageBehind(backdrop) {
  const hidden = [];
  const app = backdrop.closest('.app');
  for (const el of app ? app.children : []) {
    if (el === backdrop || el.hasAttribute('data-keep-live') || el.inert) continue;
    el.inert = true;
    hidden.push(el);
  }
  return () => hidden.forEach((el) => { el.inert = false; });
}

/** Modal shell: centered dialog on desktop, bottom sheet on mobile. */
export default function Sheet({ title, label, children, onClose, bodyClassName = '' }) {
  const { closeModal, t } = useApp();
  const close = onClose ?? closeModal;
  const closeRef = useRef(close);
  closeRef.current = close;
  const backdropRef = useRef(null);
  const cardRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const backdrop = backdropRef.current;
    const card = cardRef.current;
    const active = document.activeElement;
    // The first sheet remembers the control that opened it; a sheet that replaces another keeps that target.
    if (openSheets === 0 && active && active !== document.body && !backdrop.contains(active)) returnFocusTo = active;
    lockScroll();
    const showPage = hidePageBehind(backdrop);
    if (!card.contains(document.activeElement)) card.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = [...card.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) {
          e.preventDefault();
          card.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      showPage();
      unlockScroll();
      // Give focus back to the opener, unless another sheet took over in this same commit.
      setTimeout(() => {
        if (openSheets > 0) return;
        const target = returnFocusTo;
        returnFocusTo = null;
        if (target?.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true });
      }, 0);
    };
  }, []);

  return (
    <div ref={backdropRef} className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={cardRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : label} tabIndex={-1}>
        {title && (
          <header className="modal-head">
            <h2 id={titleId}>{title}</h2>
            <button className="icon-btn" onClick={close} aria-label={t('common.close')}>
              <X size={20} />
            </button>
          </header>
        )}
        <div className={`modal-body ${bodyClassName}`}>{children}</div>
      </section>
    </div>
  );
}
