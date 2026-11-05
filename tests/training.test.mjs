import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTrainingCatalog } from '../lib/training.ts';

test('training videos and supported module formats are kept in separate sections', () => {
  const { videos, modules } = splitTrainingCatalog([
    { id: 'v', title: 'Video', type: 'video' },
    ...['ppt', 'pdf', 'image'].map((format) => ({ id: format, title: format, type: 'module', format })),
    { id: 'other', title: 'Unknown format', type: 'module', format: 'zip' }
  ]);
  assert.deepEqual(videos.map((item) => item.id), ['v']);
  assert.deepEqual(modules.map((item) => item.id), ['ppt', 'pdf', 'image']);
  assert.deepEqual(splitTrainingCatalog(null), { videos: [], modules: [] });
});
