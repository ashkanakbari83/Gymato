// A trainer's public profile: photo, banner, bio, specialties, resume entries and an image album.
// Images are stored as downscaled JPEG data URLs inside the saved state (localStorage), which has a size limit (about
// 5 MB), so the whole state is measured before a save and refused (`storage_full`) instead of silently failing later.
import { FOCUS_AREAS } from '../constants.js';
import { uid } from '../format.js';
import { byId, fail, ok } from './shared.js';

export const RESUME_KINDS = ['work', 'certificate', 'award'];
export const PROFILE_LIMITS = { name: 60, bio: 600, experience: 60, resume: 20, resumeTitle: 80, resumePlace: 80, resumeText: 300, album: 12, caption: 80, storageChars: 4_500_000 };
export const IMAGE_SIZES = { avatar: 360, banner: 1280, album: 1080 };

const isImage = (value) => typeof value === 'string' && value.startsWith('data:image/');
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const blankRow = (row) => !clean(row.title, 999) && !clean(row.place, 999) && !clean(row.text, 999) && (row.year === '' || row.year == null);

/** Trims, caps and gives ids; only the keys present in `changes` are returned. */
export function sanitizeTrainerProfile(changes) {
  const out = {};
  if ('name' in changes) out.name = clean(changes.name, PROFILE_LIMITS.name);
  if ('province' in changes) out.province = changes.province ?? '';
  if ('city' in changes) out.city = changes.city ?? '';
  if ('bio' in changes) out.bio = String(changes.bio ?? '').trim();
  if ('experienceYears' in changes) out.experienceYears = changes.experienceYears === '' ? 0 : Number(changes.experienceYears);
  if ('offersCoaching' in changes) out.offersCoaching = Boolean(changes.offersCoaching);
  if ('specialties' in changes) out.specialties = [...new Set(changes.specialties ?? [])];
  if ('avatar' in changes) out.avatar = changes.avatar || '';
  if ('banner' in changes) out.banner = changes.banner || '';
  if ('resume' in changes) {
    out.resume = (changes.resume ?? []).filter((row) => !blankRow(row)).map((row) => ({
      id: row.id ?? uid(),
      kind: row.kind,
      title: String(row.title ?? '').trim(),
      place: String(row.place ?? '').trim(),
      year: row.year === '' || row.year == null ? '' : Number(row.year),
      text: String(row.text ?? '').trim(),
    }));
  }
  if ('album' in changes) out.album = (changes.album ?? []).map((item) => ({ id: item.id ?? uid(), src: item.src, caption: String(item.caption ?? '').trim() }));
  return out;
}

/** Field errors for sanitized changes. Resume rows are keyed `resume.<id>.<field>`, album items `album.<id>`. */
export function validateTrainerProfile(changes) {
  const errors = {};
  if ('name' in changes && !changes.name) errors.name = 'required';
  if ('bio' in changes && changes.bio.length > PROFILE_LIMITS.bio) errors.bio = 'too_long';
  if ('experienceYears' in changes && !(Number.isInteger(changes.experienceYears) && changes.experienceYears >= 0 && changes.experienceYears <= PROFILE_LIMITS.experience)) errors.experienceYears = 'invalid';
  if ('specialties' in changes && changes.specialties.some((id) => !FOCUS_AREAS.includes(id))) errors.specialties = 'invalid';
  if ('avatar' in changes && changes.avatar && !isImage(changes.avatar)) errors.avatar = 'invalid';
  if ('banner' in changes && changes.banner && !isImage(changes.banner)) errors.banner = 'invalid';
  if ('resume' in changes) {
    if (changes.resume.length > PROFILE_LIMITS.resume) errors.resume = 'too_many';
    for (const row of changes.resume) {
      if (!RESUME_KINDS.includes(row.kind)) errors[`resume.${row.id}.kind`] = 'invalid';
      if (!row.title) errors[`resume.${row.id}.title`] = 'required';
      else if (row.title.length > PROFILE_LIMITS.resumeTitle) errors[`resume.${row.id}.title`] = 'too_long';
      if (row.place.length > PROFILE_LIMITS.resumePlace) errors[`resume.${row.id}.place`] = 'too_long';
      if (row.text.length > PROFILE_LIMITS.resumeText) errors[`resume.${row.id}.text`] = 'too_long';
      if (row.year !== '' && !(Number.isInteger(row.year) && row.year >= 1300 && row.year <= 2100)) errors[`resume.${row.id}.year`] = 'invalid';
    }
  }
  if ('album' in changes) {
    if (changes.album.length > PROFILE_LIMITS.album) errors.album = 'too_many';
    for (const item of changes.album) {
      if (!isImage(item.src)) errors[`album.${item.id}`] = 'invalid';
      else if (item.caption.length > PROFILE_LIMITS.caption) errors[`album.${item.id}`] = 'too_long';
    }
  }
  return errors;
}

/** A trainer saves their own public profile. Only the keys given are changed; everything else is kept. */
export function updateTrainerProfile(db, userId, changes) {
  const trainer = byId(db.users, userId);
  if (!trainer || trainer.role !== 'coach') return fail('forbidden');
  const cleaned = sanitizeTrainerProfile(changes);
  const errors = validateTrainerProfile(cleaned);
  if (Object.keys(errors).length) return fail('validation', errors);

  const next = { ...db, users: db.users.map((u) => (u.id === userId ? { ...u, ...cleaned } : u)) };
  if (JSON.stringify(next).length > PROFILE_LIMITS.storageChars) return fail('storage_full'); // the browser would refuse to keep it
  return ok(next, { trainer: byId(next.users, userId) });
}
