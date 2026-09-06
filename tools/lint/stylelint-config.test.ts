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

  assert.deepEqual(props, ['background', 'border-radius', 'color', 'column-gap', 'gap', 'margin-left', 'padding', 'row-gap']);
});

test('the clean fixture reports nothing', async () => {
  // Exempt values (0 and 1px) are safe only on governed properties. gap IS
  // governed; border and inset are not. The clean fixture's gap: 1px and gap: 0
  // pass because they match both conditions: property is governed AND value is
  // exempt. Removing either 1px or 0 from ignoreValues makes this test fail,
  // proving the exemptions are actually needed and tested.
  assert.deepEqual(await lint('spacing-clean.css'), []);
});
