// Task 9's acceptance test: the gate every earlier task's unit tests cannot be, because
// each of those tests a pure function against fixtures it wrote itself. This one checks
// the generator still fits the real repository — the actual operations.ts, the actual
// app.config.ts, the actual registries an injector's anchor has to find. plan() is pure
// (spec, product, thick in; a write-and-edit list out, no disk access), so this suite
// costs nothing per `npm run verify`: no subprocess, no generated file ever touches disk,
// and nothing here mutates the working tree.
//
// Fixture spec is "SliceProbe", not the shipped example and not a plausible domain noun.
// examples/slices/users.slice.json describes the users slice, which already exists in this
// repository — every path it would emit already exists, so loading it here would fail the
// collision test on every file, by construction, rather than testing the generator.
//
// The name has to be one no real app would ever ship, which a domain noun is not. The two
// live-file tests below assert that this spec's paths are free and that its injections
// still change the registries; both of those are false once an app actually generates a
// slice by that name, and they stay false forever after. An earlier revision used "Order"
// and this suite duly went red the first time a slice named Order was generated against
// the live tree — the app would have had to choose between shipping an orders feature and
// keeping `npm run verify` green. "SliceProbe" is unshippable on purpose. See
// tools/slice/slice.test.ts and tools/slice/inject-text.test.ts, which use a domain noun
// safely because they only ever run against fixtures they wrote themselves.
//
// THICK is read off the filesystem, never hard-coded: after a thin cut, plan()'s thick
// branch is gone entirely (see slice.ts) and this checkout has no desktop shell to read
// a native entry point from. Deriving it the same way slice.ts's own main() does keeps
// this file honest about which checkout it is running in, on both sides of that cut,
// rather than asserting thick behavior that the thinned plan() can no longer produce.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '../../frontend/node_modules/typescript/lib/typescript.js';
import { validateSpec } from './spec.ts';
import { detectProduct, plan } from './slice.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let THICK = false;
// thick:start
THICK = existsSync(join(ROOT, 'apps', 'desktop', 'src-tauri'));
// thick:end

const PROBE_SPEC = validateSpec({
  name: 'SliceProbe',
  icon: 'lucideShoppingCart',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true, placeholder: 'SO-1001' },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

// Catches an emitter producing text that merely looks like TypeScript — a dangling brace,
// an unterminated template literal — that string-matching assertions elsewhere would miss.
test('every emitted TypeScript file parses without syntax errors', () => {
  const { writes } = plan(PROBE_SPEC, 'Jig', THICK);
  const tsWrites = writes.filter((w) => w.path.endsWith('.ts'));
  assert.ok(tsWrites.length > 0, 'plan() produced no TypeScript writes to check');
  for (const f of tsWrites) {
    const sf = ts.createSourceFile(f.path, f.text, ts.ScriptTarget.Latest, true);
    const diagnostics = (sf as unknown as { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
    assert.equal(
      diagnostics.length,
      0,
      `${f.path}: ${diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join('; ')}`,
    );
  }
});

// The valuable test: it runs every injector against the actual current registry files on
// every `verify`, so a reshaping that breaks an anchor fails the gate immediately instead
// of silently at the next generated slice. "Applies cleanly" means: it changes the file
// (a no-op would mean the anchor matched nothing meaningful), and applying it a second time
// to its own output is a no-op (the same idempotence every injector's own unit test proves
// against a fixture, proved here against the live file instead).
test('every injection applies cleanly to the live registries', () => {
  const product = detectProduct(ROOT);
  const { edits } = plan(PROBE_SPEC, product, THICK);
  assert.ok(edits.length > 0, 'plan() produced no edits to check');
  for (const e of edits) {
    const src = readFileSync(join(ROOT, e.path), 'utf8');
    const out = e.apply(src);
    assert.notEqual(out, src, `${e.path}: injection was a no-op against the live file`);
    assert.equal(e.apply(out), out, `${e.path}: injection is not idempotent against the live file`);
  }
});

// A generated file must land somewhere nothing else already occupies. SliceProbe is the
// fixture specifically because it proves this on a slice no app will ever have generated —
// the users slice would fail every one of these by design (see the file header).
test('no emitted file collides with an existing path', () => {
  const product = detectProduct(ROOT);
  const { writes } = plan(PROBE_SPEC, product, THICK);
  assert.ok(writes.length > 0, 'plan() produced no writes to check');
  for (const w of writes) {
    assert.ok(!existsSync(join(ROOT, w.path)), `${w.path} already exists`);
  }
});
