// Full-screen image viewer ("lightbox"): original image, zoom (buttons, wheel, double-click, pinch), pan, next/previous
// (buttons, arrow keys, swipe), Close button, click-outside and Escape to close. Open it with
//   openModal({ type: 'image-viewer', images: [{ src, alt }], index })
// Closing goes one step back in the history, so a dialog that was open underneath comes back as it was.
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Sheet from '../components/ui/Sheet.jsx';
import { viewerId } from '../components/ui/ViewableImage.jsx';
import { useApp } from '../context/AppContext.jsx';
import { num } from '../lib/format.js';

const MIN = 1;
const MAX = 5;
const STEP = 1.4;
const SWIPE = 60;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function ImageViewerModal({ images = [], index = 0 }) {
  const { closeModal, lang, t } = useApp();
  const [i, setI] = useState(clamp(index, 0, Math.max(0, images.length - 1)));
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const rtl = lang === 'fa';
  const many = images.length > 1;
  const current = images[i];

  // When the viewer goes away, focus returns to the thumbnail that opened it (the dialog underneath is restored first).
  const last = useRef(null);
  last.current = images[i] ? viewerId(images[i], i) : null;
  const opener = useRef(images[index] ? viewerId(images[index], index) : null);
  useEffect(() => () => {
    const id = opener.current;
    setTimeout(() => document.querySelector(`[data-viewer-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }), 120);
  }, []);

  const close = useCallback(() => {
    // The viewer was pushed as a history entry; stepping back removes it (and restores a dialog underneath).
    if (window.history.state?.jimato) window.history.back();
    else closeModal();
  }, [closeModal]);

  /** Keep the picture from being dragged out of view: the pan limit is half of what overflows the stage. */
  const limit = useCallback((next) => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return next;
    const maxX = Math.max(0, (img.clientWidth * next.z - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.clientHeight * next.z - stage.clientHeight) / 2);
    return { z: next.z, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const zoomTo = useCallback((z) => setView((v) => (z <= MIN ? { z: MIN, x: 0, y: 0 } : limit({ ...v, z: clamp(z, MIN, MAX) }))), [limit]);
  const go = useCallback((step) => {
    setI((n) => clamp(n + step, 0, images.length - 1));
    setView({ z: 1, x: 0, y: 0 });
  }, [images.length]);
  const forward = useCallback(() => go(1), [go]);
  const back = useCallback(() => go(-1), [go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') (rtl ? back : forward)();
      else if (e.key === 'ArrowLeft') (rtl ? forward : back)();
      else if (e.key === '+' || e.key === '=') zoomTo(view.z * STEP);
      else if (e.key === '-') zoomTo(view.z / STEP);
      else if (e.key === '0') zoomTo(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [rtl, forward, back, zoomTo, view.z]);

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return;
    stageRef.current.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: view.z, moved: true };
    } else {
      gesture.current = { type: 'drag', sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const z = clamp((g.z * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, MIN, MAX);
      setView((v) => (z <= MIN ? { z: MIN, x: 0, y: 0 } : limit({ ...v, z })));
    } else if (g.type === 'drag') {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
      if (view.z > 1) setView(limit({ z: view.z, x: g.ox + dx, y: g.oy + dy }));
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    gesture.current = null;
    if (!g) return;
    if (g.type === 'drag') {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (view.z === 1 && many && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
        // A swipe moves the picture the way the finger goes, so the neighbour on that side is shown.
        const towardNext = rtl ? dx > 0 : dx < 0;
        go(towardNext ? 1 : -1);
      } else if (!g.moved && e.target === stageRef.current) {
        close(); // a plain tap on the empty area around the picture
      }
    }
  };

  const onWheel = (e) => zoomTo(view.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  const onDoubleClick = (e) => {
    if (e.target.closest('button')) return;
    zoomTo(view.z > 1 ? 1 : 2.5);
  };

  if (!current) return null;
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <Sheet variant="lightbox" label={t('viewer.label')} onClose={close}>
      <div className="lb">
        <div className="lb-bar">
          <span className="lb-count" aria-live="polite">{many ? t('viewer.count', { n: num(i + 1), total: num(images.length) }) : ''}</span>
          <div className="lb-tools">
            <button type="button" className="lb-btn" onClick={() => zoomTo(view.z / STEP)} disabled={view.z <= MIN} aria-label={t('viewer.zoomOut')}><ZoomOut size={20} /></button>
            <button type="button" className="lb-btn" onClick={() => zoomTo(view.z * STEP)} disabled={view.z >= MAX} aria-label={t('viewer.zoomIn')}><ZoomIn size={20} /></button>
            <button type="button" className="lb-btn" onClick={() => zoomTo(1)} disabled={view.z === 1} aria-label={t('viewer.reset')}><RotateCcw size={19} /></button>
            <button type="button" className="lb-btn lb-close" onClick={close} aria-label={t('common.close')}><X size={22} /></button>
          </div>
        </div>

        <div
          ref={stageRef}
          className={`lb-stage ${view.z > 1 ? 'zoomed' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
        >
          <img
            ref={imgRef}
            key={current.src}
            className="lb-img"
            src={current.src}
            alt={current.alt ?? ''}
            draggable={false}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}
          />
          {many && i > 0 && <button type="button" className="lb-btn lb-nav lb-prev" onClick={back} aria-label={t('viewer.prev')}><PrevIcon size={26} /></button>}
          {many && i < images.length - 1 && <button type="button" className="lb-btn lb-nav lb-next" onClick={forward} aria-label={t('viewer.next')}><NextIcon size={26} /></button>}
        </div>
        {current.alt && <p className="lb-caption">{current.alt}</p>}
      </div>
    </Sheet>
  );
}
