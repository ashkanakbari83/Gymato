import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CUES, DEFAULT_FEEDBACK, countdownCue, feedbackPrefs, playCue } from '../feedback.js';

test('the last three seconds tick, zero ends, everything else is silent', () => {
  assert.deepEqual([5, 4, 3, 2, 1, 0, -1].map(countdownCue), [null, null, 'tick', 'tick', 'tick', 'done', null]);
});

test('every cue has at least one tone and a vibration pattern', () => {
  for (const [name, cue] of Object.entries(CUES)) {
    assert.ok(cue.tones.length > 0, name);
    assert.ok(cue.vibrate, name);
    for (const tone of cue.tones) assert.ok(tone.freq > 100 && tone.ms > 0, name);
  }
});

test('preferences fall back to defaults for older saves', () => {
  assert.deepEqual(feedbackPrefs({}), DEFAULT_FEEDBACK);
  assert.deepEqual(feedbackPrefs({ feedback: { sound: false } }), { ...DEFAULT_FEEDBACK, sound: false });
});

test('playing a cue where there is no audio or vibration support does nothing and does not throw', () => {
  assert.doesNotThrow(() => playCue('restEnd'));
  assert.doesNotThrow(() => playCue('unknown-cue'));
});
