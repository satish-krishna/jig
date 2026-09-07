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
//
// The destination is resolved INSIDE logFiring, at call time, never cached at module
// load. A module-level const cannot be redirected by a test that has already imported
// this module before setting the override, and this module IS imported (for LOG_PATH)
// by tests that run long before they get a chance to point anywhere else. JIG_HOOK_LOG
// is that override: set it and every subsequent logFiring call — in this process or a
// child spawned with the variable in its environment — writes there instead of to the
// production log. Tests that trigger a real firing must set it, or they poison
// .claude/hook-firings.jsonl with fixture noise, which is exactly what happened before
// this override existed.

import { appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The production telemetry path. Git-ignored. Telemetry, not evidence. */
export const LOG_PATH = join(ROOT, '.claude', 'hook-firings.jsonl');

/** One line of `.claude/hook-firings.jsonl`. */
export interface FiringRecord {
  hook: string;
  file: string;
  count: number;
  rules: string[];
  ts: string;
}

/** Resolved at call time so JIG_HOOK_LOG set after this module is loaded still redirects writes. */
export function resolveLogPath(): string {
  return process.env.JIG_HOOK_LOG || LOG_PATH;
}

export function logFiring(hook: string, file: string, count: number, rules: string[] = []): void {
  try {
    const record: FiringRecord = {
      hook,
      file,
      count,
      rules: [...new Set(rules)],
      ts: new Date().toISOString(),
    };
    appendFileSync(resolveLogPath(), JSON.stringify(record) + '\n');
  } catch {
    // never let logging break a gate
  }
}
