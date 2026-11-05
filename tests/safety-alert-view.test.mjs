import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterSafetyAlerts, safeAlertFileUrl, SAFETY_ALERT_CATEGORIES } from '../lib/safety-alert-view.ts';
const alerts = [
  { id: '1', stripNumber: 'SA-002', category: 'LTI', title: 'Loading', shortDescription: 'Example incident', location: 'Site A', date: '2026-10-01', files: [] },
  { id: '2', stripNumber: 'SA-001', category: 'Fatal', title: 'Maintenance', shortDescription: 'Example', location: 'Site B', date: '2026-10-03', files: [] }
];
test('filters categories and searches strip number and descriptions without mutating source', () => {
  assert.deepEqual(filterSafetyAlerts(alerts, 'All', '').map((a) => a.id), ['2', '1']);
  assert.deepEqual(filterSafetyAlerts(alerts, 'LTI', 'SA-002').map((a) => a.id), ['1']);
  assert.deepEqual(filterSafetyAlerts(alerts, 'Fatal', 'loading'), []);
  assert.deepEqual(alerts.map((a) => a.id), ['1', '2']);
  assert.equal(SAFETY_ALERT_CATEGORIES.length, 10);
});
test('only permits safe same-origin attachment paths', () => {
  assert.equal(safeAlertFileUrl('/preview/a.pdf'), '/preview/a.pdf');
  for (const url of ['https://example.com/a.pdf', '//example.com/a', '/\\example.com', 'javascript:alert(1)', '/bad\nurl']) assert.equal(safeAlertFileUrl(url), null);
});
test('accepts tenant-provided categories without changing the display taxonomy', () => {
  const tenantAlert = { ...alerts[0], category: 'Tenant-specific type' };
  assert.deepEqual(filterSafetyAlerts([tenantAlert], 'Tenant-specific type', 'SA-002'), [tenantAlert]);
});
