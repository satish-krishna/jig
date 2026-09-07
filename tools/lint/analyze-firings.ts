#!/usr/bin/env node
// Task 15: turns .claude/hook-firings.jsonl into a report on whether the frontend
// enforcement hooks actually work — not just that they fire, but whether the agent
// they corrected learned from the correction.
//
// The unit of analysis is an EPISODE: a run of consecutive log lines that share the
// same (hook, file) pair. "Consecutive" means adjacent in the log itself, not merely
// sharing a key — a firing on the same file separated by a firing on a different file
// starts a new episode, because the intervening firing means the agent's attention
// moved elsewhere and came back.
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

function classifyTrend(counts: number[]): Trend {
  if (counts.length === 1) return 'first-try';
  const diffs = counts.slice(1).map((count, i) => count - counts[i]);
  if (diffs.every((d) => d === -1)) return 'improving';
  if (diffs.every((d) => d === 0)) return 'flat';
  if (diffs.every((d) => d > 0)) return 'rising';
  return 'mixed';
}

/** Groups consecutive log entries that share the same (hook, file) pair into episodes. */
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

export interface Report {
  totalFirings: number;
  byHook: Record<string, number>;
  ruleFrequency: Record<string, number>;
  episodes: {
    total: number;
    byTrend: Record<Trend, number>;
    details: Episode[];
  };
}

const TRENDS: Trend[] = ['first-try', 'improving', 'flat', 'rising', 'mixed'];

/** Builds the report object from parsed records. Pure — no file access, no printing. */
export function buildReport(records: FiringRecord[]): Report {
  const byHook: Record<string, number> = {};
  const ruleFrequency: Record<string, number> = {};
  for (const record of records) {
    byHook[record.hook] = (byHook[record.hook] ?? 0) + 1;
    for (const rule of record.rules) ruleFrequency[rule] = (ruleFrequency[rule] ?? 0) + 1;
  }

  const details = groupEpisodes(records);
  const byTrend = Object.fromEntries(TRENDS.map((t) => [t, 0])) as Record<Trend, number>;
  for (const episode of details) byTrend[episode.trend]++;

  return {
    totalFirings: records.length,
    byHook,
    ruleFrequency,
    episodes: { total: details.length, byTrend, details },
  };
}

/** Human-readable rendering of a report. An empty log gets an honest sentence, not zeros. */
export function formatReport(report: Report): string {
  if (report.totalFirings === 0) {
    return 'No firings recorded yet.';
  }

  const lines: string[] = [];
  lines.push(`Total firings: ${report.totalFirings}`);
  lines.push('');
  lines.push('By hook:');
  for (const [hook, count] of Object.entries(report.byHook)) lines.push(`  ${hook}: ${count}`);
  lines.push('');
  lines.push('Rule frequency:');
  const rules = Object.entries(report.ruleFrequency).sort((a, b) => b[1] - a[1]);
  if (rules.length === 0) lines.push('  (none)');
  for (const [rule, count] of rules) lines.push(`  ${rule}: ${count}`);
  lines.push('');
  lines.push(`Episodes: ${report.episodes.total}`);
  for (const trend of TRENDS) lines.push(`  ${trend}: ${report.episodes.byTrend[trend]}`);
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
