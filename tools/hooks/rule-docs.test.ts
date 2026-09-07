import { test } from 'node:test';
import assert from 'node:assert/strict';
import { docUrlFor, docPointerBlock } from './rule-docs.ts';

test('resolves a known rule id, stripping the plugin prefix', () => {
  assert.equal(docUrlFor('jig/no-raw-control'), 'docs/architecture/rules/no-raw-control.md');
  assert.equal(
    docUrlFor('jig/no-explicit-standalone'),
    'docs/architecture/rules/no-explicit-standalone.md',
  );
});

test('an unknown rule id resolves to no doc, never a guessed path', () => {
  // The whole point of deriving the mapping instead of hand-writing it: an id the plugin
  // does not recognize (typo, another plugin's rule, a rule since removed) must not turn
  // into docs/architecture/rules/<whatever-was-typed>.md.
  assert.equal(docUrlFor('jig/totally-made-up'), undefined);
  assert.equal(docUrlFor('some-other-plugin/no-raw-control'), undefined);
  assert.equal(docUrlFor('bare-name-no-prefix'), undefined);
  assert.equal(docUrlFor(''), undefined);
  assert.equal(docUrlFor(null), undefined);
  assert.equal(docUrlFor(undefined), undefined);
});

test('docPointerBlock includes a resolved id and omits an unresolved one', () => {
  const block = docPointerBlock(['jig/no-raw-control', 'jig/does-not-exist']);
  assert.match(block, /docs\/architecture\/rules\/no-raw-control\.md/);
  assert.doesNotMatch(block, /does-not-exist/);
});

test('docPointerBlock deduplicates repeated ids', () => {
  const block = docPointerBlock(['jig/no-raw-control', 'jig/no-raw-control']);
  const occurrences = block.split('no-raw-control.md').length - 1;
  assert.equal(occurrences, 1);
});

test('docPointerBlock returns an empty string for no ids or only unresolved ones', () => {
  assert.equal(docPointerBlock([]), '');
  assert.equal(docPointerBlock(['jig/does-not-exist']), '');
});
