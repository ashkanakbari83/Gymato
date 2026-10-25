// Compact engagement line on a program card: likes, rating and (for the owner) views and sales.
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getProgramStats } from '../../lib/analytics.js';
import { num } from '../../lib/format.js';
import { Stars } from './Stars.jsx';

export default function ProgramStatsLine({ programId, owner = false }) {
  const { db } = useApp();
  const { likes, views, sales, avg, count } = getProgramStats(db, programId);
  return (
    <p className="stats-line">
      <span><Heart size={14} /> {num(likes)}</span>
      {owner && <span><Eye size={14} /> {num(views)}</span>}
      {owner && <span><ShoppingBag size={14} /> {num(sales)}</span>}
      <Stars value={avg} count={count} />
    </p>
  );
}
