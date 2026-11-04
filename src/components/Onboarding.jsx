// First-run story: a few full-screen slides (one idea each, a big two-tone headline and a 3D icon) for the person's own
// side (athlete or trainer). Tap anywhere to continue; it can be skipped at any time and reopened from Settings.
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { num } from '../lib/format.js';
import Icon3D from './story/Icon3D.jsx';
import Sheet from './ui/Sheet.jsx';

// Texts live in the dictionaries as story.<side>.<n>.eyebrow / .a / .b / .text
const ICONS = {
  athlete: ['dumbbell', 'medal', 'timer', 'flame'],
  trainer: ['clipboard', 'chat', 'coin', 'medal'],
};

export default function Onboarding() {
  const { onboarding, closeModal, user, t } = useApp();
  const side = user.role === 'coach' ? 'trainer' : 'athlete';
  const icons = ICONS[side];
  const [index, setIndex] = useState(0);
  const isLast = index === icons.length - 1;
  const n = index + 1;

  const done = () => {
    onboarding.finish();
    closeModal();
  };
  const next = () => (isLast ? done() : setIndex(index + 1));
  const onKey = (e) => {
    if (e.target !== e.currentTarget || !['Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    next();
  };

  return (
    <Sheet label={t('onb.welcome.title')} onClose={done} variant="story">
      {/* the whole slide is a tap target, like a story; the buttons inside keep their own action */}
      <div className="story" onClick={isLast ? undefined : next} onKeyDown={onKey} tabIndex={0} data-last={isLast}>
        <header className="story-top" onClick={(e) => e.stopPropagation()}>
          <button className="story-skip ob-skip" onClick={done}>{t('onb.skip')}</button>
          <div className="story-progress" role="img" aria-label={t('story.step', { n: num(n), total: num(icons.length) })}>
            {icons.map((icon, i) => <i key={icon + i} className={i <= index ? 'on' : ''} />)}
          </div>
          <button className="story-next" onClick={next} aria-label={t('story.next')} disabled={isLast}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="story-slide" key={`${side}-${n}`}>
          <p className="story-eyebrow">{t(`story.${side}.${n}.eyebrow`)}</p>
          <h2 className="story-title">
            <span>{t(`story.${side}.${n}.a`)}</span>
            <span className="story-title-b">{t(`story.${side}.${n}.b`)}</span>
          </h2>
          <p className="story-text">{t(`story.${side}.${n}.text`)}</p>
          <div className="story-art"><Icon3D name={icons[index]} /></div>
        </div>

        <footer className="story-foot" onClick={(e) => e.stopPropagation()}>
          {isLast ? (
            <button className="btn wide ob-go" onClick={done}>{t('story.start')}</button>
          ) : (
            <>
              <button className="story-continue" onClick={next}>{t('story.continue')}<ChevronRight size={18} aria-hidden="true" /></button>
              <p className="story-hint" aria-hidden="true">{t('story.tap')}</p>
            </>
          )}
        </footer>
      </div>
    </Sheet>
  );
}
