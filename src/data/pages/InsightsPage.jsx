// Trainer: views, likes, reviews and income from programs and coaching.
import { ShoppingBag } from 'lucide-react';
import { ReviewList } from '../components/marketplace/ReviewSection.jsx';
import { Stars } from '../components/marketplace/Stars.jsx';
import Empty from '../components/ui/Empty.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getIncome, getIncomeByWeek, getProgramStats, getTrainerReviews, getTrainerStats } from '../lib/analytics.js';
import { decimal, formatDate, formatPrice, num } from '../lib/format.js';
import { getOwnPrograms } from '../lib/marketplace.js';

export default function InsightsPage() {
  const { db, user, isTrainer, t } = useApp();
  if (!isTrainer) return <Empty icon={ShoppingBag} title={t('co.notFoundTitle')} text={t('co.notFoundText')} />; // trainer-only page
  const stats = getTrainerStats(db, user.id);
  const income = getIncome(db, user.id);
  const weeks = getIncomeByWeek(db, user.id);
  const peak = Math.max(1, ...weeks.map((w) => w.amount));
  const programs = getOwnPrograms(db, user.id);
  const money = (amount) => formatPrice(amount, t);

  return (
    <div className="stack">
      <section className="stack">
        <h2 className="block-title">{t('insights.engagement')}</h2>
        <Metrics
          columns={2}
          items={[
            { value: stats.profileViews, label: t('insights.profileViews') },
            { value: stats.programViews, label: t('insights.programViews') },
            { value: stats.likes, label: t('insights.likes') },
            { text: stats.count ? `${decimal(stats.avg)} / ${num(5)}` : '—', label: t('insights.rating', {}) },
          ]}
        />
      </section>

      <section className="stack">
        <h2 className="block-title">{t('insights.income')}</h2>
        <Metrics
          columns={2}
          items={[
            { text: money(income.total), label: t('insights.total') },
            { text: money(income.last30), label: t('insights.last30') },
            { text: money(income.general), label: t('insights.general') },
            { text: money(income.coaching + income.renewals), label: t('insights.coaching') },
          ]}
        />
        <div className="panel">
          <div className="section-title"><h2>{t('insights.weekly')}</h2></div>
          <div className="bars">
            {weeks.map((week) => (
              <div key={week.start}>
                <span className={week.amount ? 'on' : ''} style={{ height: Math.max(6, (week.amount / peak) * 96) }} />
                <small>{formatDate(week.start, { month: 'numeric', day: 'numeric' })}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-title"><h2>{t('insights.byProgram')}</h2></div>
        {programs.length ? (
          <div className="list">
            {programs.map((program) => {
              const s = getProgramStats(db, program.id);
              return (
                <div className="row" key={program.id}>
                  <span className="row-main">
                    <b>{program.title}</b>
                    <small>{t('insights.programLine', { views: num(s.views), likes: num(s.likes), sales: num(s.sales) })}</small>
                  </span>
                  <span className="row-end"><Stars value={s.avg} count={s.count} />{money(s.revenue)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon={ShoppingBag} title={t('programs.emptyTrainerTitle')} text={t('programs.emptyTrainerText')} />
        )}
      </section>

      <section className="panel">
        <div className="section-title"><h2>{t('insights.transactions')}</h2></div>
        {income.payments.length ? (
          <div className="list">
            {income.payments.slice(0, 8).map((payment) => (
              <div className="row" key={payment.id}>
                <span className="row-main">
                  <b>{db.users.find((u) => u.id === payment.athleteId)?.name}</b>
                  <small>{t(`pay.kind.${payment.kind}`)} · {formatDate(payment.confirmedAt, { month: 'short', day: 'numeric' })}</small>
                </span>
                <span className="row-end">{money(payment.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{t('insights.noTransactions')}</p>
        )}
      </section>

      <section className="panel">
        <div className="section-title"><h2>{t('insights.recentReviews')}</h2></div>
        <ReviewList reviews={getTrainerReviews(db, user.id).slice(0, 5)} />
      </section>

      <p className="muted foot">{t('insights.note')}</p>
    </div>
  );
}
