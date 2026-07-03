import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderJson, renderMarkdown } from './catalog.ts';
import type { CapabilityEntry } from './parse.ts';

const sample: CapabilityEntry[] = [
  { capability: 'transport.normalizing', intent: 'one seam', reuse: 'wrap it', file: 'a.ts', language: 'typescript', symbol: 'N', since: '0.1.0' },
];

test('empty catalog renders valid JSON with zero count', () => {
  const parsed = JSON.parse(renderJson([]));
  assert.equal(parsed.count, 0);
  assert.deepEqual(parsed.capabilities, []);
});

test('empty catalog markdown invites the first annotation', () => {
  const md = renderMarkdown([]);
  assert.match(md, /No capabilities annotated yet/);
  assert.match(md, /GENERATED/);
});

test('markdown groups by area and shows the reuse note', () => {
  const md = renderMarkdown(sample);
  assert.match(md, /## transport/);
  assert.match(md, /`transport\.normalizing`/);
  assert.match(md, /\*\*Reuse:\*\* wrap it/);
});
