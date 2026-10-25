// A trainer's public profile: info, their published general programs, and the "Request Custom Coaching" action.
import { MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { ReviewList } from '../components/marketplace/ReviewSection.jsx';
import { Stars } from '../components/marketplace/Stars.jsx';
import { PhaseBadge } from '../components/marketplace/Badges.jsx';
import ProgramListing from '../components/marketplace/ProgramListing.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import { ArrowBack } from '../components/ui/Arrow.jsx';
import { locationLabel } from '../data/locations.js';
import { useApp } from '../context/AppContext.jsx';
import { hasGeneralAccess, isFreeProgram, requestPhase } from '../lib/access.js';
import { REQUEST_STATUS } from '../lib/constants.js';
import { formatPrice, num } from '../lib/format.js';
import { getTrainerReviews, ratingOf } from '../lib/analytics.js';
import { getPublishedPrograms } from '../lib/marketplace.js';

export default function TrainerProfilePage() {
  const { db, user, pageParams, go, openModal, lang, t, trackView } = useApp();
  const trainer = db.users.find((u) => u.id === pageParams.trainerId && u.role === 'coach');
  useEffect(() => { if (trainer) trackView('trainer', trainer.id); }, [trainer?.id, user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!trainer) return <Empty icon={MapPin} title={t('trainer.notFound')} text="" actionLabel={t('common.back')} onAction={() => go('trainers')} />;

  const programs = getPublishedPrograms(db, trainer.id);
  const isAthlete = user.role === 'athlete';
  const openRequest = db.requests.find(
    (r) => r.athleteId === user.id && r.trainerId === trainer.id && [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED].includes(r.status),
  );

  return (
    <div className="stack">
      <button className="link back-link" onClick={() => go('trainers')}>
        <ArrowBack size={16} /> {t('nav.trainers')}
      </button>

      <section className="panel trainer-head">
        <span className="avatar xl">{trainer.name[0]}</span>
        <div>
          <h1>{trainer.name}</h1>
          <p className="muted">
            <MapPin size={14} /> {locationLabel(trainer.province, trainer.city, lang) || t('trainer.noLocation')}
            {trainer.experienceYears > 0 && ` · ${t('trainer.experience', { n: num(trainer.experienceYears) })}`}
          </p>
          <Stars {...ratingOf(getTrainerReviews(db, trainer.id))} value={ratingOf(getTrainerReviews(db, trainer.id)).avg} />
          {trainer.bio && <p>{trainer.bio}</p>}
          <div className="listing-tags">
            {(trainer.specialties ?? []).map((id) => (
              <Badge key={id}>{t(`focus.${id}`)}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Two different services, explained side by side before anything is bought. */}
      <section className="panel service-compare">
        <div>
          <b>{t('trainer.generalTitle')}</b>
          <p className="muted">{t('trainer.generalText')}</p>
        </div>
        <div>
          <b>{t('trainer.customTitle')}</b>
          <p className="muted">{trainer.offersCoaching ? t('trainer.customText') : t('trainer.noCoaching')}</p>
          {isAthlete && trainer.offersCoaching &&
            (openRequest ? (
              <>
                <PhaseBadge phase={requestPhase(db, openRequest)} />{' '}
                <button className="btn ghost" onClick={() => openModal({ type: 'coaching', requestId: openRequest.id })}>{t('trainer.viewRequest')}</button>
              </>
            ) : (
              <button className="btn" onClick={() => openModal({ type: 'coaching-request', trainerId: trainer.id })}>{t('trainer.requestCoaching')}</button>
            ))}
        </div>
      </section>

      <div className="section-title">
        <h2>{t('trainer.programsTitle')}</h2>
      </div>
      <div className="grid-cards">
        {programs.map((program) => {
          const access = hasGeneralAccess(db, user.id, program);
          return (
            <ProgramListing key={program.id} program={program} locked={!access && !isFreeProgram(program)} onOpen={() => openModal({ type: 'general-program', programId: program.id })}>
              <button className="btn ghost" onClick={() => openModal({ type: 'general-program', programId: program.id })}>
                {t('gp.viewDetails')}
              </button>
              {isAthlete && !access && (
                <button className="btn" onClick={() => openModal({ type: 'general-program', programId: program.id })}>
                  {t('gp.buy', { price: formatPrice(program.price, t) })}
                </button>
              )}
            </ProgramListing>
          );
        })}
      </div>
      {!programs.length && <Empty icon={MapPin} title={t('trainer.noProgramsTitle')} text={t('trainer.noProgramsText')} />}

      <section className="panel">
        <div className="section-title"><h2>{t('review.title')}</h2></div>
        <ReviewList reviews={getTrainerReviews(db, trainer.id)} />
      </section>
    </div>
  );
}
