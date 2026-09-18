// Tests for the slice CLI: argument parsing, product detection, and the pure plan() that
// composes every earlier task's emitters and injectors into one write-and-edit list. main()
// itself is impure (disk, git, dotnet, npm) and is deliberately untested here — see the task
// brief's "do not run main() against the real repository" rule. Task 9's acceptance.test.ts
// is meant to exercise plan() against the live registries the same way; it does not exist
// yet as of this file.
//
// Two tests below (`plan(..., true)` behavior — the "thick checkout" cases) are wrapped in
// thick-cut markers: after a thin cut, plan() has no thick branch at all, so plan(spec, p,
// true) behaves exactly like plan(spec, p, false) and those assertions would go false. A
// thin clone must not carry assertions that fail against its own thinned copy of slice.ts.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSpec } from './spec.ts';
import { CATALOG_REFRESH_COMMAND, detectProduct, parseArgs, plan } from './slice.ts';

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

// The generator writes annotated source in every layer, and `.bob/registry/` is generated
// from exactly those annotations, so a run that stops at the last write leaves the catalog
// stale — and `npm run verify` checks catalog freshness as its FIRST step, before it
// compiles a line. A slice that generates cleanly and then fails the gate on a stale
// catalog is not a slice that arrives green. Asserting both halves together keeps the two
// facts from drifting: drop the annotations and this test stops being about anything; drop
// the refresh and it fails.
test('the emitted slice is annotated, so the run refreshes the catalog before it hands back', () => {
  const { writes } = plan(spec, 'Jig', false);
  const annotated = writes.filter((w) => /@capability|<capability>/.test(w.text));

  assert.ok(annotated.length > 0, 'no emitted file declares a capability');
  assert.match(
    CATALOG_REFRESH_COMMAND,
    /catalog/,
    'emitted files declare capabilities but the run never regenerates the catalog',
  );
});

// thick:start
test('plan emits the desktop-native file and the lib.rs and command-adapter edits for a thick checkout', () => {
  const { edits } = plan(spec, 'Jig', true);
  assert.ok(edits.some((e) => e.path.endsWith('lib.rs')));
  assert.ok(edits.some((e) => e.path.endsWith('commands.rs')));
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
// thick:end
