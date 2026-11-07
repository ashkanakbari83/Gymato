// Trainer in the discovery list: who they are, how good they are, and what it costs to start.
import { Crown, MapPin } from 'lucide-react';
import { locationLabel } from '../../data/locations.js';
import { useApp } from '../../context/AppContext.jsx';
import { getTrainerReviews, ratingOf } from '../../lib/analytics.js';
import { isFreeProgram } from '../../lib/access.js';
import { groupNumber, num } from '../../lib/format.js';
import { getPublishedPrograms } from '../../lib/marketplace.js';
import { athleteCount, isPremium } from '../../lib/premium.js';
import Avatar from '../ui/Avatar.jsx';
import Badge from '../ui/Badge.jsx';
import { Stars } from './Stars.jsx';

const SHOWN_SPECIALTIES = 2;

export default function TrainerCard({ trainer, onOpen }) {
  const { db, lang, t } = useApp();
  const programs = getPublishedPrograms(db, trainer.id);
  const rating = ratingOf(getTrainerReviews(db, trainer.id));
  const paid = programs.filter((p) => !isFreeProgram(p)).map((p) => Number(p.price));
  const specialties = trainer.specialties ?? [];
  const featured = isPremium(trainer);
  const athletes = featured ? athleteCount(db, trainer.id) : 0;
  // What an athlete can start with: the cheapest paid program, or the fact that free ones exist.
  const entry = paid.length
    ? t('trainer.fromPrice', { price: `${groupNumber(Math.min(...paid))} ${t('common.currency')}` })
    : programs.length
      ? t('trainer.freePrograms')
      : '';

  return (
    <button className={`card trainer-card ${featured ? 'is-premium' : ''}`.trim()} onClick={onOpen}>
      {featured && <span className="premium-ribbon"><Crown size={15} aria-hidden="true" /> {t('premium.ribbon')}</span>}
      <Avatar user={trainer} size="lg" />
      <span className="trainer-main">
        <span className="trainer-name-row">
          <b>{trainer.name}</b>
          <Stars {...rating} value={rating.avg} />
        </span>
        {featured && trainer.bio && <span className="trainer-bio-line">{trainer.bio}</span>}
        <span className="trainer-meta-line">
          <span className="trainer-place"><MapPin size={13} /> {locationLabel(trainer.province, trainer.city, lang) || t('trainer.noLocation')}</span>
          {entry && <span className="trainer-entry">{entry}</span>}
          {athletes > 0 && <span className="trainer-athletes">{t('premium.athletes', { n: num(athletes) })}</span>}
        </span>
        <span className="listing-tags">
          {specialties.slice(0, SHOWN_SPECIALTIES).map((id) => (
            <Badge key={id}>{t(`focus.${id}`)}</Badge>
          ))}
          {trainer.offersCoaching && <Badge tone="info">{t('trainer.offersCoaching')}</Badge>}
        </span>
      </span>
    </button>
  );
}
