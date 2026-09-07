import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFirings, groupEpisodes, buildReport, formatReport, type Report } from './analyze-firings.ts';
import type { FiringRecord } from '../hooks/_hook-log.ts';

const SCRIPT = fileURLToPath(new URL('./analyze-firings.ts', import.meta.url));

function record(hook: string, file: string, count: number, rules: string[] = []): FiringRecord {
  return { hook, file, count, rules, ts: '2026-09-07T00:00:00.000Z' };
}

// --- episode arithmetic -----------------------------------------------------
//
// This is the substance of the task: consecutive firings on the same (hook, file)
// pair form one episode, and the shape of the count sequence inside an episode says
// whether the correction is landing. Flat and rising are asserted explicitly and
// separately from improving, because those are the cases meaning the hook failed to
// change the agent's next edit — they must not be silently lumped in with success.

test('a single firing on a file is a first-try episode of depth 1', () => {
  const episodes = groupEpisodes([record('check-frontend', 'a.ts', 3, ['jig/no-raw-control'])]);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].depth, 1);
  assert.equal(episodes[0].trend, 'first-try');
});

test('a count stepping down by exactly one per firing is improving', () => {
  const episodes = groupEpisodes([
    record('check-frontend', 'a.ts', 3),
    record('check-frontend', 'a.ts', 2),
    record('check-frontend', 'a.ts', 1),
  ]);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].depth, 3);
  assert.equal(episodes[0].trend, 'improving');
});

test('a flat count across an episode is not learning', () => {
  const episodes = groupEpisodes([
    record('check-frontend', 'b.ts', 2),
    record('check-frontend', 'b.ts', 2),
    record('check-frontend', 'b.ts', 2),
  ]);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].trend, 'flat');
});

test('a rising count across an episode is not learning', () => {
  const episodes = groupEpisodes([
    record('check-frontend', 'c.ts', 1),
    record('check-frontend', 'c.ts', 2),
    record('check-frontend', 'c.ts', 3),
  ]);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].trend, 'rising');
});

test('an irregular count sequence is mixed, not silently improving or flat', () => {
  const episodes = groupEpisodes([
    record('check-frontend', 'd.ts', 2),
    record('check-frontend', 'd.ts', 4),
    record('check-frontend', 'd.ts', 1),
  ]);
  assert.equal(episodes.length, 1);
  assert.equal(episodes[0].trend, 'mixed');
});

test('a firing on a different file breaks the episode even if the same file recurs later', () => {
  const episodes = groupEpisodes([
    record('check-frontend', 'a.ts', 2),
    record('check-frontend', 'b.ts', 1),
    record('check-frontend', 'a.ts', 1),
  ]);
  // Three episodes, not two: adjacency in the log is what defines an episode, not
  // merely sharing a (hook, file) key.
  assert.equal(episodes.length, 3);
  assert.deepEqual(
    episodes.map((e) => e.file),
    ['a.ts', 'b.ts', 'a.ts'],
  );
});

test('different hooks on the same file do not merge into one episode', () => {
  const episodes = groupEpisodes([record('check-frontend', 'a.ts', 1), record('verify', 'a.ts', 1)]);
  assert.equal(episodes.length, 2);
});

// --- reading the log ----------------------------------------------------------
//
// Ruling 15B: the log is appended by a hook that can be killed mid-write, so a
// truncated final line is a normal state, not corruption. The analyzer must skip it,
// not throw.

const TEST_DIR = mkdtempSync(join(tmpdir(), 'jig-analyze-firings-'));

test('a missing log file reads as no firings', () => {
  assert.deepEqual(readFirings(join(TEST_DIR, 'does-not-exist.jsonl')), []);
});

test('an unparseable trailing line is skipped, not thrown', () => {
  const path = join(TEST_DIR, 'truncated.jsonl');
  const good1 = JSON.stringify(record('check-frontend', 'a.ts', 1, ['jig/no-raw-control']));
  const good2 = JSON.stringify(record('check-frontend', 'b.ts', 2, ['jig/no-style-attribute']));
  // No trailing newline after the truncated fragment: this is what a kill mid-write
  // to appendFileSync actually leaves behind.
  writeFileSync(path, `${good1}\n${good2}\n{"hook":"check-frontend","file":"c.ts","cou`);

  assert.doesNotThrow(() => readFirings(path));
  const result = readFirings(path);
  assert.equal(result.length, 2);
  assert.equal(result[1].file, 'b.ts');
});

test('a blank line in the middle of the log is skipped', () => {
  const path = join(TEST_DIR, 'blank-line.jsonl');
  const good = JSON.stringify(record('check-frontend', 'a.ts', 1));
  writeFileSync(path, `${good}\n\n${good}\n`);
  assert.equal(readFirings(path).length, 2);
});

test.after(() => rmSync(TEST_DIR, { recursive: true, force: true }));

// --- report shape ---------------------------------------------------------------

test('an empty log reports honestly instead of printing zeros', () => {
  const report = buildReport([]);
  assert.equal(report.totalFirings, 0);
  assert.match(formatReport(report), /no firings recorded yet/i);
});

test('the report counts firings by hook and aggregates rule frequency', () => {
  const report = buildReport([
    record('check-frontend', 'a.ts', 1, ['jig/no-raw-control']),
    record('check-frontend', 'a.ts', 2, ['jig/no-raw-control', 'jig/no-style-attribute']),
    record('verify', 'frontend', 3, ['jig/no-raw-control']),
  ]);
  assert.equal(report.totalFirings, 3);
  assert.equal(report.byHook['check-frontend'], 2);
  assert.equal(report.byHook.verify, 1);
  assert.equal(report.ruleFrequency['jig/no-raw-control'], 3);
  assert.equal(report.ruleFrequency['jig/no-style-attribute'], 1);
});

// --- --json ---------------------------------------------------------------------
//
// Any claim made from this report must be re-derivable by someone who does not trust
// the claim, which means --json has to be a single parseable object carrying the same
// figures as the human-readable text, not a second, looser representation of them.

test('--json emits one parseable object matching the human-readable figures', () => {
  const path = join(TEST_DIR, 'cli-log.jsonl');
  writeFileSync(
    path,
    [
      record('check-frontend', 'a.ts', 3, ['jig/no-raw-control']),
      record('check-frontend', 'a.ts', 2, ['jig/no-raw-control']),
      record('check-frontend', 'a.ts', 1, ['jig/no-raw-control']),
      record('verify', 'frontend', 0, []),
    ]
      .map((r) => JSON.stringify(r))
      .join('\n') + '\n',
  );

  const jsonResult = spawnSync(process.execPath, [SCRIPT, '--json'], {
    encoding: 'utf8',
    env: { ...process.env, JIG_HOOK_LOG: path },
  });
  assert.equal(jsonResult.status, 0);

  assert.doesNotThrow(
    () => JSON.parse(jsonResult.stdout),
    'stdout under --json must be a single parseable JSON object',
  );
  const parsed: Report = JSON.parse(jsonResult.stdout);

  assert.equal(parsed.totalFirings, 4);
  assert.equal(parsed.episodes.total, 2);
  assert.equal(parsed.episodes.byTrend.improving, 1);
  assert.equal(parsed.episodes.byTrend['first-try'], 1);

  const textResult = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, JIG_HOOK_LOG: path },
  });
  assert.equal(textResult.status, 0);
  assert.match(textResult.stdout, new RegExp(`Total firings: ${parsed.totalFirings}`));
  assert.match(textResult.stdout, new RegExp(`Episodes: ${parsed.episodes.total}`));
});

test('the CLI reports honestly against an empty redirected log', () => {
  const path = join(TEST_DIR, 'empty-log.jsonl');
  writeFileSync(path, '');
  const result = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, JIG_HOOK_LOG: path },
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /no firings recorded yet/i);
});
