import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  THIN_DELETE,
  THIN_DROP_DEPENDENCY,
  THIN_PATCHES,
  stripThickBlocks,
  stripThickMarkers,
  toThin,
} from './thin.ts';
import { stripTemplateBlocks } from './rename.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('stripThickBlocks removes a marked block behind any comment leader, keeps the rest', () => {
  assert.equal(
    stripThickBlocks('keep\n<!-- thick:start -->\ndesktop only\n<!-- thick:end -->\nkeep too\n'),
    'keep\nkeep too\n',
  );
  assert.equal(stripThickBlocks('a\n  // thick:start\n  ipc();\n  // thick:end\nb\n'), 'a\nb\n');
  assert.equal(stripThickBlocks('a\n# thick:start\ntarget/\n# thick:end\nb\n'), 'a\nb\n');
});

test('stripThickMarkers keeps the block and drops only the marker lines', () => {
  assert.equal(
    stripThickMarkers('keep\n<!-- thick:start -->\ndesktop only\n<!-- thick:end -->\nkeep too\n'),
    'keep\ndesktop only\nkeep too\n',
  );
  assert.equal(stripThickMarkers('a\n  // thick:start\n  ipc();\n  // thick:end\nb\n'), 'a\n  ipc();\nb\n');
});

// Both cuts have to leave the marker vocabulary behind. init deletes `tools/init`,
// so an initialized app can never strip a marker again: one left in a thick app is
// a comment referring to machinery that no longer exists, and one left in a thin app
// would mean a block that should have been removed is still there.
test('neither cut leaves a thick marker in the initialized app', () => {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const survivors: string[] = [];

  for (const rel of tracked) {
    if (BINARY.some((e) => rel.endsWith(e))) continue;
    if (rel.startsWith('tools/init/')) continue; // deleted by init; defines the markers
    const source = stripTemplateBlocks(readFileSync(join(ROOT, rel), 'utf8'));
    for (const [shape, text] of [['thick', stripThickMarkers(source)], ['thin', toThin(rel, source)]]) {
      if (text.includes('thick:start') || text.includes('thick:end')) survivors.push(`${rel} (${shape})`);
    }
  }

  assert.deepEqual(survivors, [], `marker left in the initialized app:\n${survivors.join('\n')}`);
});

test('toThin throws rather than silently skipping when an anchor is missing', () => {
  assert.throws(
    () => toThin('x.ts', 'nothing here', [{ path: 'x.ts', edits: [['absent', '']]}]),
    /anchor not found/,
  );
});

test('toThin throws when an anchor matches more than once', () => {
  assert.throws(
    () => toThin('x.ts', 'dup\ndup\n', [{ path: 'x.ts', edits: [['dup', '']]}]),
    /ambiguous/,
  );
});

test('every path the thin cut deletes still exists in the template', () => {
  for (const p of THIN_DELETE) {
    assert.ok(existsSync(join(ROOT, p)), `THIN_DELETE names ${p}, which is no longer in the repo`);
  }
});

test('every file the thin cut patches still exists in the template', () => {
  for (const { path } of THIN_PATCHES) {
    assert.ok(existsSync(join(ROOT, path)), `THIN_PATCHES names ${path}, which is no longer in the repo`);
  }
});

test('the frontend still declares the dependency the thin cut uninstalls', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'frontend', 'package.json'), 'utf8'));
  assert.ok(
    pkg.dependencies?.[THIN_DROP_DEPENDENCY] ?? pkg.devDependencies?.[THIN_DROP_DEPENDENCY],
    `init --thin uninstalls ${THIN_DROP_DEPENDENCY}; frontend/package.json no longer declares it`,
  );
});

// The residue scan. Every other test here guards one anchor; this one guards the
// RESULT — run the whole thin cut over every real file that survives it and prove
// nothing still points at a Rust core that is no longer on disk. An anchor that
// drifts makes toThin throw here; a reference nobody thought to cut shows up as a
// residue hit naming the file and the line. Without this, `init --thin` is a second
// output path that nothing exercises until it reaches a stranger's fresh clone.
const FORBIDDEN: readonly (readonly [string, RegExp])[] = [
  ['@tauri-apps dependency', /@tauri-apps/],
  ['src-tauri path', /src-tauri/],
  ['apps/desktop path', /apps\/desktop/],
  ['isTauri() call', /isTauri/],
  ['IpcTransport symbol', /IpcTransport/],
  ['ipc.transport module', /ipc\.transport/],
  ['Tauri prose', /\bTauri\b/],
  ['IPC prose', /\bIPC\b/],
  ['Rust prose', /\brust(c|-analyzer)?\b/i],
  ['cargo command', /\bcargo\b/i],
];

// ADRs are records of decisions taken, not current-state docs — rewriting one fakes
// history. `docs/superpowers/`, `tools/init/` and `.bob/registry/` never reach the
// cloned app: init deletes the first two and regenerates the third. The frontend
// manifests are handled by `npm uninstall`, not by a text patch.
const SCAN_EXEMPT = [
  '.bob/adr/',
  '.bob/registry/',
  'docs/superpowers/',
  'tools/init/',
  'frontend/package.json',
  'frontend/package-lock.json',
];

// The one narrow carve-out, and it is not a dial: nothing in the cut code can
// suppress a finding, and this list is a fixed pair of paths with a reason.
// `tools/catalog/parse.ts` is a multi-language doc-comment parser — it reads TSDoc,
// rustdoc and C# XML doc — so its `'rust'` is the name of a grammar it can parse,
// not a reference to `apps/desktop`. Ripping the branch out would mean editing
// tested parser code (rustdoc and C# XML doc share the `///` leader) to delete a
// capability the thin app simply never exercises, which is the gratuitous kind of
// surgery. These two files still face every other pattern, so a genuine dangling
// path like the old `apps/desktop/src-tauri/.../tray.rs` fixture is still caught.
const LANGUAGE_TOOLING = ['tools/catalog/parse.ts', 'tools/catalog/parse.test.ts'];
const LANGUAGE_TOOLING_ALLOWS = ['Rust prose', 'cargo command'];

const BINARY = ['.png', '.ico', '.icns', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.webp', '.thumbnail'];

test('the thin cut leaves no reference to the Rust core it deleted', () => {
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const residue: string[] = [];

  for (const rel of tracked) {
    if (BINARY.some((e) => rel.endsWith(e))) continue;
    if (SCAN_EXEMPT.some((p) => rel.startsWith(p))) continue;
    if (THIN_DELETE.some((p) => rel === p || rel.startsWith(`${p}/`))) continue;

    // Same order init applies: template-only prose goes first, then the thin cut.
    const thinned = toThin(rel, stripTemplateBlocks(readFileSync(join(ROOT, rel), 'utf8')));
    const allowed = LANGUAGE_TOOLING.includes(rel) ? LANGUAGE_TOOLING_ALLOWS : [];
    thinned.split('\n').forEach((line, i) => {
      for (const [what, re] of FORBIDDEN) {
        if (allowed.includes(what)) continue;
        if (re.test(line)) residue.push(`${rel}:${i + 1}  ${what}  ${line.trim().slice(0, 100)}`);
      }
    });
  }

  assert.deepEqual(residue, [], `thin cut left ${residue.length} reference(s) to the removed Rust core:\n${residue.join('\n')}`);
});
