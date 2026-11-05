import test from 'node:test';
import assert from 'node:assert/strict';
import { portalName } from '../lib/portal-branding.ts';

test('portal name follows the supplied company without a tenant fallback', () => {
  assert.equal(portalName('  Example Company  '), 'Example Company - Safety Portal');
  assert.equal(portalName('Another Company'), 'Another Company - Safety Portal');
  assert.equal(portalName(null), 'Safety Portal');
  assert.equal(portalName('  '), 'Safety Portal');
});
