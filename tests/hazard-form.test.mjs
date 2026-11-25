import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const types = await readFile(new URL('../lib/types.ts', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../app/components/ReportWorkflow.tsx', import.meta.url), 'utf8');

test('hazard categories are the fixed nine-item taxonomy', async () => {
  const block = types.slice(types.indexOf('HAZARD_CATEGORIES'), types.indexOf('] as const', types.indexOf('HAZARD_CATEGORIES')));
  const expected = ['Physical', 'Chemical', 'Electrical', 'Mechanical', 'Fire', 'Ergonomical', 'Environment', 'Biological', 'Other'];
  for (const category of expected) assert.ok(block.includes(`'${category}'`), `missing hazard category: ${category}`);
  assert.equal((block.match(/'/g) ?? []).length / 2, expected.length, 'unexpected extra hazard category');
});

test('severity is a five-point numeric scale with distinct labels', async () => {
  const block = types.slice(types.indexOf('SEVERITY_LEVELS'), types.indexOf('] as const', types.indexOf('SEVERITY_LEVELS')));
  const values = [...block.matchAll(/value:\s*(\d)/g)].map((match) => Number(match[1]));
  assert.deepEqual(values, [1, 2, 3, 4, 5], 'severity must offer exactly 1 through 5');
  for (const label of ['Insignificant', 'Minor', 'Moderate', 'Major', 'Critical']) {
    assert.ok(block.includes(`'${label}'`), `missing severity label: ${label}`);
  }
});

test('the hazard form requires category, severity and immediate action', () => {
  const hazardBlock = workflow.slice(workflow.indexOf('if (isHazard'), workflow.indexOf('setSubmitting(true)'));
  assert.ok(hazardBlock.includes('Choose a hazard category to continue.'), 'missing category validation');
  assert.ok(hazardBlock.includes('Select the risk severity (1 to 5).'), 'missing severity validation');
  assert.ok(hazardBlock.includes('Immediate action is required to make the area safe.'), 'missing immediate-action validation');
});

test('the hazard form offers camera and gallery photo capture', () => {
  assert.ok(workflow.includes('capture="environment"'), 'camera capture input is missing');
  assert.ok(workflow.includes("T('Take photo')"), 'camera button label is missing');
  assert.ok(workflow.includes("T('From gallery')"), 'gallery button label is missing');
  // Object URLs must be revoked so a long session cannot leak memory.
  assert.ok(workflow.includes('URL.revokeObjectURL'), 'photo preview URL is never revoked');
});

test('stored severity values still render a readable label', () => {
  // Numeric 1–5 is the new shape; Low/Medium/High stays readable for older queued reports.
  for (const label of ['Insignificant', 'Minor', 'Moderate', 'Major', 'Critical', 'Low risk', 'Medium risk', 'High risk']) {
    assert.ok(workflow.includes(`'${label}'`), `severityText cannot label: ${label}`);
  }
});

test('hazard description uses the required placeholder text', () => {
  assert.ok(workflow.includes("T('Describe the unsafe condition or hazard.')"), 'hazard description placeholder is missing');
  assert.ok(workflow.includes("T('Describe any immediate action taken to make the area safe.')"), 'immediate action placeholder is missing');
});
