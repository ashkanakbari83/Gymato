// One coaching relationship, seen by the athlete or the trainer. What is shown depends on the viewer and
// on the phase (see requestPhase): decision, proposal, payment, active program, renewal, history.
import { Lock, Pencil, RefreshCw } from 'lucide-react';
import MealPlanView from '../components/nutrition/MealPlanView.jsx';
import ChatPanel from '../components/coaching/ChatPanel.jsx';
import ClientProgress from '../components/coaching/ClientProgress.jsx';
import OfferCard from '../components/coaching/OfferCard.jsx';
import RequestSummary from '../components/coaching/RequestSummary.jsx';
import StatusOverview from '../components/coaching/StatusOverview.jsx';
import TrainerDecision from '../components/coaching/TrainerDecision.jsx';
import { PhaseBadge, TypeBadge } from '../components/marketplace/Badges.jsx';
import SessionList from '../components/marketplace/SessionList.jsx';
import Empty from '../components/ui/Empty.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PaymentHistory } from '../components/payments/PaymentStatus.jsx';
import { chatState, hasCustomAccess } from '../lib/access.js';
import { findOpenOrder } from '../lib/domain/payments.js';
import { PHASE } from '../lib/constants.js';
import { formatDate, num } from '../lib/format.js';
import { describeCoaching, daysLeft } from '../lib/marketplace.js';
import { ReviewForm } from '../components/marketplace/ReviewSection.jsx';

export default function CoachingModal({ requestId }) {
  const { db, user, isTrainer, t, openCheckout, openCustomEditor, withdrawRequest, startWorkout, closeModal } = useApp();
  const request = db.requests.find((r) => r.id === requestId);

  // Only the two people involved may open it (an athlete can never open another athlete's coaching).
  if (!request || ![request.athleteId, request.trainerId].includes(user.id)) {
    return (
      <Sheet title={t('co.title')}>
        <Empty icon={Lock} title={t('co.notFoundTitle')} text={t('co.notFoundText')} />
      </Sheet>
    );
  }

  const item = describeCoaching(db, request);
  const { phase, athlete, trainer, program, subscription } = item;
  const other = isTrainer ? athlete : trainer;
  const canTrain = hasCustomAccess(db, user.id, program) && !isTrainer;
  const period = subscription?.startAt && `${formatDate(subscription.startAt, { month: 'short', day: 'numeric' })} – ${formatDate(subscription.endAt, { month: 'short', day: 'numeric' })}`;

  const hasMeal = (program?.mealPlan?.meals?.length ?? 0) > 0;
  const mealState = hasMeal ? 'included' : request.form.wantsMealPlan ? 'missing' : undefined;
  const orders = subscription ? db.payments.filter((p) => p.targetId === subscription.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
  const offerCard = (cta) => subscription && (
    <OfferCard price={subscription.price} renewalPrice={subscription.renewalPrice} durationDays={subscription.durationDays} meal={mealState}>
      {cta}
    </OfferCard>
  );
  const renewButton = (
    <button className="btn wide" onClick={() => openCheckout('coaching_renewal', subscription.id)}>
      <RefreshCw size={16} /> {t('co.renew')}
    </button>
  );

  /** Section for the viewer + phase. */
  const body = () => {
    if (isTrainer) {
      if (phase === PHASE.PENDING) return <TrainerDecision request={request} />;
      if (phase === PHASE.PREPARING) {
        return (
          <section className="co-section">
            <p className="muted">{t('co.trainer.preparing')}</p>
            <button className="btn wide" onClick={() => openCustomEditor(request.id)}>
              <Pencil size={16} /> {t('co.createProgram')}
            </button>
          </section>
        );
      }
      if ([PHASE.AWAITING_PAYMENT, PHASE.ACTIVE, PHASE.EXPIRED].includes(phase)) {
        return (
          <>
            {offerCard(null)}
            {period && <p className="muted">{t('co.period', { period })}</p>}
            {phase === PHASE.AWAITING_PAYMENT && <p className="locked-note"><Lock size={16} /> {t('co.trainer.awaitingPayment')}</p>}
            <button className="btn wide" onClick={() => openCustomEditor(request.id)}>
              <Pencil size={16} /> {t(phase === PHASE.AWAITING_PAYMENT ? 'co.editProposal' : 'co.modifyProgram')}
            </button>
            {program && phase !== PHASE.AWAITING_PAYMENT && <ClientProgress program={program} />}
          </>
        );
      }
      return <p className="muted">{t(`co.closed.${phase}`)}</p>;
    }

    // ---- athlete ----
    if (phase === PHASE.PENDING) {
      return (
        <section className="co-section">
          <p className="muted">{t('co.athlete.pending')}</p>
          <button className="btn ghost wide" onClick={() => withdrawRequest(request.id)}>{t('co.withdraw')}</button>
        </section>
      );
    }
    if (phase === PHASE.PREPARING) return <p className="muted">{t('co.athlete.preparing')}</p>;
    if (phase === PHASE.REJECTED) {
      return <p className="muted">{t('co.athlete.rejected')}{request.rejectionReason && ` — ${request.rejectionReason}`}</p>;
    }
    if (phase === PHASE.CANCELLED) return <p className="muted">{t('co.closed.cancelled')}</p>;
    if (phase === PHASE.AWAITING_PAYMENT) {
      return (
        <>
          <p className="locked-note"><Lock size={16} /> {t('co.athlete.locked')}</p>
          {offerCard(
            <button className="btn wide" onClick={() => openCheckout('coaching_initial', subscription.id)}>
              {t(subscription && findOpenOrder(db, user.id, 'coaching_initial', subscription.id) ? 'pay.continue' : 'pay.payNow')}
            </button>,
          )}
        </>
      );
    }
    if (phase === PHASE.ACTIVE) {
      return (
        <>
          <section className="co-section">
            <h3>{program.title}</h3>
            <p className="muted">
              {t('co.version', { n: num(program.version), date: formatDate(program.updatedAt, { month: 'short', day: 'numeric' }) })} · {t('co.daysLeft', { n: num(daysLeft(subscription)) })}
            </p>
            {program.notes && <p className="note-box">{program.notes}</p>}
            <MealPlanView plan={program.mealPlan} canLog />
            <SessionList program={program} canStart={canTrain} onStart={(session) => { startWorkout(program, session); closeModal(); }} />
          </section>
          {offerCard(renewButton)}
        </>
      );
    }
    return <>{/* expired */}<p className="locked-note"><Lock size={16} /> {t('co.athlete.expired')}</p>{offerCard(renewButton)}</>;
  };

  return (
    <Sheet title={other.name} size="wide">
      <div className="co-head">
        <TypeBadge kind="custom" />
        <PhaseBadge phase={phase} />
      </div>
      <StatusOverview item={item} />
      {body()}
      <PaymentHistory payments={orders} />
      <RequestSummary request={request} showBody={isTrainer} />
      <ChatPanel request={request} state={chatState(db, request)} />
      {!isTrainer && ['active', 'expired'].includes(phase) && (
        <section className="co-section">
          <h3>{t('review.coachingTitle')}</h3>
          <ReviewForm targetKind="coaching" targetId={request.id} />
        </section>
      )}
    </Sheet>
  );
}
