// First-run guide shown as a dialog; can be reopened from Settings. Explains the two services and lets the
// user jump into a demo account (trainer or athlete).
import { Check, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { DEMO_ACCOUNTS } from '../lib/constants.js';
import Stickman from './exercise/Stickman.jsx';
import Sheet from './ui/Sheet.jsx';

// Texts live in the dictionaries as onb.<id>.title / .lead / .p1..p3
const STEPS = [
  { id: 'welcome', art: <Stickman id="jacks" />, points: 0 },
  { id: 'athlete', icon: Search, points: 3 },
  { id: 'trainer', icon: Users, points: 3 },
  { id: 'start', art: <Stickman id="pushup" />, points: 0, roles: true },
];

export default function Onboarding() {
  const { onboarding, update, setPage, user, t } = useApp();
  const [index, setIndex] = useState(0);
  if (!onboarding.open) return null;

  const step = STEPS[index];
  const showRoles = step.roles && user.isAdmin; // only admins can open the starter accounts
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  const startAs = (role) => {
    update({ activeUser: DEMO_ACCOUNTS[role] });
    setPage('home');
    onboarding.finish();
  };

  return (
    <Sheet onClose={onboarding.finish} bodyClassName="ob">
      <div className="ob-art">{step.art ?? <span className="ob-icon"><Icon size={34} /></span>}</div>

      <h2>{t(`onb.${step.id}.title`)}</h2>
      {step.id !== 'athlete' && step.id !== 'trainer' && <p className="ob-lead">{t(step.roles && !user.isAdmin ? 'onb.start.leadUser' : `onb.${step.id}.lead`)}</p>}
      {step.points > 0 && (
        <ul className="ob-points">
          {Array.from({ length: step.points }, (_, i) => (
            <li key={i}>
              <Check size={18} />
              <span>{t(`onb.${step.id}.p${i + 1}`)}</span>
            </li>
          ))}
        </ul>
      )}

      {showRoles && (
        <div className="ob-roles">
          {['athlete', 'trainer'].map((role) => (
            <button key={role} onClick={() => startAs(role)}>
              <b>{t(`onb.role.${role}`)}</b>
              <small>{t(`onb.role.${role}.hint`)}</small>
            </button>
          ))}
        </div>
      )}

      <div className="ob-foot">
        {isLast ? <span /> : <button className="ob-skip" onClick={onboarding.finish}>{t('onb.skip')}</button>}
        <div className="ob-dots" aria-hidden="true">
          {STEPS.map((s, i) => <i key={s.id} className={i === index ? 'on' : ''} />)}
        </div>
        <div className="btns">
          {index > 0 && <button className="btn ghost" onClick={() => setIndex(index - 1)}>{t('common.prev')}</button>}
          {!isLast && <button className="btn" onClick={() => setIndex(index + 1)}>{t('common.next')}</button>}
          {isLast && !showRoles && <button className="btn" onClick={onboarding.finish}>{t('onb.begin')}</button>}
        </div>
      </div>
    </Sheet>
  );
}
