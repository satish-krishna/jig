// Init deletes every TEMPLATE_ONLY path from a new app, so code that survives into the app
// must never import from one. The slice generator did (spec.ts took `words` from
// tools/init/rename.ts): in every initialized app `npm run slice` died on import and the slice
// tests turned the app's own verify red. Nothing here runs init, so this scan is the only
// thing that sees the break before an app does.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_ONLY } from './init.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const isTemplateOnly = (rel: string) => TEMPLATE_ONLY.some((p) => rel === p || rel.startsWith(`${p}/`));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : sourceFiles(full);
    return /\.(ts|mjs|js)$/.test(e.name) ? [full] : [];
  });
}

/** Every relative specifier: static, re-export, side-effect, and dynamic, in either quote style. */
function relativeImports(source: string): string[] {
  return [...source.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)].map((m) => m[1]);
}

test('relativeImports finds every import form, not only the single-quoted from', () => {
  const source = [
    `import { a } from '../x/a.ts';`,
    `export { b } from "../x/b.ts";`,
    `import '../x/c.ts';`,
    `const d = await import('../x/d.ts');`,
    `import e from 'node:fs';`,
  ].join('\n');
  assert.deepEqual(relativeImports(source), ['../x/a.ts', '../x/b.ts', '../x/c.ts', '../x/d.ts']);
});

// The golden test compares the users slice to the generator's output. In an app the users
// slice is the developer's to change, so the test must not survive init, or the first edit
// to it turns the app's gate red.
test('the users golden test is template-only', () => {
  assert.ok(isTemplateOnly('tools/slice/golden.test.ts'));
});

test('no surviving tool imports from a path init deletes', () => {
  const offenders: string[] = [];
  for (const file of sourceFiles(join(ROOT, 'tools'))) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    if (isTemplateOnly(rel)) continue;
    for (const spec of relativeImports(readFileSync(file, 'utf8'))) {
      const target = relative(ROOT, resolve(dirname(file), spec)).replace(/\\/g, '/');
      if (isTemplateOnly(target)) offenders.push(`${rel} -> ${target}`);
    }
  }
  assert.deepEqual(offenders, []);
});
