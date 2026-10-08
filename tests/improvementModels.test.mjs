import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getSearchResultScore, normalizeSearchText } from '../src/searchRanking.ts';
import { HEART_RECHARGE_MS as interval, getFullRechargeMs, normalizeHeartState } from '../src/heartSystem.ts';
import { normalizeFocusHistory, normalizeFocusSession, getFocusElapsedMs } from '../src/focusSession.ts';
import { canAnswerCheckpoint } from '../src/checkpointExamTiming.ts';

const result = (title) => ({ title, kind: 'Concept', subtitle: '' });
test('search expands phrases inside longer engineering queries without losing other terms', () => {
  for (const [title, query] of [['Operational amplifier gain', 'op amp gain'], ['ADC sampling', 'analog to digital converter sampling'], ['Printed circuit board layout', 'circuit board layout']]) {
    assert.notEqual(getSearchResultScore(result(title), query), null, query);
  }
  assert.equal(getSearchResultScore(result('Operational amplifier'), 'op amp transformer'), null);
});
test('engineering search preserves units, Greek aliases and accented names', () => {
  assert.equal(normalizeSearchText('Thévenin Ω µcontroller β φ'), 'thevenin ohm microcontroller beta phase');
  assert.notEqual(getSearchResultScore(result('Thevenin equivalent'), 'Thévenin'), null);
  assert.notEqual(getSearchResultScore(result('Microcontroller interrupts'), 'μcontroller'), null);
  assert.notEqual(getSearchResultScore(result('10 ohm resistor'), '10 Ω'), null);
});
test('short acronyms match complete tokens, not accidental word prefixes', () => {
  assert.equal(getSearchResultScore(result('Accuracy of measurements'), 'ac'), null);
  assert.equal(getSearchResultScore(result('Icon library'), 'ic'), null);
  assert.notEqual(getSearchResultScore(result('AC circuit'), 'ac'), null);
  assert.notEqual(getSearchResultScore(result('Alternating current'), 'ac'), null);
  assert.notEqual(getSearchResultScore(result('Capacitor'), 'capacitr'), null);
});
test('heart recharge cannot be pushed beyond ten minutes by a clock rollback', () => {
  assert.deepEqual(normalizeHeartState({ hearts: 4, nextHeartAt: 999999999 }, 1000), { hearts: 4, nextHeartAt: 1000 + interval });
  assert.deepEqual(normalizeHeartState({ hearts: 9, nextHeartAt: 1000 }, 1000), { hearts: 10, nextHeartAt: null });
});
test('full recharge countdown includes hearts already earned while the app was inactive', () => {
  assert.equal(getFullRechargeMs(2, 1000, 1000 + 3 * interval), 4 * interval);
  assert.equal(getFullRechargeMs(2, 1000, 1000 + 10 * interval), 0);
  assert.equal(getFullRechargeMs(8, null, 1000), 2 * interval);
});
const session = { id: 'focus', objectiveId: 'lab', objectiveTitle: 'Lab', durationMinutes: 10, startedAt: 1000, pausedAt: 2000, pausedDurationMs: 500, endedAt: null };
test('focus restoration bounds pause values to actual elapsed time', () => {
  const restored = normalizeFocusSession({ ...session, pausedAt: 1e100, pausedDurationMs: 1e100 }, 5000);
  assert.equal(restored.pausedAt, 5000);
  assert.equal(restored.pausedDurationMs, 4000);
  assert.equal(getFocusElapsedMs(restored, 9000), 0);
  assert.equal(normalizeFocusSession({ ...session, startedAt: 1e100 }, 5000), null);
  assert.equal(getFocusElapsedMs(normalizeFocusSession(session, 5000), 9000), 500);
});
test('focus statistics use one valid bounded record per session', () => {
  const record = { id: 'a', objectiveTitle: 'Lab', durationMinutes: 10, completedAt: 3000, energy: 'steady', outcome: 'completed', focusedSeconds: 99999 };
  const records = normalizeFocusHistory([record, { ...record, completedAt: 4000, focusedSeconds: 40 }, { ...record, id: 'b' }, { ...record, id: 'invalid', completedAt: 1e100 }], 5000);
  assert.deepEqual(records.map((r) => [r.id, r.focusedSeconds]), [['a', 40], ['b', 600]]);
});
test('checkpoint deadline is enforced at the instant of answering, including the exact boundary', () => {
  assert.equal(canAnswerCheckpoint({ completedAt: null, expiresAt: 2000 }, 1999), true);
  assert.equal(canAnswerCheckpoint({ completedAt: null, expiresAt: 2000 }, 2000), false);
  assert.equal(canAnswerCheckpoint({ completedAt: null, expiresAt: null }, 9000), true);
  assert.equal(canAnswerCheckpoint({ completedAt: 1000, expiresAt: null }, 9000), false);
  assert.equal(canAnswerCheckpoint(null), false);
});
