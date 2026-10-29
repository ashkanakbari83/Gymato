// Sound and vibration cues for the workout player. Everything is optional (the person can turn sound and
// vibration off in Settings) and best-effort: a browser without Web Audio or the Vibration API (iPhone has
// no vibration) simply does nothing.

/** What each cue sounds and feels like. `at` is the delay (ms) of a tone inside the cue. */
export const CUES = {
  tick: { tones: [{ freq: 660, ms: 90 }], vibrate: 25 }, // last seconds of a rest
  restEnd: { tones: [{ freq: 880, ms: 150 }, { freq: 1175, ms: 260, at: 190 }], vibrate: [180, 70, 180] },
  timerEnd: { tones: [{ freq: 988, ms: 160 }, { freq: 988, ms: 160, at: 220 }, { freq: 1319, ms: 300, at: 440 }], vibrate: [150, 60, 150, 60, 300] },
  finish: { tones: [{ freq: 784, ms: 140 }, { freq: 988, ms: 140, at: 170 }, { freq: 1319, ms: 360, at: 340 }], vibrate: [120, 60, 120, 60, 400] },
};

export const DEFAULT_FEEDBACK = { sound: true, vibrate: true, keepAwake: true };

/** Which cue to play when `secondsLeft` seconds of a countdown remain (null: nothing this second). */
export function countdownCue(secondsLeft) {
  if (secondsLeft === 0) return 'done';
  return secondsLeft >= 1 && secondsLeft <= 3 ? 'tick' : null;
}

/** Preferences with defaults for anything missing (older saves have none). */
export const feedbackPrefs = (db) => ({ ...DEFAULT_FEEDBACK, ...(db?.feedback ?? {}) });

export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
export const canKeepAwake = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

let context = null;

/** The shared AudioContext. Browsers only allow it to start after a tap, so call unlockAudio() from one. */
function audio() {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      context = new AudioContextClass();
    } catch {
      return null;
    }
  }
  if (context.state === 'suspended') context.resume?.().catch(() => {});
  return context;
}

/** Call from a tap (start workout, log a set, test button) so later cues are allowed to play. */
export const unlockAudio = () => void audio();

function playTone(ctx, { freq, ms, at = 0 }) {
  const start = ctx.currentTime + at / 1000;
  const end = start + ms / 1000;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  // short fade in/out so the beep does not click
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.28, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

/** Plays one cue ('tick' | 'restEnd' | 'timerEnd' | 'finish') according to the preferences { sound, vibrate }. */
export function playCue(name, prefs = DEFAULT_FEEDBACK) {
  const cue = CUES[name];
  if (!cue) return;
  if (prefs.sound) {
    const ctx = audio();
    if (ctx) cue.tones.forEach((tone) => playTone(ctx, tone));
  }
  if (prefs.vibrate && canVibrate()) navigator.vibrate(cue.vibrate);
}
