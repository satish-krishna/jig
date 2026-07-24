import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableStyles, assertValidStyle, installedComponents } from './ui-style.ts';

test('discovers the styles the installed CLI actually ships', () => {
  const styles = availableStyles();

  // Read from node_modules rather than hard-coded: a spartan upgrade that adds
  // or drops a style must not need this file edited to stay correct.
  assert.ok(styles.includes('nova'), 'nova missing');
  assert.ok(styles.includes('vega'), 'vega missing');
  assert.ok(styles.length >= 2, 'expected more than one style to choose between');
});

test('rejects an unknown style, and names the real ones', () => {
  assert.throws(
    () => assertValidStyle('chartreuse', ['nova', 'vega']),
    /Unknown style 'chartreuse'.*nova, vega/,
  );
});

test('rejects a missing style rather than silently picking one', () => {
  assert.throws(() => assertValidStyle(undefined, ['nova', 'vega']), /No style given.*nova, vega/);
});

test('accepts a style the CLI ships', () => {
  assert.doesNotThrow(() => assertValidStyle('vega', ['nova', 'vega']));
});

test('lists the vendored components that would be regenerated', () => {
  const components = installedComponents();

  // The whole point of the command is that it covers everything already
  // vendored, not a hard-coded subset that drifts as components are added.
  assert.ok(components.includes('button'), 'button missing');
  assert.ok(components.includes('utils'), 'utils missing');
  assert.ok(components.length > 50, `expected the full set, got ${components.length}`);
});
