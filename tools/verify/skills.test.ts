import { test } from 'node:test';
import assert from 'node:assert/strict';
import { citedPaths, citedRuleIds, unknownRuleIds, checkSkills } from './skills.ts';

test('citedPaths reads a backticked repo-relative path', () => {
  assert.deepEqual(
    citedPaths('Copy `frontend/src/app/operations/user.operations.ts` and go.'),
    ['frontend/src/app/operations/user.operations.ts'],
  );
});

test('citedPaths ignores globs, signatures, commands and urls', () => {
  assert.deepEqual(citedPaths('`frontend/src/app/**/*.ts`'), []);
  assert.deepEqual(citedPaths('`type(scope): summary`'), []);
  assert.deepEqual(citedPaths('`npm run verify`'), []);
  assert.deepEqual(citedPaths('`https://example.com/a/b`'), []);
});

test('citedPaths keeps a directory path', () => {
  assert.deepEqual(citedPaths('See `.bob/adr/`.'), ['.bob/adr/']);
});

test('citedRuleIds reads only the rules section', () => {
  const body = [
    '## The sequence (TDD)',
    'Do not read `no-such-rule` from here.',
    '',
    '## Rules that bite here',
    '- `no-ng-model` — bind through the control registry.',
    '- `no-raw-control` — no hand-wired FormControl.',
    '',
    '## Before you commit',
    'Ignore `no-other-rule` down here too.',
  ].join('\n');
  assert.deepEqual(citedRuleIds(body), ['no-ng-model', 'no-raw-control']);
});

test('unknownRuleIds resolves against the real plugin, stripping any jig/ prefix', () => {
  assert.deepEqual(unknownRuleIds(['no-ng-model', 'jig/no-raw-control']), []);
  assert.deepEqual(unknownRuleIds(['no-such-rule']), ['no-such-rule']);
});

test('the real skill corpus is clean', () => {
  assert.deepEqual(checkSkills(), []);
});
