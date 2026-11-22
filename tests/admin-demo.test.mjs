import test from 'node:test';
import assert from 'node:assert/strict';
import { validAdminDemoLogin, isAdminDemoEnabled, ADMIN_DEMO_COOKIE } from '../lib/admin-demo.ts';

test('demo login is disabled without a demo password configured', () => {
  delete process.env.ADMIN_DEMO_PASSWORD;
  assert.equal(isAdminDemoEnabled(), false);
  assert.equal(validAdminDemoLogin('admin', 'anything'), false);
});

test('demo login accepts only the exact demo credentials', () => {
  process.env.ADMIN_DEMO_PASSWORD = 'Safex@2026';
  assert.equal(isAdminDemoEnabled(), true);
  assert.equal(validAdminDemoLogin('admin', 'Safex@2026'), true);
  assert.equal(validAdminDemoLogin('admin', 'wrong'), false);
  assert.equal(validAdminDemoLogin('Admin', 'Safex@2026'), false);
  assert.equal(validAdminDemoLogin('admin', null), false);
  delete process.env.ADMIN_DEMO_PASSWORD;
});

test('demo login is always disabled in production', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  process.env.ADMIN_DEMO_PASSWORD = 'Safex@2026';
  assert.equal(isAdminDemoEnabled(), false);
  assert.equal(validAdminDemoLogin('admin', 'Safex@2026'), false);
  process.env.NODE_ENV = previous;
  delete process.env.ADMIN_DEMO_PASSWORD;
  assert.equal(ADMIN_DEMO_COOKIE, 'safetyos-admin-demo');
});
