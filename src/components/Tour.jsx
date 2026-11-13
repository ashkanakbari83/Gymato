// The interface tour: a few steps that dim the screen, ring one part of it and say in a sentence what it is for. Which
// parts, and in what order, comes from lib/tourSteps.js; each part is marked in the page with a `data-tour` attribute.
// The note sits next to the ring (below it, else above it), never over it. It is a normal dialog, so Back and Escape skip it.
import { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { num } from '../lib/format.js';
import { TOUR_STEPS, tourKey, tourSide } from '../lib/tourSteps.js';
import Sheet from './ui/Sheet.jsx';

const GAP = 12;
const PAD = 8;

/** The visible element a step points at (the desktop tabs and the phone dock share one name; only one is on screen). */
const findTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
});

export default function Tour() {
  const { user, closeModal, t } = useApp();
  const side = tourSide(user);
  const [steps] = useState(() => TOUR_STEPS[side].filter((s) => findTarget(s.target)));
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState(null); // the ringed part, in screen coordinates
  const [noteH, setNoteH] = useState(200);
  const noteRef = useRef(null);
  const nextRef = useRef(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useLayoutEffect(() => {
    if (!step) {
      closeModal();
      return undefined;
    }
    const el = findTarget(step.target);
    if (!el) return undefined;
    const tall = el.getBoundingClientRect().height > window.innerHeight * 0.5;
    el.scrollIntoView({ block: tall ? 'start' : 'center', behavior: 'instant' });
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, right: r.right, bottom: r.bottom });
      if (noteRef.current) setNoteH(noteRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => { nextRef.current?.focus({ preventScroll: true }); }, [index]);

  if (!step || !box) return <Sheet label={t('tour.aria')} variant="tour" onClose={closeModal}><div ref={noteRef} /></Sheet>;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spot = {
    top: Math.max(box.top - PAD, 6), left: Math.max(box.left - PAD, 6),
    right: Math.min(box.right + PAD, vw - 6), bottom: Math.min(box.bottom + PAD, vh - 6),
  };
  const width = Math.min(360, vw - 32);
  const below = spot.bottom + GAP + noteH <= vh - 8;
  const above = spot.top - GAP - noteH >= 8;
  const top = below ? spot.bottom + GAP : above ? spot.top - GAP - noteH : vh - noteH - 16;
  const left = Math.min(Math.max((spot.left + spot.right) / 2 - width / 2, 16), vw - width - 16);

  return (
    <Sheet label={t('tour.aria')} variant="tour" onClose={closeModal}>
      <div className="tour-spot" aria-hidden="true" style={{ top: spot.top, left: spot.left, width: spot.right - spot.left, height: spot.bottom - spot.top }} />
      <div className="tour-note" ref={noteRef} style={{ top, left, width }}>
        <div aria-live="polite">
          <p className="tour-count">{t('tour.step', { n: num(index + 1), total: num(steps.length) })}</p>
          <h2 className="tour-title">{t(tourKey(side, step.id, 'title'))}</h2>
          <p className="tour-text">{t(tourKey(side, step.id, 'text'))}</p>
        </div>
        <div className="tour-foot">
          <div className="tour-dots" aria-hidden="true">{steps.map((s, i) => <i key={s.id} className={i === index ? 'on' : ''} />)}</div>
          <div className="tour-actions">
            {last ? null : <button className="btn ghost sm" onClick={closeModal}>{t('tour.skip')}</button>}
            {index > 0 && <button className="btn ghost sm" onClick={() => setIndex(index - 1)}>{t('tour.back')}</button>}
            <button ref={nextRef} className="btn sm" onClick={() => (last ? closeModal() : setIndex(index + 1))}>{t(last ? 'tour.done' : 'tour.next')}</button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
