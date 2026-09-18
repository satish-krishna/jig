// Tests for the slice CLI: argument parsing, product detection, and the pure plan() that
// composes every earlier task's emitters and injectors into one write-and-edit list. main()
// itself is impure (disk, git, dotnet, npm) and is deliberately untested here — see the task
// brief's "do not run main() against the real repository" rule and acceptance.test.ts, which
// exercises plan() against the live registries instead.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSpec } from './spec.ts';
import { detectProduct, parseArgs, plan } from './slice.ts';

// A minimal services/api/src/<name> tree, just enough for detectProduct to read.
function fixtureRootWith(domainDirName: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'slice-test-'));
  mkdirSync(join(dir, 'services', 'api', 'src', domainDirName), { recursive: true });
  return dir;
}

// Fixture spec is "Order" (icon lucideShoppingCart, one unique string field, one number
// field) — the same shape task-10-brief.md's manual reality check uses.
const spec = validateSpec({
  name: 'Order',
  icon: 'lucideShoppingCart',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true, placeholder: 'SO-1001' },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

test('parseArgs defaults to both phases', () => {
  const a = parseArgs(['--spec', 'x.json']);
  assert.equal(a.phase, 'both');
  assert.equal(a.dryRun, false);
});

test('parseArgs reads --phase and --dry-run', () => {
  assert.equal(parseArgs(['--spec', 'x.json', '--phase', 'b']).phase, 'b');
  assert.equal(parseArgs(['--spec', 'x.json', '--dry-run']).dryRun, true);
});

test('parseArgs demands a spec', () => {
  assert.throws(() => parseArgs([]), /--spec is required/);
});

test('detectProduct reads the Domain project name', () => {
  const root = fixtureRootWith('AcmePortal.Domain');
  try {
    assert.equal(detectProduct(root), 'AcmePortal');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('plan emits no desktop-native file for a thin checkout', () => {
  const { writes, edits } = plan(spec, 'Jig', false);
  assert.ok(!writes.some((w) => w.path.endsWith('.rs')));
  assert.ok(!edits.some((e) => e.path.endsWith('lib.rs')));
});

test('plan emits the desktop-native file and the lib.rs edit for a thick checkout', () => {
  const { edits } = plan(spec, 'Jig', true);
  assert.ok(edits.some((e) => e.path.endsWith('lib.rs')));
});

test('plan writes each group in full for the thick case', () => {
  const { writes } = plan(spec, 'Jig', true);
  const count = (pred: (p: string) => boolean) => writes.filter((w) => pred(w.path)).length;
  assert.equal(count((p) => p.includes('services/api/src/')), 10);
  assert.equal(count((p) => p.includes('services/api/tests/')), 2);
  assert.equal(count((p) => p.includes('frontend/src/app/') && !p.endsWith('.spec.ts')), 6);
  assert.equal(count((p) => p.endsWith('.spec.ts')), 5);
  assert.equal(count((p) => p.endsWith('.rs')), 1);
  assert.equal(writes.length, 24);
});
