import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFirings, groupEpisodes, buildReport, formatReport, formatPercent, type Report } from './analyze-firings.ts';
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
//
// groupEpisodes itself is generic — it groups whatever sequence it is handed. The
// verify-hook exclusion and the zero-count exclusion happen in buildReport, tested
// separately below, so these tests exercise the adjacency and trend logic in isolation.

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
  // Three episodes, not two: adjacency in the sequence is what defines an episode,
  // not merely sharing a (hook, file) key.
  assert.equal(episodes.length, 3);
  assert.deepEqual(
    episodes.map((e) => e.file),
    ['a.ts', 'b.ts', 'a.ts'],
  );
});

test('different hooks on the same file do not merge into one episode', () => {
  const episodes = groupEpisodes([record('check-frontend', 'a.ts', 1), record('other-hook', 'a.ts', 1)]);
  assert.equal(episodes.length, 2);
});

// --- reading the log ----------------------------------------------------------
//
// Ruling 15B: the log is appended by a hook that can be killed mid-write, so a
// truncated final line is a normal state, not corruption. The analyzer must skip it,
// not throw.

const TEST_DIR = mkdtempSync(join(tmpdir(), 'jig-analyze-firings-'));

test('a missing log file reads as no firings', () => {
  assert.deepEqual(readFirings(join(TEST_DIR, 'does-not-exist.jsonl')), { records: [], skipped: 0 });
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
  assert.equal(result.records.length, 2);
  assert.equal(result.records[1].file, 'b.ts');
  assert.equal(result.skipped, 1, 'the truncated fragment must be counted, not silently dropped');
});

test('a blank line in the middle of the log is skipped', () => {
  const path = join(TEST_DIR, 'blank-line.jsonl');
  const good = JSON.stringify(record('check-frontend', 'a.ts', 1));
  writeFileSync(path, `${good}\n\n${good}\n`);
  const blank = readFirings(path);
  assert.equal(blank.records.length, 2);
  assert.equal(blank.skipped, 0, 'a blank line is not an unreadable line');
});

test.after(() => rmSync(TEST_DIR, { recursive: true, force: true }));

// --- report shape: hook firings vs. verify tallies -------------------------------
//
// Fix round 1, finding 1: these two populations must never be mixed. A whole-tree
// verify run has no single file, so consecutive verify records all share the same
// (hook, file) key — grouping them into episodes would chain N clean gate runs into
// one "flat" episode, reporting the exact failure shape this file exists to detect
// against a spotless record. The tests below pin the fix, not just the happy path.

test('an empty log reports honestly instead of printing zeros', () => {
  const report = buildReport([]);
  assert.equal(report.totalRecords, 0);
  assert.match(formatReport(report), /no firings recorded yet/i);
});

test('a log of only clean verify records reports zero firings and zero episodes — no flat episode', () => {
  const records = Array.from({ length: 10 }, () => record('verify', 'frontend', 0, []));
  const report = buildReport(records);

  assert.equal(report.hookFirings.total, 0);
  assert.equal(report.hookFirings.episodes.total, 0);
  assert.equal(report.hookFirings.episodes.byTrend.flat, 0);
  assert.equal(report.hookFirings.episodes.byTrend['first-try'], 0);

  assert.equal(report.verify.runs, 10);
  assert.equal(report.verify.runsWithViolations, 0);

  // The report has real history (ten gate runs) — this is not the empty-log case,
  // so it must not print the "nothing recorded yet" sentence.
  const text = formatReport(report);
  assert.doesNotMatch(text, /no firings recorded yet/i);
  assert.match(text, /Total: 0/);
});

test('verify records never enter episode grouping, even sharing the same (hook, file) key', () => {
  const records = [record('verify', 'frontend', 3, ['jig/no-raw-control']), record('verify', 'frontend', 3, [])];
  const report = buildReport(records);
  assert.equal(report.hookFirings.episodes.total, 0);
  assert.equal(report.verify.runs, 2);
  assert.equal(report.verify.runsWithViolations, 2);
  assert.equal(report.verify.totalViolations, 6);
});

test('a verify record between two hook firings on the same file does not split their episode', () => {
  // Deliberate choice: episodes are computed AFTER filtering out the verify hook, so
  // adjacency is judged on the filtered sequence, not the raw log. An unrelated
  // whole-tree gate run logging in between two check-frontend firings on the same
  // file did not actually interrupt the agent's correction loop on that file, so the
  // episode must not look interrupted either.
  const records = [
    record('check-frontend', 'a.ts', 3),
    record('verify', 'frontend', 0),
    record('check-frontend', 'a.ts', 2),
    record('verify', 'frontend', 0),
    record('check-frontend', 'a.ts', 1),
  ];
  const report = buildReport(records);
  assert.equal(report.hookFirings.episodes.total, 1);
  assert.equal(report.hookFirings.episodes.details[0].depth, 3);
  assert.equal(report.hookFirings.episodes.details[0].trend, 'improving');
});

test('the report counts hook firings and verify tallies separately, aggregating rule frequency for each', () => {
  const report = buildReport([
    record('check-frontend', 'a.ts', 1, ['jig/no-raw-control']),
    record('check-frontend', 'a.ts', 2, ['jig/no-raw-control', 'jig/no-style-attribute']),
    record('verify', 'frontend', 3, ['jig/no-raw-control']),
  ]);
  assert.equal(report.hookFirings.total, 2);
  assert.equal(report.hookFirings.byHook['check-frontend'], 2);
  assert.equal(report.hookFirings.byHook.verify, undefined);
  // 2, not 3: the verify record's own 'jig/no-raw-control' belongs to report.verify,
  // never to hookFirings — these two populations do not share a rule-frequency table.
  assert.equal(report.hookFirings.ruleFrequency['jig/no-raw-control'], 2);
  assert.equal(report.hookFirings.ruleFrequency['jig/no-style-attribute'], 1);

  assert.equal(report.verify.runs, 1);
  assert.equal(report.verify.runsWithViolations, 1);
  assert.equal(report.verify.totalViolations, 3);
  assert.equal(report.verify.ruleFrequency['jig/no-raw-control'], 1);
});

// --- effectiveness ratio ----------------------------------------------------------
//
// Fix round 2: the first version of this ratio mixed units — a raw firing-attempt
// count in the numerator against a verify-RUN count in the gate term — and produced
// two contradictions caught by experiment: a file that fired the same violation five
// times in a row (trend "flat", the exact failure this analyzer exists to surface)
// reported "100% caught in flight", and four real fixes against one 50-violation
// verify run reported "80%" two lines below its own "Total violations: 50". Both
// scenarios are reproduced explicitly below, named for what they are.

test('the effectiveness ratio refuses to report on a handful of events', () => {
  const report = buildReport([record('check-frontend', 'a.ts', 1, ['jig/no-raw-control'])]);
  assert.equal(report.effectiveness.value, null);
  assert.match(report.effectiveness.note, /not enough data/i);
});

test('the effectiveness ratio computes once there is enough combined data', () => {
  const records = [
    record('check-frontend', 'a.ts', 1),
    record('check-frontend', 'b.ts', 1),
    record('check-frontend', 'c.ts', 1),
    record('check-frontend', 'd.ts', 1),
    record('verify', 'frontend', 1),
    record('verify', 'frontend', 0),
  ];
  const report = buildReport(records);
  // 4 episodes corrected in flight, 1 violation reached the gate (the second verify
  // record is clean and contributes nothing) — 5 total drift events clears the floor.
  assert.equal(report.effectiveness.correctedInFlight, 4);
  assert.equal(report.effectiveness.reachedGate, 1);
  assert.equal(report.effectiveness.value, 4 / 5);
});

test('five identical firings on one file (trend flat) must not report 100% — the hook did its job and nothing was fixed', () => {
  const records = Array.from({ length: 5 }, () => record('check-frontend', 'a.ts', 2, ['jig/no-raw-control']));
  const report = buildReport(records);

  // One flat episode of depth 5 — the exact shape this whole analyzer exists to flag.
  assert.equal(report.hookFirings.episodes.total, 1);
  assert.equal(report.hookFirings.episodes.byTrend.flat, 1);

  // Five uncorrected firings, zero corrected, zero reached the gate: 5 total drift
  // events clears the floor, and the ratio must be a flat, honest 0% — not 100%, and
  // not "not enough data".
  assert.equal(report.effectiveness.correctedInFlight, 0);
  assert.equal(report.effectiveness.notCorrected, 5);
  assert.equal(report.effectiveness.reachedGate, 0);
  assert.equal(report.effectiveness.value, 0);
  assert.match(formatReport(report), /0% corrected in flight/);
});

test('four first-try fixes against one 50-violation verify run must not report 80% off a denominator of 5', () => {
  const records = [
    record('check-frontend', 'a.ts', 1),
    record('check-frontend', 'b.ts', 1),
    record('check-frontend', 'c.ts', 1),
    record('check-frontend', 'd.ts', 1),
    record('verify', 'frontend', 50, ['jig/no-raw-control']),
  ];
  const report = buildReport(records);

  assert.equal(report.effectiveness.correctedInFlight, 4);
  assert.equal(report.effectiveness.reachedGate, 50);
  // The denominator is 4 + 0 + 50 = 54, never 5 — the verify term is the violation
  // COUNT, not the number of verify runs (there is exactly one run here).
  assert.equal(report.effectiveness.value, 4 / 54);
  assert.match(formatReport(report), /Total violations: 50/);
});

test('the headline float can never contradict the trend breakdown (necessary, not sufficient)', () => {
  // At least one flat and one first-try episode, plus enough volume to clear the
  // floor: if the trend breakdown shows any flat or rising episodes, the effectiveness
  // VALUE must be below 1, full stop. This is the invariant fix round 2 encoded — and
  // it is real, but round 3 found it insufficient: the float can honestly be 0.995
  // and the RENDERED string can still say "100%" once toFixed rounds it. This test
  // stays because the model-level guarantee is still worth pinning; the test below it
  // is the one that actually catches a renderer that breaks this guarantee.
  const records = [
    record('check-frontend', 'a.ts', 1),
    record('check-frontend', 'b.ts', 2),
    record('check-frontend', 'b.ts', 2),
    record('check-frontend', 'c.ts', 1),
    record('check-frontend', 'd.ts', 1),
  ];
  const report = buildReport(records);
  assert.ok(report.hookFirings.episodes.byTrend.flat + report.hookFirings.episodes.byTrend.rising > 0);
  assert.ok(report.effectiveness.value !== null, 'expected enough data to compute a ratio');
  assert.ok(report.effectiveness.value! < 1, 'effectiveness must read below 100% whenever any episode failed to correct');
});

// --- fix round 3: the view can lie even when the model does not --------------------
//
// The re-reviewer reproduced both round-2 fixes correctly, then scaled one of them up
// and broke it: 398 clean episodes plus one 2-deep flat episode is value = 398/400 =
// 0.995. `(value * 100).toFixed(0)` ROUNDS, and "0.995".toFixed → "100" — the exact
// contradiction round 2 was supposed to eliminate, reintroduced by the renderer that
// the model-level invariant above never looks at. These tests assert against the
// STRING formatReport actually prints, because that is the layer that lied.

test('formatPercent floors below the 100%/0% boundary and never rounds across it', () => {
  assert.equal(formatPercent(1), '100%');
  assert.equal(formatPercent(0), '0%');
  // 0.995 is the exact regression value: toFixed(0) would render "100".
  assert.equal(formatPercent(0.995), '99%');
  assert.equal(formatPercent(0.999), '99%');
  // A nonzero numerator must never read as 0%, even when it floors to 0: "some drift
  // was corrected" must never render indistinguishably from "none was".
  assert.equal(formatPercent(0.001), '1%');
  assert.equal(formatPercent(0.5), '50%');
});

test('398 clean episodes plus one 2-deep flat episode must not render 100% in the report text', () => {
  const records = [
    ...Array.from({ length: 398 }, (_, i) => record('check-frontend', `clean-${i}.ts`, 1)),
    record('check-frontend', 'flat.ts', 2),
    record('check-frontend', 'flat.ts', 2),
  ];
  const report = buildReport(records);
  assert.equal(report.effectiveness.correctedInFlight, 398);
  assert.equal(report.effectiveness.notCorrected, 2);
  assert.equal(report.effectiveness.value, 398 / 400);

  const text = formatReport(report);
  assert.match(text, /flat: 1/);
  // This is the actual defect: assert against the rendered string, not the float —
  // the float-level invariant above already passes on this exact scenario.
  assert.doesNotMatch(text, /100%/);
  assert.match(text, /99% corrected in flight/);
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

  assert.equal(parsed.hookFirings.total, 3);
  assert.equal(parsed.hookFirings.episodes.total, 1);
  assert.equal(parsed.hookFirings.episodes.byTrend.improving, 1);
  assert.equal(parsed.verify.runs, 1);
  assert.equal(parsed.verify.runsWithViolations, 0);

  const textResult = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    env: { ...process.env, JIG_HOOK_LOG: path },
  });
  assert.equal(textResult.status, 0);
  assert.match(textResult.stdout, new RegExp(`Total: ${parsed.hookFirings.total}`));
  assert.match(textResult.stdout, new RegExp(`Episodes: ${parsed.hookFirings.episodes.total}`));
  assert.match(textResult.stdout, new RegExp(`Runs: ${parsed.verify.runs}`));
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

test('an unreadable log never prints the same sentence as an empty one', () => {
  // Layer five, found by the final whole-branch review. Three well-formed records
  // with one renamed field parsed as nothing, and the report printed "No firings
  // recorded yet." — byte-identical to a genuinely empty log, with totalRecords 0
  // in the JSON. Silence meant both "nothing happened" and "I could not read any
  // of this". This file's whole argument is that a report which cannot be wrong is
  // a report that gets quoted; the same defect kept reappearing one layer lower.
  const path = join(TEST_DIR, 'renamed-field.jsonl');
  const bad = JSON.stringify({ hook: 'check-frontend', path: 'a.ts', count: 1, rules: [] });
  writeFileSync(path, `${bad}
${bad}
${bad}
`);

  const { records, skipped } = readFirings(path);
  assert.equal(records.length, 0);
  assert.equal(skipped, 3);

  const unreadable = formatReport(buildReport(records, skipped));
  const empty = formatReport(buildReport([], 0));

  assert.notEqual(unreadable, empty, 'an unreadable log and an empty one must read differently');
  assert.match(unreadable, /could not be parsed/i);
  assert.match(empty, /no firings recorded yet/i);
});
