import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePublicPortal, validPortalSlug } from '../lib/public-portal.ts';
import { initialSiteId } from '../lib/site-selection.ts';

const portal = { companyId: 'f7bd5225-6bf6-49ec-a9d0-92bbc8f974c3', companySlug: 'company-a', companyName: 'Company A', sites: [{ id: 'c825bc68-6300-48b0-bf69-7858587d19bc', name: 'Site A', region: '', sosNumber: null }] };
test('portal data is validated and a sole database site is selected automatically', () => {
  const result = parsePublicPortal(portal, 'company-a');
  assert.ok(result);
  assert.equal(initialSiteId(null, result.sites), portal.sites[0].id);
  assert.equal(result.sites[0].sosNumber, null);
});
test('invalid, mismatched or malformed tenant data is rejected', () => {
  assert.equal(validPortalSlug('company-a'), true);
  for (const slug of ['', 'COMPANY', '../company', 'company--a']) assert.equal(validPortalSlug(slug), false);
  assert.equal(parsePublicPortal(portal, 'company-b'), null);
  assert.equal(parsePublicPortal({ ...portal, companyId: 'bad' }, 'company-a'), null);
  assert.equal(parsePublicPortal({ ...portal, sites: [...portal.sites, ...portal.sites] }, 'company-a'), null);
  assert.equal(parsePublicPortal({ ...portal, sites: [{ ...portal.sites[0], sosNumber: 123 }] }, 'company-a'), null);
});
