import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = join(ROOT, 'tools', 'lint', 'fixtures');
const CONFIG = join(ROOT, 'frontend', 'stylelint.config.mjs');

async function lint(fixture: string) {
  const result = await stylelint.lint({
    files: join(FIXTURES, fixture),
    configFile: CONFIG,
  });
  return result.results[0].warnings;
}

// A data-driven config has no rule files to enumerate, so a fixture is the only
// thing that can tell a correct config from a weakened one. Loosen ignoreValues
// and this goes red in CI, from a clean checkout, where no hook exists.
test('the dirty fixture reports every hardcoded value', async () => {
  const warnings = await lint('spacing-dirty.css');
  const props = warnings.map((w) => w.text.match(/of "([^"]+)"/)?.[1]).filter(Boolean).sort();

  assert.deepEqual(props, ['background', 'border-radius', 'color', 'gap', 'margin-left', 'padding']);
});

test('the clean fixture reports nothing', async () => {
  assert.deepEqual(await lint('spacing-clean.css'), []);
});

test('1px hairlines and zero are not spacing literals', async () => {
  // design.md declares 1px hairlines a primitive of the language, and 0 is the
  // absence of spacing rather than a step. Neither has a token, and demanding
  // one would invent tokens the ADR says must not exist.
  const warnings = await lint('spacing-clean.css');

  assert.equal(warnings.length, 0, 'border: 1px and inset: 0 must both pass');
});
