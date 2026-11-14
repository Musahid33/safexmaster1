import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePublicPortal, parseSiteStats, validPortalSlug } from '../lib/public-portal.ts';
import { initialSiteId } from '../lib/site-selection.ts';

const portal = { companyId: 'f7bd5225-6bf6-49ec-a9d0-92bbc8f974c3', companySlug: 'company-a', companyName: 'Company A', sites: [{ id: 'c825bc68-6300-48b0-bf69-7858587d19bc', name: 'Site A', region: '', sosNumber: null }] };
test('portal data is validated and a sole database site is selected automatically', () => {
  const result = parsePublicPortal(portal, 'company-a');
  assert.ok(result);
  assert.equal(initialSiteId(null, result.sites), portal.sites[0].id);
  assert.equal(result.sites[0].sosNumber, null);
  // A pre-migration data source omits stats; the hero then shows its empty state.
  assert.equal(result.sites[0].stats, null);
});
test('invalid, mismatched or malformed tenant data is rejected', () => {
  assert.equal(validPortalSlug('company-a'), true);
  for (const slug of ['', 'COMPANY', '../company', 'company--a']) assert.equal(validPortalSlug(slug), false);
  assert.equal(parsePublicPortal(portal, 'company-b'), null);
  assert.equal(parsePublicPortal({ ...portal, companyId: 'bad' }, 'company-a'), null);
  assert.equal(parsePublicPortal({ ...portal, sites: [...portal.sites, ...portal.sites] }, 'company-a'), null);
  assert.equal(parsePublicPortal({ ...portal, sites: [{ ...portal.sites[0], sosNumber: 123 }] }, 'company-a'), null);
});
test('site stats are kept per site and malformed counters are dropped, never fatal', () => {
  const stats = { daysWithoutInjury: 358, nearMissCount: 18, safetyObservationCount: 46, trainingCount: 248 };
  const portalWithStats = { ...portal, sites: [
    { ...portal.sites[0], stats },
    { id: '2b2f0c6d-2d5f-4a1d-9b6a-3f5a3c6f9a01', name: 'Site B', region: '', sosNumber: null, stats: { ...stats, nearMissCount: -1 } },
    { id: '8c2a7e1c-9a8d-4bd2-8c4f-0b19ef21a002', name: 'Site C', region: '', sosNumber: null, stats: 'not-an-object' }
  ] };
  const result = parsePublicPortal(portalWithStats, 'company-a');
  assert.ok(result);
  assert.deepEqual(result.sites[0].stats, stats);
  assert.deepEqual(parsePublicPortal({ ...portal, sites: [portalWithStats.sites[0]] }, 'company-a')?.sites[0].stats, stats);
  assert.equal(result.sites[1].stats, null, 'negative counts invalidate only that stats block');
  assert.equal(result.sites[2].stats, null);
  assert.equal(parseSiteStats({ daysWithoutInjury: null, nearMissCount: 0, safetyObservationCount: 0, trainingCount: 0 })?.daysWithoutInjury, null);
  assert.equal(parseSiteStats({ daysWithoutInjury: 3.5, nearMissCount: 0, safetyObservationCount: 0, trainingCount: 0 }), null);
  assert.equal(parseSiteStats({ daysWithoutInjury: 0, nearMissCount: 2 ** 40, safetyObservationCount: 0, trainingCount: 0 }), null);
});
