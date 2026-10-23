// One-line summary of a program: level, duration, frequency.
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';

export default function ProgramFacts({ program }) {
  const { t } = useApp();
  const parts = [
    program.level && t(`level.${program.level}`),
    t('gp.weeks', { n: num(program.durationWeeks) }),
    t('gp.daysPerWeek', { n: num(program.daysPerWeek) }),
  ].filter(Boolean);
  return <p className="muted">{parts.join(' · ')}</p>;
}
