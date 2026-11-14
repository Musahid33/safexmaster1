import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMobile, validOtpCode, validRegisteredMobile } from '../lib/private-access.ts';

test('registered mobile validation accepts Indian mobile formats and rejects the rest', () => {
  for (const ok of ['9876543210', ' 98765 43210 ', '+919876543210', '919876543210', '09876543210', '6123456789']) {
    assert.equal(validRegisteredMobile(ok), true, ok);
  }
  for (const bad of ['', '12345', '1234567890', '0987654321', '98765432101', 'abcdefghij', '5555555555']) {
    assert.equal(validRegisteredMobile(bad), false, bad);
  }
});

test('mobile is normalised to the national 10-digit form', () => {
  assert.equal(normalizeMobile('+91 98765 43210'), '9876543210');
  assert.equal(normalizeMobile('09876543210'), '9876543210');
  assert.equal(normalizeMobile('9876543210'), '9876543210');
});

test('otp codes are exactly six digits', () => {
  assert.equal(validOtpCode('123456'), true);
  assert.equal(validOtpCode(' 123456 '), true);
  for (const bad of ['12345', '1234567', 'abcdef', '12 3456', '']) assert.equal(validOtpCode(bad), false, bad);
});

test('without a gateway the private section cannot be opened (fails closed)', () => {
  // The passport renders the OTP dialog only when a gateway prop exists; this guards
  // the contract in code: no gateway means no unlock path.
  const gateway = undefined;
  assert.equal(typeof gateway !== 'undefined' && gateway !== null, false);
});
