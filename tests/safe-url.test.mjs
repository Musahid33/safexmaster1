import test from 'node:test';
import assert from 'node:assert/strict';
import { appendResourceQuery, safeExternalUrl, safeResourceUrl } from '../lib/safe-url.ts';

test('safeExternalUrl accepts http/https and rejects unsafe schemes or protocol-relative URLs', () => {
  assert.equal(safeExternalUrl('https://example.com/policy'), 'https://example.com/policy');
  assert.equal(safeExternalUrl('example.com/terms'), 'https://example.com/terms');
  assert.equal(safeExternalUrl('http://intranet.local/doc'), 'http://intranet.local/doc');
  assert.equal(safeExternalUrl('javascript:alert(1)'), null);
  assert.equal(safeExternalUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(safeExternalUrl('//evil.example/phish'), null);
  assert.equal(safeExternalUrl('   '), null);
  assert.equal(safeExternalUrl(null), null);
});

test('safeResourceUrl allows root-relative paths and http/https while blocking XSS vectors', () => {
  assert.equal(safeResourceUrl('/api/files/doc-1'), '/api/files/doc-1');
  assert.equal(safeResourceUrl('/demo/photo.jpg?v=1'), '/demo/photo.jpg?v=1');
  assert.equal(safeResourceUrl('https://storage.example/signed.pdf?token=abc'), 'https://storage.example/signed.pdf?token=abc');
  assert.equal(safeResourceUrl('//evil.example/doc.pdf'), null);
  assert.equal(safeResourceUrl('javascript:void(0)'), null);
  assert.equal(safeResourceUrl('data:application/pdf;base64,AAAA'), null);
  assert.equal(safeResourceUrl('blob:https://example.com/123'), null);
});

test('appendResourceQuery preserves existing signed query parameters and blocks unsafe URLs', () => {
  assert.equal(
    appendResourceQuery('/api/files/sop-1', 'inline', '1', 'navpanes=0&view=FitH'),
    '/api/files/sop-1?inline=1#navpanes=0&view=FitH'
  );
  assert.equal(
    appendResourceQuery('https://storage.example/file.pdf?token=xyz&exp=999', 'download', '1'),
    'https://storage.example/file.pdf?token=xyz&exp=999&download=1'
  );
  assert.equal(
    appendResourceQuery('/api/files/doc?token=abc', 'inline', '1'),
    '/api/files/doc?token=abc&inline=1'
  );
  assert.equal(appendResourceQuery('javascript:alert(1)', 'inline', '1'), null);
  assert.equal(appendResourceQuery('//evil.example/a.pdf', 'download', '1'), null);
});
