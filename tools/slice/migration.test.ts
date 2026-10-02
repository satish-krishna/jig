// TEMPORARY: deleted by the last task of docs/superpowers/plans/2026-09-30-slice-templates.md.
// Records every file the generator writes for a matrix of specs that reaches every branch in
// the emitters, and fails on any byte that moves while the emitter text is being moved into
// templates. golden.test.ts covers users only; this covers the rest.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, validateSpec } from './spec.ts';
import { plan } from './slice.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const CASES: Record<string, { spec: unknown; thick: boolean }> = {
  users: { spec: null, thick: true },
  order: { spec: { name: 'Order', icon: 'lucideBox', fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true, placeholder: 'SO-1001' },
    { name: 'total', type: 'number', label: 'Total' },
  ] }, thick: true },
  orderThin: { spec: { name: 'Order', icon: 'lucideBox', fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ] }, thick: false },
  flag: { spec: { name: 'Flag', icon: 'lucideFlag', fields: [
    { name: 'enabled', type: 'boolean', label: 'Enabled' },
    { name: 'archived', type: 'boolean', label: 'Archived' },
  ] }, thick: true },
  stockItem: { spec: { name: 'StockItem', icon: 'lucideBox', fields: [
    { name: 'quantity', type: 'number', label: 'Quantity' },
    { name: 'active', type: 'boolean', label: 'Active' },
    { name: 'sku', type: 'string', label: 'SKU', unique: true },
  ] }, thick: true },
  contact: { spec: { name: 'Contact', icon: 'lucideUser', fields: [
    { name: 'fullName', type: 'string', label: 'Full name', placeholder: 'Ada "the" Lovelace' },
    { name: 'workEmail', type: 'string', label: 'Work email', format: 'email', unique: true },
    { name: 'homeEmail', type: 'string', label: 'Home email', format: 'email' },
  ] }, thick: true },
  note: { spec: { name: 'Note', icon: 'lucideFile', fields: [{ name: 'body', type: 'string', label: 'Body' }] }, thick: true },
};

export function snapshotAll(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, c] of Object.entries(CASES)) {
    const spec = c.spec === null ? loadSpec(join(ROOT, 'examples', 'slices', 'users.slice.json')) : validateSpec(c.spec);
    for (const w of plan(spec, 'Jig', c.thick).writes) out[`${name}|${w.path}`] = w.text;
  }
  return out;
}

test('the generator writes exactly what it wrote before the move to templates', () => {
  const recorded = JSON.parse(readFileSync(join(HERE, 'migration.fixture.json'), 'utf8')) as Record<string, string>;
  const now = snapshotAll();
  assert.deepEqual(Object.keys(now).sort(), Object.keys(recorded).sort());
  for (const key of Object.keys(recorded)) assert.equal(now[key], recorded[key], key);
});
