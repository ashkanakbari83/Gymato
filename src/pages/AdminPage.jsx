// Admin panel (admins only): the whole platform at a glance, the Featured places of every province, top trainers, money
// and the few settings an admin can change. Everything is computed from the saved state on this device.
import { Crown, Minus, Plus, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import Avatar from '../components/ui/Avatar.jsx';
import Badge from '../components/ui/Badge.jsx';
import Empty from '../components/ui/Empty.jsx';
import Metrics from '../components/ui/Metrics.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getProvince } from '../data/locations.js';
import { SETTING_LIMITS, TRAINER_SORTS, isAdmin, monthlyRevenue, platformStats, premiumRoster, provinceTable, recentPayments, topTrainers, updateSettings } from '../lib/admin.js';
import { decimal, formatDate, formatMoney, num } from '../lib/format.js';

/** A number with − / + buttons that saves as soon as it changes. */
function SettingStepper({ id, value, onChange, label, hint, suffix = '', t }) {
  const { min, max } = SETTING_LIMITS[id];
  return (
    <div className="admin-setting">
      <div>
        <b>{label}</b>
        <small>{hint}</small>
      </div>
      <div className="stepper" role="group" aria-label={label}>
        <button className="icon-btn" aria-label={t('admin.decrease')} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={18} /></button>
        <div><b>{num(value)}{suffix}</b></div>
        <button className="icon-btn" aria-label={t('admin.increase')} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={18} /></button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { db, user, dispatch, notify, go, lang, t } = useApp();
  const [sortBy, setSortBy] = useState('score');
  if (!isAdmin(user)) return <Empty icon={ShieldCheck} title={t('admin.noAccessTitle')} text={t('admin.noAccessText')} />;

  const stats = platformStats(db);
  const months = monthlyRevenue(db);
  const peak = Math.max(1, ...months.map((m) => m.volume + m.premium));
  const provinces = provinceTable(db).filter((row) => row.trainers + row.athletes > 0);
  const top = topTrainers(db, { by: sortBy, limit: 8 });
  const roster = premiumRoster(db);
  const payments = recentPayments(db, 8);
  const money = (amount) => formatMoney(amount, t);
  const name = (id) => getProvince(id)?.[lang] ?? id;
  const slots = db.settings?.premiumSlots ?? 6;
  const rate = stats.commissionRate;

  const save = (patch) => {
    const result = dispatch(updateSettings, user.id, patch);
    if (result.ok) notify(t('admin.saved'));
  };
  const sortValue = (row) => ({ score: decimal(row.score), athletes: num(row.athletes), income: money(row.income), rating: row.count ? `${decimal(row.avg)} / ${num(5)}` : '—' })[sortBy];

  return (
    <div className="stack desk-grid admin-page">
      <p className="muted admin-note">{t('admin.note')}</p>

      <section className="stack half">
        <h2 className="block-title">{t('admin.overview')}</h2>
        <Metrics
          columns={2}
          items={[
            { value: stats.users, label: t('admin.users') },
            { value: stats.trainers, label: t('admin.trainers') },
            { value: stats.athletes, label: t('admin.athletes') },
            { value: stats.featured, label: t('admin.featured') },
            { value: stats.activeSubscriptions, label: t('admin.activeSubs') },
            { value: stats.pendingRequests, label: t('admin.pendingRequests') },
            { value: stats.programs, label: t('admin.programs') },
            { text: stats.reviews ? `${decimal(stats.avgRating)} / ${num(5)}` : '—', label: t('admin.avgRating') },
          ]}
        />
      </section>

      <section className="stack half">
        <h2 className="block-title">{t('admin.money')}</h2>
        <Metrics
          columns={2}
          items={[
            { text: money(stats.volumeLast30), label: t('admin.volume30') },
            { text: money(stats.volume), label: t('admin.volumeTotal') },
            { text: money(stats.mrr), label: t('admin.mrr') },
            { text: money(stats.premiumRevenue), label: t('admin.premiumTotal') },
            { text: money(stats.commissionLast30), label: t('admin.commission30') },
            { text: money(stats.commission), label: t('admin.commissionEst') },
          ]}
        />
      </section>

      <section className="panel">
        <div className="section-title"><h2>{t('admin.monthly')}</h2></div>
        <div className="bars admin-bars">
          {months.map((month) => (
            <div key={month.start}>
              <span className="admin-bar" style={{ height: Math.max(6, ((month.volume + month.premium) / peak) * 96) }} title={money(month.volume + month.premium)}>
                <i className="premium" style={{ flexGrow: month.premium }} />
                <i className="volume" style={{ flexGrow: month.volume }} />
              </span>
              <small>{formatDate(month.start, { month: 'short', day: 'numeric' })}</small>
            </div>
          ))}
        </div>
        <p className="muted admin-legend"><span className="dot volume" /> {t('admin.legendVolume')} · <span className="dot premium" /> {t('admin.legendPremium')}</p>
        <p className="muted">{t('admin.monthlyHint')}</p>
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('admin.settings')}</h2></div>
        <SettingStepper id="premiumSlots" value={slots} label={t('admin.slots')} hint={t('admin.slotsHint')} onChange={(value) => save({ premiumSlots: value })} t={t} />
        <SettingStepper id="commissionRate" value={rate} suffix="٪" label={t('admin.commissionRate')} hint={t('admin.commissionHint')} onChange={(value) => save({ commissionRate: value })} t={t} />
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('admin.provinces')}</h2></div>
        <div className="list">
          {provinces.map((row) => (
            <div className="row" key={row.id}>
              <span className="row-main">
                <b>{name(row.id)}</b>
                <small>{t('admin.provinceLine', { trainers: num(row.trainers), athletes: num(row.athletes) })}</small>
              </span>
              <span className="row-end">
                {row.full && <Badge tone="warn">{t('admin.full')}</Badge>}
                <span className="admin-slots"><Crown size={13} aria-hidden="true" /> {t('admin.slotsUsed', { used: num(row.used), total: num(row.total) })}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('admin.top')}</h2></div>
        <div className="chips" role="group" aria-label={t('admin.top')}>
          {TRAINER_SORTS.map((id) => (
            <button key={id} className={sortBy === id ? 'on' : ''} aria-pressed={sortBy === id} onClick={() => setSortBy(id)}>{t(`admin.sort.${id}`)}</button>
          ))}
        </div>
        <div className="list">
          {top.map((row, i) => (
            <button className="row admin-trainer" key={row.trainer.id} onClick={() => go('trainer', { trainerId: row.trainer.id })}>
              <span className="admin-rank" aria-hidden="true">{num(i + 1)}</span>
              <Avatar user={row.trainer} />
              <span className="row-main">
                <b>{row.trainer.name} {row.featured && <Crown size={13} className="admin-crown" aria-label={t('premium.badgeTitle')} />}</b>
                <small>{t('admin.trainerLine', { score: decimal(row.score), athletes: num(row.athletes), n: num(row.count) })}</small>
              </span>
              <span className="row-end"><b>{sortValue(row)}</b></span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('admin.roster')} <small>({num(roster.length)})</small></h2></div>
        {roster.length ? (
          <div className="list">
            {roster.slice(0, 12).map(({ trainer, daysLeft }) => (
              <button className="row admin-trainer" key={trainer.id} onClick={() => go('trainer', { trainerId: trainer.id })}>
                <Avatar user={trainer} />
                <span className="row-main">
                  <b>{trainer.name}</b>
                  <small>{name(trainer.province)}</small>
                </span>
                <span className="row-end"><Badge tone={daysLeft <= 7 ? 'warn' : 'ok'}>{t('admin.daysLeft', { n: num(daysLeft) })}</Badge></span>
              </button>
            ))}
          </div>
        ) : <p className="muted">{t('admin.rosterEmpty')}</p>}
      </section>

      <section className="panel half">
        <div className="section-title"><h2>{t('admin.recent')}</h2></div>
        <div className="list">
          {payments.map(({ payment, payer, payee }) => (
            <div className="row" key={payment.id}>
              <span className="row-main">
                <b>{t(`pay.kind.${payment.kind}`)}</b>
                <small>{t('admin.paymentLine', { payer: payer?.name ?? '—', payee: payee?.name ?? t('admin.platform') })} · {formatDate(payment.paidAt)}</small>
              </span>
              <span className="row-end"><b>{money(payment.amount)}</b></span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
