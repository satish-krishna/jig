// Shared telemetry writer for the frontend enforcement hooks.
//
// One line per firing: which hook, which file, how many violations, which rules. `count`
// is a NUMBER — how many ESLint messages fired on this file, not the message text — because
// Task 15's analyzer aggregates counts and rule ids across the log, and message text is
// deliberately absent: a log running for months across every session would otherwise
// accumulate source fragments nobody reads.
//
// Logging never throws into the gate. A gate that dies because its telemetry could not
// write is worse than a gate with no telemetry.

import { appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Git-ignored. Telemetry, not evidence. */
export const LOG_PATH = join(ROOT, '.claude', 'hook-firings.jsonl');

export function logFiring(hook: string, file: string, count: number, rules: string[] = []): void {
  try {
    const record = { hook, file, count, rules: [...new Set(rules)], ts: new Date().toISOString() };
    appendFileSync(LOG_PATH, JSON.stringify(record) + '\n');
  } catch {
    // never let logging break a gate
  }
}
