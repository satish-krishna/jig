import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stylelintFrontend } from './stylelint-frontend.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FIXTURES = join(ROOT, 'tools', 'lint', 'fixtures');
const CONFIG = join(ROOT, 'frontend', 'stylelint.config.mjs');

// Routed through the same function `npm run stylelint` runs, so the options the
// gate uses — the config, and `ignoreDisables` above all — are the options under
// test. Calling stylelint directly here is what let a working suppression dial sit
// in the shipped gate while these tests stayed green.
async function lint(fixture: string) {
  const { warnings } = await stylelintFrontend(join(FIXTURES, fixture));
  return warnings;
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

test('an inline disable comment cannot switch the gate off', async () => {
  // The defect this pins, found by the final review: `/* stylelint-disable */` took
  // `npm run stylelint` from exit 2 to exit 0 on four hardcoded values. ESLint's half
  // of the gate had `linterOptions.noInlineConfig` from the start and was verified to
  // hold; the spec claimed stylelint mirrored it, and it did not. A rule with a
  // suppression mechanism will eventually be suppressed and cannot report that it was.
  const suppressed = await lint('spacing-disabled.css');

  assert.ok(
    suppressed.length > 0,
    'a stylelint-disable comment suppressed the gate — ignoreDisables is not in effect',
  );
});
