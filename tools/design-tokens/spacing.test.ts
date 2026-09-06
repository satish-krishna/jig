import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPACING_STEPS, readSpacingTokens } from './spacing.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const styles = () => readFileSync(join(ROOT, 'frontend', 'src', 'styles.css'), 'utf8');

test('styles.css declares every step of the scale', () => {
  const tokens = readSpacingTokens(styles());

  for (const step of SPACING_STEPS) {
    assert.equal(
      tokens[`--spacing-${step.name}`],
      step.rem,
      `--spacing-${step.name} must be ${step.rem} (${step.px}px)`,
    );
  }
});

test('every step sits on the 4px grid design.md claims', () => {
  for (const step of SPACING_STEPS) {
    assert.equal(step.px % 4, 0, `${step.name} is ${step.px}px, which is off the 4px grid`);
  }
});

test('the scale declares no step the app does not use', () => {
  // Six steps, derived from the nine magnitudes the app actually used. A seventh
  // step is a decision, not a detail: it belongs in the ADR before it belongs here.
  assert.equal(SPACING_STEPS.length, 6);
});

test('readSpacingTokens ignores custom properties that are not spacing', () => {
  const tokens = readSpacingTokens('@theme { --spacing-s: 0.5rem; --radius: 1rem; }');

  assert.deepEqual(tokens, { '--spacing-s': '0.5rem' });
});
