import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { queueReport, pendingReports, syncQueuedReports } from '../lib/offline-report-queue.ts';

const report = { type: 'Grievance', category: null, area: 'area', department: null, incidentAt: '2026-01-01', description: 'a confidential concern', immediateAction: '', severity: null, employee: { id: 'employee' }, anonymous: true, photoName: null, photo: new Blob(['photo']) };

test('queue stores report and attachment locally, strips anonymous identity and isolates tenants', async () => {
  await queueReport('tenant-a', 'site-a', report);
  await queueReport('tenant-b', 'site-b', report);
  const entries = await pendingReports('tenant-a');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].siteId, 'site-a');
  assert.equal(entries[0].report.employee, null);
  assert.equal(await entries[0].report.photo.text(), 'photo');
  assert.equal((await pendingReports('tenant-b')).length, 1);
  await assert.rejects(queueReport('', 'site-a', report));
});

test('failed or unacknowledged sends retain data; only acknowledged tenant records are removed', async () => {
  const before = await pendingReports('tenant-a');
  await syncQueuedReports('tenant-a', async () => { throw new Error('offline'); });
  assert.equal((await pendingReports('tenant-a')).length, 1);
  await syncQueuedReports('tenant-a', async () => false);
  assert.equal((await pendingReports('tenant-a')).length, 1);
  await syncQueuedReports('tenant-a', async (entry) => { assert.equal(entry.id, before[0].id); return true; });
  assert.equal((await pendingReports('tenant-a')).length, 0);
  assert.equal((await pendingReports('tenant-b')).length, 1);
});
