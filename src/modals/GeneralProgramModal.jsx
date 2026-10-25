// A general program: details and price up front; instructions only after access (free or confirmed purchase).
import { Check, Lock, X } from 'lucide-react';
import { useEffect } from 'react';
import LikeButton from '../components/marketplace/LikeButton.jsx';
import { ReviewForm, ReviewList } from '../components/marketplace/ReviewSection.jsx';
import { Stars } from '../components/marketplace/Stars.jsx';
import { PriceBadge, TypeBadge } from '../components/marketplace/Badges.jsx';
import ProgramFacts from '../components/marketplace/ProgramFacts.jsx';
import SessionList from '../components/marketplace/SessionList.jsx';
import Badge from '../components/ui/Badge.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { hasGeneralAccess, isFreeProgram } from '../lib/access.js';
import { getProgramReviews, ratingOf } from '../lib/analytics.js';
import { formatPrice, num } from '../lib/format.js';

export default function GeneralProgramModal({ programId }) {
  const { db, user, t, openCheckout, claimFree, startWorkout, closeModal, trackView } = useApp();
  const program = db.programs.find((p) => p.id === programId);
  useEffect(() => { if (program) trackView('program', programId); }, [programId, user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!program) return null;

  const trainer = db.users.find((u) => u.id === program.ownerId);
  const isAthlete = user.role === 'athlete';
  const isFree = isFreeProgram(program);
  const hasAccess = hasGeneralAccess(db, user.id, program);
  const inLibrary = db.freeLibrary.some((e) => e.athleteId === user.id && e.programId === program.id);

  return (
    <Sheet title={program.title}>
      <div className="co-head">
        <TypeBadge kind={program.kind} />
        <PriceBadge amount={program.price} />
        {program.status !== 'published' && <Badge tone="warn">{t('programStatus.draft')}</Badge>}
      </div>
      <p className="muted">{t('gp.by', { name: trainer.name })}</p>
      <div className="stats-line">
        <LikeButton programId={program.id} />
        <Stars {...ratingOf(getProgramReviews(db, program.id))} value={ratingOf(getProgramReviews(db, program.id)).avg} />
      </div>
      <ProgramFacts program={program} />
      <p>{program.description}</p>
      <div className="listing-tags">{program.goals.map((goal) => <Badge key={goal}>{t(`focus.${goal}`)}</Badge>)}</div>
      <p className="muted">{t('gp.exerciseCount', { n: num(program.exercises.length) })}</p>

      {/* The distinction between the two services is always stated before purchase. */}
      <section className="notice">
        <b>{t('gp.includedTitle')}</b>
        <ul>
          <li><Check size={15} /> {t('gp.inc.instructions')}</li>
          <li><X size={15} /> {t('gp.inc.noCoaching')}</li>
        </ul>
        <small>{t('gp.coachingHint')}</small>
      </section>

      {hasAccess ? (
        <>
          {program.notes && <p className="note-box">{program.notes}</p>}
          {program.safety && <p className="note-box warn">{program.safety}</p>}
          <SessionList program={program} canStart={isAthlete} onStart={(session) => { startWorkout(program, session); closeModal(); }} />
          {isAthlete && isFree && !inLibrary && (
            <button className="btn ghost wide" onClick={() => claimFree(program.id)}>{t('gp.addFree')}</button>
          )}
        </>
      ) : (
        <section className="co-section locked">
          <p className="locked-note"><Lock size={16} /> {t('gp.locked')}</p>
          {isAthlete && program.status === 'published' && (
            <button className="btn wide" onClick={() => openCheckout('general_purchase', program.id)}>
              {t('gp.buy', { price: formatPrice(program.price, t) })}
            </button>
          )}
        </section>
      )}
      <section className="co-section">
        <h3>{t('review.title')}</h3>
        <ReviewList reviews={getProgramReviews(db, program.id)} />
        {isAthlete && <ReviewForm targetKind="program" targetId={program.id} />}
      </section>
    </Sheet>
  );
}
