import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { citedPaths, citedRuleIds, unknownRuleIds, checkSkills } from './skills.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

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

test('checkSkills resolves a root-relative citation written with a leading slash, when the file exists', () => {
  const fixture = join(ROOT, '.claude/skills/__fixture_leading_slash_real__.md');
  writeFileSync(fixture, 'Real file: `/frontend/src/app/operations/user.operations.ts`.\n');
  try {
    const failures = checkSkills().filter((line) => line.includes('__fixture_leading_slash_real__'));
    assert.deepEqual(failures, []);
  } finally {
    unlinkSync(fixture);
  }
});

test('checkSkills reports a root-relative citation written with a leading slash, when the file does not exist', () => {
  const fixture = join(ROOT, '.claude/skills/__fixture_leading_slash_missing__.md');
  writeFileSync(fixture, 'Broken file: `/frontend/src/app/nope/missing.ts`.\n');
  try {
    const failures = checkSkills().filter((line) => line.includes('__fixture_leading_slash_missing__'));
    assert.deepEqual(failures, [
      '.claude/skills/__fixture_leading_slash_missing__.md: cites a path that does not exist: frontend/src/app/nope/missing.ts',
    ]);
  } finally {
    unlinkSync(fixture);
  }
});

test('the real skill corpus is clean', () => {
  assert.deepEqual(checkSkills(), []);
});
