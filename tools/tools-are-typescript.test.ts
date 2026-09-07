import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = join(ROOT, 'tools');

/** Every file under tools/, recursively, skipping build output and dependencies. */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'bin' || entry.name === 'obj') return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * Everything under tools/ is TypeScript.
 *
 * Node runs a .ts file directly through native type stripping, and this repo
 * already relies on that: `npm run catalog`, `npm run showcase:api` and
 * `npm run ui:style` all invoke `node tools/**\/*.ts`. There is therefore no
 * category of tooling file that has to be .mjs, and a split between the two
 * was never a decision anyone made — it was an accident of what got written
 * first, which someone (this author, twice) then mistook for a convention and
 * asserted as fact.
 *
 * One rule, machine-checked, so nobody has to guess again. The follow-up
 * enforcement work adds roughly thirty files here; without this test each one
 * is a judgement call, and a judgement call with no stated rule is how the
 * wrong answer gets copied.
 */
test('every file under tools/ that Node executes is TypeScript, never .mjs', () => {
  const offenders = walk(TOOLS)
    .filter((path) => path.endsWith('.mjs'))
    .map((path) => relative(ROOT, path).replace(/\\/g, '/'));

  assert.deepEqual(
    offenders,
    [],
    `tools/ is TypeScript. Rename these to .ts — Node runs them either way:\n  ${offenders.join('\n  ')}`,
  );
});

/**
 * The rule is only real if the scripts that invoke these files agree with it.
 * A rename that leaves package.json pointing at a .mjs path fails loudly at the
 * next `npm run`, but a rename that leaves a HOOK path stale fails silently —
 * the hook simply stops running, and nothing reports that it stopped.
 */
test('no npm script or hook registration still points at a tools/*.mjs path', () => {
  const sources = {
    'package.json': readFileSync(join(ROOT, 'package.json'), 'utf8'),
    '.claude/settings.json': readFileSync(join(ROOT, '.claude', 'settings.json'), 'utf8'),
    '.githooks/pre-commit': readFileSync(join(ROOT, '.githooks', 'pre-commit'), 'utf8'),
  };

  for (const [name, content] of Object.entries(sources)) {
    const stale = content.match(/tools\/[\w/-]+\.mjs/g) ?? [];
    assert.deepEqual(stale, [], `${name} still invokes a .mjs path under tools/: ${stale.join(', ')}`);
  }
});
