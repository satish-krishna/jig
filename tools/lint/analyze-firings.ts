#!/usr/bin/env node
// Task 15: turns .claude/hook-firings.jsonl into a report on whether the frontend
// enforcement hooks actually work — not just that they fire, but whether the agent
// they corrected learned from the correction.
//
// The log holds two different populations and they must never be mixed:
//
//   - Per-file hook records (hook: "check-frontend", or any future corrective hook):
//     drift caught IN FLIGHT, right after an edit. These are the only records that
//     can form an EPISODE — a per-file correction loop where the hook fires, the
//     agent edits, and the hook fires again on the same file.
//   - The verify hook's tally (hook: "verify"): one record per gate run, logged
//     against the whole tree, not a single file. This is drift that REACHED THE GATE.
//     A whole-tree run is not a correction loop and must never enter episode grouping
//     — grouping it in would chain consecutive clean gate runs into one long "episode"
//     with a flat count, which is exactly the shape this file defines as the failure
//     case, reported against a spotless record. See the fix for this in buildReport.
//
// A record with count 0 (a clean verify run) is not a firing — nothing fired. Firing
// counts, rule frequency, and episodes are all computed only from records where
// count > 0.
//
// The unit of analysis for hook firings is an EPISODE: a run of consecutive
// FIRING records (verify already excluded, zero-count already excluded) that share
// the same (hook, file) pair. "Consecutive" is computed AFTER those exclusions, not
// on the raw log — so a verify record logged between two check-frontend firings on
// the same file does not split them into separate episodes. The agent's correction
// loop on that file was never actually interrupted by an unrelated whole-tree lint
// run happening to log in between; the episode should not look interrupted either.
//
// Depth 1 means the correction landed on the first try: the hook fired once on that
// file and never fired on it again immediately after. Depth > 1 means it fired more
// than once in a row on the same file, and the COUNT across those firings tells the
// rest of the story: stepping down by exactly one violation per firing ("improving")
// is an agent working through a batch, fixing one thing at a time and getting
// re-checked each time. Flat or rising is the failure case this whole log exists to
// surface — the agent hit the same wall repeatedly without the correction changing
// its next edit. Anything else (an irregular mix of ups and downs) is "mixed".
//
// Unparseable lines are skipped, not fatal. The log is appended by a hook that can be
// killed mid-write (see _hook-log.ts), so a truncated final line is a normal state,
// not corruption — a report that dies on its own telemetry is a report nobody runs
// twice.

import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveLogPath, type FiringRecord } from '../hooks/_hook-log.ts';

/** The hook name verify.ts logs its whole-tree tally under. Never a per-file episode participant. */
export const VERIFY_HOOK = 'verify';

/** Parses one log line, or returns undefined if it is not valid JSON in the expected shape. */
function parseLine(line: string): FiringRecord | undefined {
  if (!line.trim()) return undefined;
  try {
    const value = JSON.parse(line);
    const isValid =
      typeof value?.hook === 'string' &&
      typeof value?.file === 'string' &&
      typeof value?.count === 'number' &&
      Array.isArray(value?.rules);
    return isValid ? (value as FiringRecord) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reads a firings log, skipping any line that fails to parse. A missing file reads as
 * no firings rather than an error — a report has to run before the log exists at all.
 */
export function readFirings(path: string): FiringRecord[] {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, 'utf8').split('\n');
  const records: FiringRecord[] = [];
  for (const line of lines) {
    const record = parseLine(line);
    if (record) records.push(record);
  }
  return records;
}

export type Trend = 'first-try' | 'improving' | 'flat' | 'rising' | 'mixed';

export interface Episode {
  hook: string;
  file: string;
  counts: number[];
  depth: number;
  trend: Trend;
}

const TRENDS: Trend[] = ['first-try', 'improving', 'flat', 'rising', 'mixed'];

function classifyTrend(counts: number[]): Trend {
  if (counts.length === 1) return 'first-try';
  const diffs = counts.slice(1).map((count, i) => count - counts[i]);
  if (diffs.every((d) => d === -1)) return 'improving';
  if (diffs.every((d) => d === 0)) return 'flat';
  if (diffs.every((d) => d > 0)) return 'rising';
  return 'mixed';
}

/**
 * Groups consecutive records that share the same (hook, file) pair into episodes.
 * Callers are responsible for pre-filtering to the population that can meaningfully
 * form an episode — buildReport below excludes the verify hook and zero-count records
 * before calling this, so "consecutive" means adjacent in that filtered sequence, not
 * in the raw log.
 */
export function groupEpisodes(records: FiringRecord[]): Episode[] {
  const episodes: Episode[] = [];
  for (const record of records) {
    const last = episodes[episodes.length - 1];
    if (last && last.hook === record.hook && last.file === record.file) {
      last.counts.push(record.count);
    } else {
      episodes.push({ hook: record.hook, file: record.file, counts: [record.count], depth: 1, trend: 'first-try' });
    }
  }
  for (const episode of episodes) {
    episode.depth = episode.counts.length;
    episode.trend = classifyTrend(episode.counts);
  }
  return episodes;
}

export interface HookFirings {
  /** Records with hook !== "verify" and count > 0. This, not the raw record count, is "how many times a hook fired". */
  total: number;
  byHook: Record<string, number>;
  ruleFrequency: Record<string, number>;
  episodes: {
    total: number;
    byTrend: Record<Trend, number>;
    details: Episode[];
  };
}

export interface VerifyTally {
  /** Every verify record seen, clean or not. */
  runs: number;
  /** Verify records with count > 0 — drift that reached the gate. */
  runsWithViolations: number;
  totalViolations: number;
  ruleFrequency: Record<string, number>;
}

export interface Effectiveness {
  /** Fraction of drift events caught in flight, or null when there is not enough data to trust a ratio. */
  value: number | null;
  note: string;
}

export interface Report {
  /** Raw record count, including clean verify runs. Only used to decide the "nothing recorded yet" case. */
  totalRecords: number;
  hookFirings: HookFirings;
  verify: VerifyTally;
  effectiveness: Effectiveness;
}

/**
 * A ratio built from a handful of events is noise wearing a percentage sign. Below
 * this many combined observations, the report says so instead of printing a number
 * nobody should act on.
 */
const MIN_SAMPLE_FOR_RATIO = 5;

function buildEffectiveness(caughtInFlight: number, reachedGate: number): Effectiveness {
  const total = caughtInFlight + reachedGate;
  const plural = (n: number) => (n === 1 ? '' : 's');
  if (total === 0) {
    return { value: null, note: 'no drift observed yet, in flight or at the gate' };
  }
  if (total < MIN_SAMPLE_FOR_RATIO) {
    return {
      value: null,
      note: `not enough data to trust a ratio yet (${total} observation${plural(total)} so far; want at least ${MIN_SAMPLE_FOR_RATIO})`,
    };
  }
  return {
    value: caughtInFlight / total,
    note: `${caughtInFlight} of ${total} drift event${plural(total)} were caught in flight, before reaching the gate`,
  };
}

/** Builds the report object from parsed records. Pure — no file access, no printing. */
export function buildReport(records: FiringRecord[]): Report {
  const hookRecords = records.filter((r) => r.hook !== VERIFY_HOOK);
  const verifyRecords = records.filter((r) => r.hook === VERIFY_HOOK);

  // See the header comment: a record that found nothing did not fire.
  const firingRecords = hookRecords.filter((r) => r.count > 0);

  const byHook: Record<string, number> = {};
  const ruleFrequency: Record<string, number> = {};
  for (const record of firingRecords) {
    byHook[record.hook] = (byHook[record.hook] ?? 0) + 1;
    for (const rule of record.rules) ruleFrequency[rule] = (ruleFrequency[rule] ?? 0) + 1;
  }

  const details = groupEpisodes(firingRecords);
  const byTrend = Object.fromEntries(TRENDS.map((t) => [t, 0])) as Record<Trend, number>;
  for (const episode of details) byTrend[episode.trend]++;

  const runsWithViolations = verifyRecords.filter((r) => r.count > 0);
  const verifyRuleFrequency: Record<string, number> = {};
  for (const record of runsWithViolations) {
    for (const rule of record.rules) verifyRuleFrequency[rule] = (verifyRuleFrequency[rule] ?? 0) + 1;
  }

  return {
    totalRecords: records.length,
    hookFirings: {
      total: firingRecords.length,
      byHook,
      ruleFrequency,
      episodes: { total: details.length, byTrend, details },
    },
    verify: {
      runs: verifyRecords.length,
      runsWithViolations: runsWithViolations.length,
      totalViolations: runsWithViolations.reduce((sum, r) => sum + r.count, 0),
      ruleFrequency: verifyRuleFrequency,
    },
    effectiveness: buildEffectiveness(firingRecords.length, runsWithViolations.length),
  };
}

function formatRuleFrequency(ruleFrequency: Record<string, number>, indent: string): string[] {
  const rules = Object.entries(ruleFrequency).sort((a, b) => b[1] - a[1]);
  if (rules.length === 0) return [`${indent}(none)`];
  return rules.map(([rule, count]) => `${indent}${rule}: ${count}`);
}

/** Human-readable rendering of a report. An empty log gets an honest sentence, not zeros. */
export function formatReport(report: Report): string {
  if (report.totalRecords === 0) {
    return 'No firings recorded yet.';
  }

  const lines: string[] = [];

  lines.push('Hook firings (caught in flight):');
  lines.push(`  Total: ${report.hookFirings.total}`);
  if (report.hookFirings.total === 0) {
    lines.push('  (none)');
  } else {
    lines.push('  By hook:');
    for (const [hook, count] of Object.entries(report.hookFirings.byHook)) lines.push(`    ${hook}: ${count}`);
    lines.push('  Rule frequency:');
    lines.push(...formatRuleFrequency(report.hookFirings.ruleFrequency, '    '));
    lines.push(`  Episodes: ${report.hookFirings.episodes.total}`);
    for (const trend of TRENDS) lines.push(`    ${trend}: ${report.hookFirings.episodes.byTrend[trend]}`);
  }

  lines.push('');
  lines.push('Verify tallies (reached the gate):');
  lines.push(`  Runs: ${report.verify.runs}`);
  lines.push(`  Runs with violations: ${report.verify.runsWithViolations}`);
  if (report.verify.runsWithViolations > 0) {
    lines.push(`  Total violations: ${report.verify.totalViolations}`);
    lines.push('  Rule frequency:');
    lines.push(...formatRuleFrequency(report.verify.ruleFrequency, '    '));
  }

  lines.push('');
  lines.push('Effectiveness:');
  lines.push(
    report.effectiveness.value === null
      ? `  ${report.effectiveness.note}`
      : `  ${(report.effectiveness.value * 100).toFixed(0)}% caught in flight (${report.effectiveness.note})`,
  );

  return lines.join('\n');
}

function main() {
  const records = readFirings(resolveLogPath());
  const report = buildReport(records);
  console.log(process.argv.includes('--json') ? JSON.stringify(report) : formatReport(report));
}

// Only run as a script, so importing this module for tests does not print anything.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
