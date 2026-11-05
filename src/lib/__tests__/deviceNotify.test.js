import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_FEEDBACK, feedbackPrefs } from '../feedback.js';
import { askDevicePermission, canNotifyDevice, devicePermission, pickNewNotifications, showDeviceNotification } from '../deviceNotify.js';

const note = (id, userId, createdAt, read = false) => ({ id, userId, createdAt, read, type: 'message_new', params: {} });

test('only unread notifications of this user that were not announced yet are picked, oldest first', () => {
  const list = [note('c', 'u1', 30), note('a', 'u1', 10), note('b', 'u2', 20), note('d', 'u1', 40, true), note('e', 'u1', 50)];
  const picked = pickNewNotifications(list, 'u1', new Set(['e']));
  assert.deepEqual(picked.map((n) => n.id), ['a', 'c']);
  assert.deepEqual(pickNewNotifications(undefined, 'u1', new Set()), []);
});

test('device notifications are off by default and older saves get that default', () => {
  assert.equal(DEFAULT_FEEDBACK.deviceNotify, false);
  assert.equal(feedbackPrefs({ feedback: { sound: false } }).deviceNotify, false);
});

test('where the browser has no Notification support everything degrades quietly', async () => {
  assert.equal(canNotifyDevice(), false);
  assert.equal(devicePermission(), 'unsupported');
  assert.equal(await askDevicePermission(), 'unsupported');
  assert.equal(await showDeviceNotification({ title: 'x', body: 'y' }), false);
});
