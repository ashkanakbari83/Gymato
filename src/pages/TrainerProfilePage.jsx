// A trainer's public profile: info, their published general programs, and the "Request Custom Coaching" action.
import { Images, MapPin, Share2, UserPen } from 'lucide-react';
import { useEffect } from 'react';
import { ReviewList } from '../components/marketplace/ReviewSection.jsx';
import { Stars } from '../components/marketplace/Stars.jsx';
import { PhaseBadge } from '../components/marketplace/Badges.jsx';
import ProgramListing from '../components/marketplace/ProgramListing.jsx';
import TrainerAlbum from '../components/trainer/TrainerAlbum.jsx';
import TrainerResume from '../components/trainer/TrainerResume.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import { ArrowBack } from '../components/ui/Arrow.jsx';
import { locationLabel } from '../data/locations.js';
import { useApp } from '../context/AppContext.jsx';
import { hasGeneralAccess, isFreeProgram, requestPhase } from '../lib/access.js';
import { REQUEST_STATUS } from '../lib/constants.js';
import { formatPrice, num } from '../lib/format.js';
import { getStudentStats, getTrainerReviews, ratingOf } from '../lib/analytics.js';
import { getPublishedPrograms } from '../lib/marketplace.js';

export default function TrainerProfilePage() {
  const { db, user, pageParams, go, openModal, lang, t, trackView } = useApp();
  const trainer = db.users.find((u) => u.id === pageParams.trainerId && u.role === 'coach');
  useEffect(() => { if (trainer) trackView('trainer', trainer.id); }, [trainer?.id, user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!trainer) return <Empty icon={MapPin} title={t('trainer.notFound')} text="" actionLabel={t('common.back')} onAction={() => go('trainers')} />;

  const programs = getPublishedPrograms(db, trainer.id);
  const rating = ratingOf(getTrainerReviews(db, trainer.id));
  const students = getStudentStats(db, trainer.id);
  const resume = trainer.resume ?? [];
  const album = trainer.album ?? [];
  const isOwn = user.id === trainer.id;
  const isAthlete = user.role === 'athlete';
  const openRequest = db.requests.find(
    (r) => r.athleteId === user.id && r.trainerId === trainer.id && [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED].includes(r.status),
  );

  return (
    <div className="stack">
      <button className="link back-link" onClick={() => go('trainers')}>
        <ArrowBack size={16} /> {t('nav.trainers')}
      </button>

      <section className="panel trainer-hero">
        <div className={`trainer-banner ${trainer.banner ? '' : 'is-default'}`}>
          {trainer.banner && <img src={trainer.banner} alt={t('trainer.bannerAlt', { name: trainer.name })} />}
        </div>
        <div className="trainer-hero-body">
          <Avatar user={trainer} size="xl" className="hero-avatar" />
          <div className="trainer-hero-main">
            <div className="trainer-title-row">
              <h1>{trainer.name}</h1>
              <div className="trainer-title-actions">
                {isOwn && (
                  <button className="btn ghost" onClick={() => go('profile')}><UserPen size={16} /> {t('trainer.editProfile')}</button>
                )}
                <button className="icon-btn sm" onClick={() => openModal({ type: 'share', kind: 'trainer', id: trainer.id })} aria-label={t('share.title')}>
                  <Share2 size={17} />
                </button>
              </div>
            </div>
            <p className="muted trainer-meta">
              <span>
                <MapPin size={14} /> {locationLabel(trainer.province, trainer.city, lang) || t('trainer.noLocation')}
              </span>
            </p>
            <Stars {...rating} value={rating.avg} />
          </div>
        </div>

        <dl className="trainer-stats">
          <div><dt>{t('trainer.stat.active')}</dt><dd>{num(students.active)}</dd></div>
          <div><dt>{t('trainer.stat.total')}</dt><dd>{num(students.total)}</dd></div>
          <div><dt>{t('trainer.stat.programs')}</dt><dd>{num(programs.length)}</dd></div>
          <div><dt>{t('trainer.stat.experience')}</dt><dd>{trainer.experienceYears > 0 ? t('trainer.yearsShort', { n: num(trainer.experienceYears) }) : '—'}</dd></div>
        </dl>

        {trainer.bio ? <p className="trainer-bio">{trainer.bio}</p> : <p className="muted">{t(isOwn ? 'trainer.bioEmptyOwn' : 'trainer.bioEmpty')}</p>}
        {(trainer.specialties ?? []).length > 0 && (
          <div className="listing-tags">
            {trainer.specialties.map((id) => (
              <Badge key={id}>{t(`focus.${id}`)}</Badge>
            ))}
          </div>
        )}
      </section>

      {resume.length > 0 && (
        <section className="panel">
          <div className="section-title"><h2>{t('resume.title')}</h2></div>
          <TrainerResume resume={resume} />
        </section>
      )}
      {album.length > 0 && (
        <section className="panel">
          <div className="section-title"><h2>{t('album.title')}</h2></div>
          <TrainerAlbum album={album} trainerName={trainer.name} />
        </section>
      )}
      {isOwn && (resume.length === 0 || album.length === 0) && (
        <section className="panel">
          <Empty icon={Images} title={t('trainer.completeTitle')} text={t('trainer.completeText')} actionLabel={t('trainer.editProfile')} onAction={() => go('profile')} />
        </section>
      )}

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
