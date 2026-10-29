// Share cards: a picture of a program or a trainer (with a QR code) made on the phone with <canvas>, for
// Instagram stories, Telegram and so on. Everything is drawn here; nothing is sent to a server.
import qrcode from 'qrcode-generator';
import { locationLabel } from '../data/locations.js';
import { getProgramReviews, getTrainerReviews, ratingOf } from './analytics.js';
import { decimal, formatPrice, num } from './format.js';
import { getPublishedPrograms } from './marketplace.js';

export const FORMATS = {
  story: { width: 1080, height: 1920, margin: 88, title: 96, body: 46, chip: 38, qr: 300, tags: true },
  post: { width: 1080, height: 1080, margin: 80, title: 78, body: 40, chip: 32, qr: 216, tags: false },
};

const FONT = "'Vazirmatn', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
const ACCENT = '#ff4d00';
const PULSE_PATH = 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2';

/** The link a card points to. It carries the trainer's public ID and, for a program, the program ID. */
export function shareUrl({ trainer, program } = {}, base = typeof location === 'undefined' ? 'https://example.com/' : `${location.origin}${location.pathname}`) {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  if (trainer?.publicId) url.searchParams.set('trainer', trainer.publicId);
  if (program?.id) url.searchParams.set('program', program.id);
  return url.toString();
}

/** What a card shows, as plain strings (already translated and formatted). `t` is the translate function. */
export function buildProgramCard(db, program, t, lang) {
  const trainer = db.users.find((u) => u.id === program.ownerId);
  const { avg, count } = ratingOf(getProgramReviews(db, program.id));
  return {
    kind: t('share.kindProgram'),
    title: program.title,
    byline: t('gp.by', { name: trainer?.name ?? '' }),
    avatar: trainer?.name?.[0] ?? '',
    facts: [program.level && t(`level.${program.level}`), t('gp.weeks', { n: num(program.durationWeeks) }), t('gp.daysPerWeek', { n: num(program.daysPerWeek) })].filter(Boolean),
    tags: (program.goals ?? []).slice(0, 4).map((g) => t(`focus.${g}`)),
    price: formatPrice(program.price, t),
    free: !program.price,
    rating: count ? { score: decimal(avg, 1), count: t('share.reviews', { n: num(count) }) } : null,
    url: shareUrl({ trainer, program }),
    caption: t('share.captionProgram', { title: program.title, name: trainer?.name ?? '' }),
    cta: t('share.cta'),
    lang,
  };
}

export function buildTrainerCard(db, trainer, t, lang) {
  const { avg, count } = ratingOf(getTrainerReviews(db, trainer.id));
  const programs = getPublishedPrograms(db, trainer.id).length;
  return {
    kind: t('share.kindTrainer'),
    title: trainer.name,
    byline: locationLabel(trainer.province, trainer.city, lang) || '',
    avatar: trainer.name?.[0] ?? '',
    facts: [
      trainer.experienceYears > 0 && t('trainer.experience', { n: num(trainer.experienceYears) }),
      programs > 0 && t('trainer.programCount', { n: num(programs) }),
      trainer.offersCoaching && t('trainer.offersCoaching'),
    ].filter(Boolean),
    tags: (trainer.specialties ?? []).slice(0, 4).map((id) => t(`focus.${id}`)),
    price: null,
    free: false,
    rating: count ? { score: decimal(avg, 1), count: t('share.reviews', { n: num(count) }) } : null,
    url: shareUrl({ trainer }),
    caption: t('share.captionTrainer', { name: trainer.name }),
    cta: t('share.cta'),
    lang,
  };
}

/** Waits (briefly) for the app font, so the picture is not drawn in a fallback font. */
async function fontReady() {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const load = Promise.all([document.fonts.load(`400 40px Vazirmatn`, 'جیماتو'), document.fonts.load(`800 40px Vazirmatn`, 'جیماتو')]);
  await Promise.race([load, new Promise((resolve) => setTimeout(resolve, 1500))]).catch(() => {});
}

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

/** Draws `card` (see build*Card) onto a new canvas of the given format ('story' | 'post'). */
export async function renderShareCard(card, formatName = 'story') {
  await fontReady();
  const f = FORMATS[formatName] ?? FORMATS.story;
  const { width: W, height: H, margin: M } = f;
  const rtl = card.lang === 'fa';
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textBaseline = 'alphabetic';

  const start = rtl ? W - M : M; // x where a line begins (right edge in Persian)
  const dir = rtl ? -1 : 1; // direction lines and rows grow in
  const align = rtl ? 'right' : 'left';
  const font = (size, weight = 400) => (ctx.font = `${weight} ${size}px ${FONT}`);
  const textAt = (value, x, y, { size, weight = 400, color = '#fff', align: a = align } = {}) => {
    font(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = a;
    ctx.fillText(value, x, y);
  };

  // background: dark, with two soft warm glows
  ctx.fillStyle = '#0b0c0e';
  ctx.fillRect(0, 0, W, H);
  const glow = (x, y, r, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,77,0,${alpha})`);
    g.addColorStop(1, 'rgba(255,77,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(rtl ? W : 0, 0, W * 1.05, 0.42);
  glow(rtl ? 0 : W, H, W * 0.9, 0.2);

  let y = M;

  // brand row
  const mark = 84;
  const markX = rtl ? W - M - mark : M;
  ctx.fillStyle = ACCENT;
  roundRect(ctx, markX, y, mark, mark, 22);
  ctx.fill();
  ctx.save();
  ctx.translate(markX + mark * 0.2, y + mark * 0.2);
  ctx.scale((mark * 0.6) / 24, (mark * 0.6) / 24);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(PULSE_PATH));
  ctx.restore();
  textAt('جیماتو', markX + dir * (mark + 22), y + 60, { size: 52, weight: 800 });
  y += mark + (formatName === 'story' ? 96 : 52);

  // kind pill
  font(f.chip - 4, 600);
  const pillW = ctx.measureText(card.kind).width + 56;
  const pillX = rtl ? start - pillW : start;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, pillX, y, pillW, 62, 31);
  ctx.stroke();
  textAt(card.kind, pillX + pillW / 2, y + 42, { size: f.chip - 4, weight: 600, color: '#ffb899', align: 'center' });
  y += 62 + (formatName === 'story' ? 64 : 40);

  // title, wrapped to at most 3 lines (shrinks a little when it is long)
  const maxWidth = W - 2 * M;
  const wrap = (value, size, weight) => {
    font(size, weight);
    const lines = [];
    let line = '';
    for (const word of String(value).split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  let titleSize = f.title;
  let lines = wrap(card.title, titleSize, 800);
  while (lines.length > 3 && titleSize > 56) lines = wrap(card.title, (titleSize -= 8), 800);
  lines = lines.slice(0, 3);
  for (const line of lines) {
    y += titleSize * 1.05;
    textAt(line, start, y, { size: titleSize, weight: 800 });
    y += titleSize * 0.3;
  }
  y += formatName === 'story' ? 36 : 22;

  // byline with the trainer's initial
  if (card.byline) {
    const r = f.body * 0.9;
    const cx = rtl ? start - r : start + r;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(cx, y + r * 0.62, r, 0, Math.PI * 2);
    ctx.fill();
    textAt(card.avatar, cx, y + r * 0.62 + f.body * 0.34, { size: f.body, weight: 800, align: 'center' });
    textAt(card.byline, start + dir * (2 * r + 22), y + r * 0.62 + f.body * 0.34, { size: f.body, weight: 600, color: 'rgba(255,255,255,0.82)' });
    y += 2 * r + (formatName === 'story' ? 52 : 30);
  }

  // chips (facts, then topic tags on the story format), wrapping onto new rows
  const chipH = f.chip * 1.9;
  const chipRow = (items, filled) => {
    if (!items.length) return;
    let x = start;
    font(f.chip, 600);
    for (const label of items) {
      const w = ctx.measureText(label).width + 44;
      if ((rtl && x - w < M) || (!rtl && x + w > W - M)) {
        x = start;
        y += chipH + 16;
      }
      const left = rtl ? x - w : x;
      ctx.fillStyle = filled ? 'rgba(255,255,255,0.12)' : 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2;
      roundRect(ctx, left, y, w, chipH, chipH / 2);
      if (filled) ctx.fill();
      else ctx.stroke();
      textAt(label, left + w / 2, y + chipH / 2 + f.chip * 0.34, { size: f.chip, weight: 600, align: 'center', color: filled ? '#fff' : 'rgba(255,255,255,0.8)' });
      x += dir * (w + 14);
    }
    y += chipH + 24;
  };
  chipRow(card.facts, true);
  if (f.tags) chipRow(card.tags, false);

  // rating
  if (card.rating) {
    const r = f.body * 0.5;
    const cx = rtl ? start - r : start + r;
    const cy = y + f.body * 0.55;
    ctx.fillStyle = '#ffc24b';
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const rad = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
    // score and review count are drawn as two separate texts, so a separator can never reorder the digits
    const scoreX = start + dir * (2 * r + 18);
    const scoreSize = f.body * 0.95;
    textAt(card.rating.score, scoreX, y + f.body * 0.88, { size: scoreSize, weight: 800, color: '#fff' });
    font(scoreSize, 800);
    const scoreW = ctx.measureText(card.rating.score).width;
    textAt(card.rating.count, scoreX + dir * (scoreW + 18), y + f.body * 0.88, { size: f.body * 0.85, weight: 400, color: 'rgba(255,255,255,0.7)' });
    y += f.body * 1.5;
  }

  // bottom block: price + call to action on the reading side, QR code on the other
  const qrBox = f.qr;
  const bottomY = H - M - qrBox;
  const qr = qrcode(0, 'M');
  qr.addData(card.url);
  qr.make();
  const qrX = rtl ? M : W - M - qrBox;
  ctx.fillStyle = '#fff';
  roundRect(ctx, qrX, bottomY, qrBox, qrBox, 28);
  ctx.fill();
  const quiet = qrBox * 0.07;
  const cell = (qrBox - 2 * quiet) / qr.getModuleCount();
  ctx.fillStyle = '#0b0c0e';
  for (let row = 0; row < qr.getModuleCount(); row += 1) {
    for (let col = 0; col < qr.getModuleCount(); col += 1) {
      if (qr.isDark(row, col)) ctx.fillRect(Math.floor(qrX + quiet + col * cell), Math.floor(bottomY + quiet + row * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }

  let textY = bottomY + qrBox - (formatName === 'story' ? 4 : 0);
  textAt(card.cta, start, textY - 6, { size: f.body, weight: 800 });
  try {
    textAt(new URL(card.url).host, start, textY - 6 - f.body * 1.2, { size: f.body * 0.7, color: 'rgba(255,255,255,0.6)', weight: 400 });
  } catch {
    // not a valid URL: skip the host line
  }
  if (card.price) {
    const label = card.price;
    // the pill must never run into the QR code: shrink the text until it fits the free width
    const room = W - 2 * M - qrBox - 32;
    let size = f.title * 0.78;
    font(size, 800);
    const natural = ctx.measureText(label).width + 56;
    if (natural > room) size = Math.max(f.body, (size * (room - 56)) / (natural - 56));
    const priceY = bottomY + size * 0.95;
    font(size, 800);
    const w = ctx.measureText(label).width + 56;
    const left = rtl ? start - w : start;
    ctx.fillStyle = card.free ? '#16a34a' : ACCENT;
    roundRect(ctx, left, bottomY, w, size * 1.35, 24);
    ctx.fill();
    textAt(label, left + w / 2, priceY + size * 0.02, { size, weight: 800, align: 'center' });
  }
  return canvas;
}

export const canvasToBlob = (canvas) => new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png'));
