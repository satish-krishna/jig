// Tests for the slice CLI: argument parsing, product detection, the pure plan() that
// composes every emitter and injector into one write-and-edit list, and the two pure guards
// main() consults before it writes anything. main() itself is impure (disk, git, dotnet,
// npm) and is deliberately untested here — it is never run against the real repository.
// acceptance.test.ts exercises plan() against the live registries.
//
// Two tests below (`plan(..., true)` behavior — the "thick checkout" cases) are wrapped in
// thick-cut markers: after a thin cut, plan() has no thick branch at all, so plan(spec, p,
// true) behaves exactly like plan(spec, p, false) and those assertions would go false. A
// thin clone must not carry assertions that fail against its own thinned copy of slice.ts.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSpec } from './spec.ts';
import { CATALOG_REFRESH_COMMAND, collidingPaths, detectProduct, dirtyAmong, parseArgs, plan } from './slice.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

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
  // Asserted against package.json's own script list. The regex it replaces looked for
  // /catalog/ inside a constant named CATALOG_REFRESH_COMMAND, which could not fail.
  const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
  const script = CATALOG_REFRESH_COMMAND.replace(/^npm run /, '');
  assert.ok(scripts[script], `${CATALOG_REFRESH_COMMAND} is not a script in package.json`);
});

// ---------------------------------------------------------------------------
// The two guards main() consults before it writes anything.
// ---------------------------------------------------------------------------

// A whole-tree refusal blocked three things the tool itself instructs: --dry-run, which
// writes nothing; --phase b, which IS the documented resume and runs at the exact moment
// phase A has just dirtied the tree; and add-a-feature step 1, which has you author a spec
// file. Scoping the refusal to the registries this invocation edits keeps the case it is
// actually for: an uncommitted change to a tracked file the generator is about to splice.
test('dirtyAmong reports only the planned paths git says have changed', () => {
  const porcelain = [
    ' M frontend/src/app/contracts/operations.ts',
    '?? orders.slice.json',
    ' M frontend/src/app/shell/shell.ts',
    '',
  ].join('\n');

  assert.deepEqual(dirtyAmong(porcelain, ['frontend/src/app/contracts/operations.ts']), [
    'frontend/src/app/contracts/operations.ts',
  ]);
  assert.deepEqual(dirtyAmong(porcelain, ['frontend/src/app/app.routes.ts']), []);
});

test('an untracked spec file does not block a run, which is add-a-feature step 1', () => {
  assert.deepEqual(dirtyAmong('?? orders.slice.json', ['frontend/src/app/contracts/operations.ts']), []);
});

// Phase A writes twelve .NET files and edits the three .NET registries, and then the CLI's
// own message says to re-run with --phase b. Phase B edits a disjoint set, so the resume
// the tool prints is a resume the tool allows.
test('phase A leaving its own registries dirty does not block the phase B it tells you to run', () => {
  const afterPhaseA = [
    'M  services/api/src/Jig.Application/ApplicationModule.cs',
    'M  services/api/src/Jig.Infrastructure/InfrastructureModule.cs',
    'A  services/api/src/Jig.Domain/Order.cs',
    '',
  ].join('\n');
  const { edits } = plan(spec, 'Jig', false);
  const phaseB = edits.filter((e) => !e.path.startsWith('services/api/')).map((e) => e.path);

  assert.deepEqual(dirtyAmong(afterPhaseA, phaseB), []);
});

test('dirtyAmong reads both sides of a rename', () => {
  const porcelain = 'R  frontend/src/app/app.routes.ts -> frontend/src/app/routes.ts';
  assert.deepEqual(dirtyAmong(porcelain, ['frontend/src/app/app.routes.ts']), ['frontend/src/app/app.routes.ts']);
  assert.deepEqual(dirtyAmong(porcelain, ['frontend/src/app/routes.ts']), ['frontend/src/app/routes.ts']);
});

// The CLI's closing line is "fill in the domain behavior the generator could not know", so
// a second run against the same spec silently discarded exactly that work.
test('collidingPaths names every planned write that already exists', () => {
  const { writes } = plan(spec, 'Jig', false);
  const taken = writes[0].path;

  assert.deepEqual(collidingPaths(writes, (p) => p === taken), [taken]);
  assert.deepEqual(collidingPaths(writes, () => false), []);
});

// The exemplar is proof the check has something real to find: every path a users slice
// would emit is already occupied by the users slice.
test('regenerating the users slice collides with the exemplar already occupying it', () => {
  const users = validateSpec({
    name: 'User',
    icon: 'lucideUsers',
    fields: [{ name: 'name', type: 'string', label: 'Name' }],
  });
  const { writes } = plan(users, 'Jig', false);
  const collisions = collidingPaths(writes, (p) => existsSync(join(ROOT, p)));

  assert.ok(collisions.length > 0, 'no users path is occupied, so this test proves nothing');
  assert.ok(collisions.some((p) => p.endsWith('user-form.ts')));
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
