import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintFrontend } from './lint-frontend.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = fileURLToPath(new URL('./lint-frontend.ts', import.meta.url));

// Static fixtures, not written and deleted at test time: `node --test` runs test
// files concurrently, and tools/hooks/check-frontend.test.ts writes and deletes its
// own real fixtures under the live frontend/src/app/ tree while its suite runs. A
// full-tree lint racing against that write/delete cycle can catch a file between the
// two and fail on a spurious ENOENT rather than a real rule violation. Fixtures under
// tools/lint/fixtures/ (same home as spacing-clean.css / spacing-dirty.css) are never
// touched by any other suite, so there is nothing to race.
const CLEAN_FIXTURE = join(ROOT, 'tools', 'lint', 'fixtures', 'lint-frontend-clean.html');
const DIRTY_FIXTURE = join(ROOT, 'tools', 'lint', 'fixtures', 'lint-frontend-dirty.html');

test('a clean target lints ok with zero violations', async () => {
  const result = await lintFrontend([CLEAN_FIXTURE]);
  assert.equal(result.ok, true);
  assert.equal(result.messageCount, 0);
  assert.deepEqual(result.ruleIds, []);
});

test('a violation in the target is caught, with its rule id and a nonzero count', async () => {
  const result = await lintFrontend([DIRTY_FIXTURE]);
  assert.equal(result.ok, false);
  assert.ok(result.messageCount > 0);
  assert.ok(result.ruleIds.includes('jig/no-raw-control'));
  assert.match(result.output, /no-raw-control/);
});

// The default target (the real frontend/ tree, used by `npm run lint` and `verify.ts`
// with no override) is deliberately not exercised here: `node --test` runs test files
// concurrently, and a full-tree scan racing tools/hooks/check-frontend.test.ts's own
// write-then-delete fixture cycle under frontend/src/app/ can catch a file mid-delete
// and fail on a spurious ENOENT rather than a real violation. `npm run lint` itself,
// run standalone as part of the verification gate, is what actually exercises that
// default path end to end.

// --- CLI entry point --------------------------------------------------------
//
// `npm run lint` shells out to this file with no arguments, which must lint the real
// frontend tree and behave exactly as the bare `eslint frontend --config ...` command
// it replaced: print the stylish report and exit non-zero on any violation, zero on a
// clean tree. Extra CLI arguments are target overrides (see lint-frontend.ts), used
// here to drive the same isolated fixtures the function-level tests above use, so the
// CLI path is exercised without racing the live tree either.

test('the CLI exits 0 on a clean target', () => {
  const result = spawnSync(process.execPath, [SCRIPT, CLEAN_FIXTURE], { encoding: 'utf8', cwd: ROOT });
  assert.equal(result.status, 0);
});

test('the CLI exits 1 and prints the stylish report on a violation', () => {
  const result = spawnSync(process.execPath, [SCRIPT, DIRTY_FIXTURE], { encoding: 'utf8', cwd: ROOT });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /no-raw-control/);
});
