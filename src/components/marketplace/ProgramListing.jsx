// A general program as shown to athletes (trainer profile, library) and to its trainer.
import { useApp } from '../../context/AppContext.jsx';
import Badge from '../ui/Badge.jsx';
import ProgramStatsLine from './ProgramStatsLine.jsx';
import { PriceBadge, TypeBadge } from './Badges.jsx';
import ProgramFacts from './ProgramFacts.jsx';

/** `children` is the action area (buttons). `locked` dims the card for athletes without access. */
export default function ProgramListing({ program, status, locked = false, owner = false, onOpen, children }) {
  const { t } = useApp();
  return (
    <article className={`card listing ${locked ? 'is-locked' : ''}`}>
      <div className="listing-badges">
        <TypeBadge kind={program.kind} />
        <PriceBadge amount={program.price} />
        {status}
      </div>
      <h3>
        <button className="link-plain" onClick={onOpen}>
          {program.title}
        </button>
      </h3>
      <ProgramFacts program={program} />
      {program.description && <p className="listing-desc">{program.description}</p>}
      <ProgramStatsLine programId={program.id} owner={owner} />
      <div className="listing-tags">
        {program.goals.slice(0, 4).map((goal) => (
          <Badge key={goal}>{t(`focus.${goal}`)}</Badge>
        ))}
      </div>
      {children && <div className="listing-actions">{children}</div>}
    </article>
  );
}
