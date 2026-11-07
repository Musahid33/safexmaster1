import test from 'node:test';
import assert from 'node:assert/strict';
import { forSelectedSite, initialSiteId, siteStorageKey, validSavedSiteId } from '../lib/site-selection.ts';

test('remembered sites are validated and tenant keys are isolated', () => {
  assert.notEqual(siteStorageKey('tenant-a'), siteStorageKey('tenant-b'));
  const sites = [{ id: 'one' }, { id: 'two' }];
  assert.equal(validSavedSiteId('two', sites), 'two');
  assert.equal(validSavedSiteId('removed', sites), null);
  assert.equal(validSavedSiteId(null, sites), null);
  assert.equal(validSavedSiteId('one', []), null);
});

test('only recognitions for the selected site are displayed', () => {
  const items = [{ id: 'a', siteId: 'one' }, { id: 'b', siteId: 'two' }, { id: 'c', siteId: 'one' }];
  assert.deepEqual(forSelectedSite(items, 'one').map((item) => item.id), ['a', 'c']);
  assert.deepEqual(forSelectedSite(items, 'two').map((item) => item.id), ['b']);
  assert.deepEqual(forSelectedSite(items, null), []);
});


test('a single site is selected automatically while multiple sites use a valid saved choice', () => {
  const one = [{ id: 'one' }];
  const multiple = [...one, { id: 'two' }];
  assert.equal(initialSiteId(null, one), 'one');
  assert.equal(initialSiteId('removed', one), 'one');
  assert.equal(initialSiteId('two', multiple), 'two');
  assert.equal(initialSiteId(null, multiple), null);
  assert.equal(initialSiteId('removed', multiple), null);
  assert.equal(initialSiteId(null, []), null);
});
