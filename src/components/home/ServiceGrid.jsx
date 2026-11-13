// The home launcher: a raised card with the four main services, then groups of small tiles (icon on a coloured square,
// a label under it, an optional badge). What is in it comes from lib/homeServices.js.
import {
  Bell, CalendarDays, ChartNoAxesCombined, CircleHelp, Crown, Dumbbell, HeartPulse, MapPin, PersonStanding, Plus, Scale, Search, Settings,
  Share2, ShieldCheck, Target, User, Users, UtensilsCrossed, Weight, Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import { homeServices } from '../../lib/homeServices.js';

const ICONS = {
  bell: Bell, calendar: CalendarDays, chart: ChartNoAxesCombined, crown: Crown, dumbbell: Dumbbell, food: UtensilsCrossed, heart: HeartPulse,
  help: CircleHelp, pin: MapPin, plus: Plus, body: Scale, search: Search, settings: Settings, share: Share2, shield: ShieldCheck, stretch: PersonStanding,
  target: Target, user: User, users: Users, weight: Weight, zap: Zap,
};

function Tile({ tile, big, onRun }) {
  const { t } = useApp();
  const Icon = ICONS[tile.icon] ?? Dumbbell;
  const label = t(tile.label);
  const badge = tile.badge && (tile.badge.kind === 'count' ? num(tile.badge.value) : t(tile.badge.key));
  const spoken = tile.badge ? `${label}, ${tile.badge.kind === 'count' ? t('svc.badgeCount', { n: tile.badge.value }) : badge}` : label;
  return (
    <button className={`svc ${big ? 'big' : ''}`} onClick={() => onRun(tile.action)} aria-label={spoken}>
      <span className={`svc-icon tone-${tile.tone}`} aria-hidden="true">
        <Icon size={big ? 26 : 22} strokeWidth={2} />
        {badge && <i className={`svc-badge ${tile.badge.kind}`}>{badge}</i>}
      </span>
      <span className="svc-label" aria-hidden="true">{label}</span>
    </button>
  );
}

export default function ServiceGrid() {
  const { db, user, go, openModal, openGeneralEditor, t } = useApp();
  const { main, groups } = useMemo(() => homeServices(db, user), [db, user]);

  const run = (action) => {
    if (action.type === 'page') go(action.page, action.params ?? {});
    else if (action.type === 'modal') openModal(action.modal);
    else if (action.type === 'editor') openGeneralEditor();
    else if (action.type === 'tour') openModal({ type: 'tour' });
  };

  return (
    <nav className="svc-wrap" aria-label={t('svc.aria')}>
      <div className="svc-main" data-tour="main">
        {main.map((tile) => <Tile key={tile.id} tile={tile} big onRun={run} />)}
      </div>
      {groups.map((group) => (
        <section className="svc-group" key={group.id} data-tour={group.id === 'tools' ? 'tools' : undefined}>
          <h2 className="svc-title">{t(group.title)}</h2>
          <div className="svc-grid">
            {group.items.map((tile) => <Tile key={tile.id} tile={tile} onRun={run} />)}
          </div>
        </section>
      ))}
    </nav>
  );
}
