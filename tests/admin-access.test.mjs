import test from 'node:test';
import assert from 'node:assert/strict';
import { mayAccessAdmin, validAdminLogin } from '../lib/admin-access.ts';

test('owner and company admin access are independent and fail closed', () => {
  assert.equal(mayAccessAdmin('owner', null), false);
  assert.equal(mayAccessAdmin('owner', { is_platform_owner: true, company_ids: [] }), true);
  assert.equal(mayAccessAdmin('company', { is_platform_owner: true, company_ids: [] }), false);
  assert.equal(mayAccessAdmin('owner', { is_platform_owner: false, company_ids: ['company-a'] }), false);
  assert.equal(mayAccessAdmin('owner', { is_platform_owner: 'true', company_ids: [] }), false);
  assert.equal(mayAccessAdmin('company', { company_ids: null }), false);
  assert.equal(mayAccessAdmin('company', { company_ids: ['company-a', null] }), false);
  assert.equal(mayAccessAdmin('company', { company_ids: [''] }), false);
});

test('company login checks the specific assigned company', () => {
  const access = { is_platform_owner: false, company_ids: ['company-a'] };
  assert.equal(mayAccessAdmin('company', access), true);
  assert.equal(mayAccessAdmin('company', access, 'company-a'), true);
  assert.equal(mayAccessAdmin('company', access, 'company-b'), false);
  assert.equal(mayAccessAdmin('company', access, null), false);
});

test('company login rejects invalid company codes and usernames', () => {
  assert.equal(validAdminLogin('company', 'safety.officer', 'company-a', 'secret'), true);
  for (const slug of ['', '-company', 'company-', 'company--a', 'other/company', 'A']) {
    assert.equal(validAdminLogin('company', 'officer', slug, 'secret'), false, slug);
  }
  for (const username of ['', 'ab', 'Admin', 'name@example.com', 'user name', 'x'.repeat(65)]) {
    assert.equal(validAdminLogin('company', username, 'company-a', 'secret'), false, username);
  }
  assert.equal(validAdminLogin('owner', 'owner@example.com', '', 'password'), true);
  assert.equal(validAdminLogin('owner', 'owner@example.com', '', ''), false);
  assert.equal(validAdminLogin('owner', 'owner@example.com', '', null), false);
});
