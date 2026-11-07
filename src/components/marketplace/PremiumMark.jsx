// A small "Featured" crown shown next to the name of a trainer who has an active Premium subscription.
import { Crown } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { isPremium } from '../../lib/premium.js';

export default function PremiumMark({ trainer }) {
  const { t } = useApp();
  if (!isPremium(trainer)) return null;
  return (
    <span className="premium-badge" title={t('premium.badgeTitle')}>
      <Crown size={12} aria-hidden="true" /> {t('premium.badge')}
    </span>
  );
}
