// "First steps" card on Home. It turns the empty first screen into a short path: each step says what to do, the
// first unfinished one carries the button, and the whole card goes away once everything is done (or when dismissed).
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { num } from '../lib/format.js';

const key = (userId) => `jimato:guide-hidden:${userId}`;
const read = (userId) => {
  try { return localStorage.getItem(key(userId)) === '1'; } catch { return false; }
};
const write = (userId) => {
  try { localStorage.setItem(key(userId), '1'); } catch { /* a per-viewer convenience; losing it only brings the card back */ }
};

/** steps: [{ id, title, text, done, actionLabel, onAction }] in the order they should happen. */
export default function GettingStarted({ steps }) {
  const { user, t } = useApp();
  const [hidden, setHidden] = useState(() => read(user.id));
  const finished = steps.filter((s) => s.done).length;
  if (hidden || finished === steps.length) return null;
  const current = steps.find((s) => !s.done);

  const hide = () => {
    write(user.id);
    setHidden(true);
  };

  return (
    <section className="panel guide" aria-labelledby="guide-title">
      <div className="section-title">
        <h2 id="guide-title">{t('guide.title')}</h2>
        <span className="guide-count" aria-label={t('guide.progressLabel', { done: finished, total: steps.length })}>{num(finished)} / {num(steps.length)}</span>
      </div>
      <div className="guide-bar" role="presentation"><i style={{ width: `${(finished / steps.length) * 100}%` }} /></div>
      <ol className="guide-steps">
        {steps.map((step, index) => (
          <li key={step.id} className={step.done ? 'done' : step === current ? 'current' : ''}>
            <span className="guide-mark" aria-hidden="true">{step.done ? <Check size={16} /> : num(index + 1)}</span>
            <span className="guide-text">
              <b>{step.title}</b>
              {step === current && <small>{step.text}</small>}
            </span>
            {step === current && (
              <button className="btn sm" onClick={step.onAction}>{step.actionLabel}</button>
            )}
          </li>
        ))}
      </ol>
      <button className="link guide-hide" onClick={hide}>{t('guide.hide')}</button>
    </section>
  );
}
