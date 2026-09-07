import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldLint } from './check-frontend.ts';
import { LOG_PATH } from './_hook-log.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOK = fileURLToPath(new URL('./check-frontend.ts', import.meta.url));

const run = (stdin: string) => spawnSync(process.execPath, [HOOK], { input: stdin, encoding: 'utf8' });

// --- path filter ----------------------------------------------------------
//
// The hook protects nothing outside frontend/src/, and nothing that is not a .ts or
// .html file, so it must stay silent there — a check that fires on everything is as
// useless as one that fires on nothing.

test('targets a .ts file under frontend/src/', () => {
  assert.equal(shouldLint('frontend/src/app/app.ts'), true);
  assert.equal(shouldLint('D:\\Repos\\jig\\frontend\\src\\app\\app.ts'), true);
});

test('targets a .html file under frontend/src/', () => {
  assert.equal(shouldLint('frontend/src/app/app.html'), true);
});

test('stays silent outside frontend/src/', () => {
  assert.equal(shouldLint('services/api/src/Jig.Api/Users/GetUserEndpoint.cs'), false);
  assert.equal(shouldLint('tools/hooks/check-frontend.ts'), false);
  assert.equal(shouldLint('frontend/eslint.config.mjs'), false);
  assert.equal(shouldLint(''), false);
});

test('stays silent on a file under frontend/src/ that is not .ts or .html', () => {
  assert.equal(shouldLint('frontend/src/app/app.css'), false);
  assert.equal(shouldLint('frontend/src/styles.css'), false);
  assert.equal(shouldLint('frontend/src/app/app.config.json'), false);
});

// --- end to end -------------------------------------------------------------
//
// Real fixture files under frontend/src/, written and removed by the test itself so
// the working tree is clean before and after. The dirty fixture trips no-raw-control
// (a native <button> with no libs/ui primitive attribute) deliberately — one of the
// simplest of the 26 rules to trigger without any Angular component scaffolding.

const CLEAN_FIXTURE = join(ROOT, 'frontend', 'src', 'app', '__check-frontend-fixture-clean.html');
const DIRTY_FIXTURE = join(ROOT, 'frontend', 'src', 'app', '__check-frontend-fixture-dirty.html');
const OUTSIDE_FIXTURE = join(ROOT, 'docs', '__check-frontend-fixture-outside.html');

function withFixture(path: string, content: string, fn: () => void) {
  writeFileSync(path, content);
  try {
    fn();
  } finally {
    unlinkSync(path);
  }
}

test('a clean frontend file exits 0', () => {
  withFixture(CLEAN_FIXTURE, '<button hlmBtn>Save</button>\n', () => {
    const result = run(JSON.stringify({ tool_input: { file_path: CLEAN_FIXTURE } }));
    assert.equal(result.status, 0);
  });
});

test('a dirty frontend file exits 2 with the rule doc path in the message', () => {
  withFixture(DIRTY_FIXTURE, '<button>Save</button>\n', () => {
    const result = run(JSON.stringify({ tool_input: { file_path: DIRTY_FIXTURE } }));
    assert.equal(result.status, 2);
    // Load-bearing: ESLint never prints meta.docs.url itself. If the hook does not
    // append it deliberately, the pointer this whole task exists to deliver reaches
    // nobody.
    assert.match(result.stderr, /docs\/architecture\/rules\/no-raw-control\.md/);
    assert.match(result.stderr, /no-raw-control/);
  });
});

test('a dirty file outside frontend/src/ is not linted at all', () => {
  withFixture(OUTSIDE_FIXTURE, '<button>Save</button>\n', () => {
    const result = run(JSON.stringify({ tool_input: { file_path: OUTSIDE_FIXTURE } }));
    assert.equal(result.status, 0);
  });
});

test('fails closed on malformed or empty stdin', () => {
  const malformed = run('not json');
  assert.equal(malformed.status, 2);
  assert.match(malformed.stderr, /could not parse/i);
  assert.equal(run('').status, 2);
});

test('a firing is appended to the git-ignored log', () => {
  const before = existsSync(LOG_PATH) ? readFileSync(LOG_PATH, 'utf8').split('\n').length : 0;
  withFixture(DIRTY_FIXTURE, '<button>Save</button>\n', () => {
    const result = run(JSON.stringify({ tool_input: { file_path: DIRTY_FIXTURE } }));
    assert.equal(result.status, 2);
  });
  const after = readFileSync(LOG_PATH, 'utf8').trim().split('\n');
  assert.ok(after.length > before - 1);
  const last = JSON.parse(after[after.length - 1]);
  assert.equal(last.hook, 'check-frontend');
  assert.equal(typeof last.count, 'number');
  assert.ok(last.count > 0);
  assert.ok(Array.isArray(last.rules));
  assert.ok(last.rules.includes('jig/no-raw-control'));
});
