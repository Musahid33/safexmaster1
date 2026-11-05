import { test } from 'node:test';
import assert from 'node:assert/strict';
import { telHref } from '../lib/emergency.ts';
test('uses only a valid configured emergency contact', () => {
  assert.equal(telHref('+44 (20) 1234-5678'), 'tel:+442012345678');
  assert.equal(telHref('112'), 'tel:112');
  for (const value of [null, undefined, '', 'abc', '12', '12+34', 'tel:123', '1234567890123456']) assert.equal(telHref(value), null);
});
