// Trainer in the discovery list.
import { MapPin } from 'lucide-react';
import { locationLabel } from '../../data/locations.js';
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import { getPublishedPrograms } from '../../lib/marketplace.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';

export default function TrainerCard({ trainer, onOpen }) {
  const { db, lang, t } = useApp();
  const programs = getPublishedPrograms(db, trainer.id).length;

  return (
    <button className="card trainer-card" onClick={onOpen}>
      <Avatar user={trainer} size="lg" />
      <span className="trainer-main">
        <b>{trainer.name}</b>
        <small className="muted">
          <MapPin size={13} /> {locationLabel(trainer.province, trainer.city, lang) || t('trainer.noLocation')}
        </small>
        <span className="listing-tags">
          {(trainer.specialties ?? []).slice(0, 3).map((id) => (
            <Badge key={id}>{t(`focus.${id}`)}</Badge>
          ))}
        </span>
        <span className="listing-tags">
          {trainer.offersCoaching && <Badge tone="info">{t('trainer.offersCoaching')}</Badge>}
          <Badge tone="neutral">{t('trainer.programCount', { n: num(programs) })}</Badge>
        </span>
      </span>
    </button>
  );
}
