#!/usr/bin/env node
// The single definition of "lint the frontend". `npm run lint` (what a developer runs
// by hand) and `tools/verify/verify.ts` (the gate) both call `lintFrontend()` below —
// neither hand-rolls its own ESLint invocation. Two encodings of the same fact — the
// config file, the target directory, what counts as a violation — are exactly what
// CLAUDE.md's DRY gate forbids, and this repo has already been bitten by that shape
// once: a test glob changed in one place and went stale in two others. Change what
// "lint the frontend" means here, once, and both callers see it the next time they run.

import { ESLint } from 'eslint';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FRONTEND = join(ROOT, 'frontend');
const CONFIG_PATH = join(FRONTEND, 'eslint.config.mjs');

export interface LintFrontendResult {
  /** True when every result had zero errors — the same bar `npm run lint`'s exit code uses. */
  ok: boolean;
  /** Total ESLint messages across the whole frontend tree. */
  messageCount: number;
  /** Rule ids that fired, one entry per message, duplicates kept (a caller that wants unique ids can dedupe). */
  ruleIds: string[];
  /** The stylish-formatted report, empty string when there is nothing to print. */
  output: string;
}

/**
 * Lints `targets` with the jig ruleset. Defaults to the whole `frontend/` tree, which
 * is what both real callers (the CLI below with no arguments, and `verify.ts`) use.
 *
 * The override exists for tests: `lint-frontend.test.ts` points it at fixture files
 * under `tools/lint/fixtures/` instead of the live `frontend/src` tree, because
 * `node --test` runs test files concurrently and `tools/hooks/check-frontend.test.ts`
 * writes and deletes its own real fixtures under `frontend/src/app/` while its suite
 * runs — a full-tree scan running at the same time can catch one of those files
 * between its write and its delete and fail on a spurious ENOENT. Isolated fixtures
 * side-step that race entirely, and they also make the tests fast: a real full-tree
 * lint takes seconds, a two-file lint does not.
 *
 * cwd is pinned to ROOT for the same reason `tools/hooks/check-frontend.ts` pins it:
 * ESLint 9 resolves a flat config's basePath — and therefore every root-relative
 * `ignores` pattern — from the cwd it is given when a config file is passed
 * explicitly, not from the config file's own directory.
 */
export async function lintFrontend(targets: string[] = [FRONTEND]): Promise<LintFrontendResult> {
  const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: CONFIG_PATH });
  const results = await eslint.lintFiles(targets);

  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);

  const messages = results.flatMap((r) => r.messages);
  const ruleIds = messages.map((m) => m.ruleId).filter((id): id is string => Boolean(id));

  // A run that linted nothing is a FAILURE, not a pass. `results.every(...)` on an
  // empty array is `true`, so without this the gate goes green having checked no
  // files at all — the spec asked for this check and it was never built.
  //
  // Not theoretical. Changing `files: ['**/*.ts']` to `['**/*.tsx']` in
  // eslint.config.mjs is one character, matches two files, silently disables all
  // twelve TypeScript rules including every MVVM rule, and leaves the whole suite
  // green with VERIFY OK. Measured by the final review. The companion guard lives
  // in config-completeness.test.ts, which now pins both `files` arrays; this one
  // catches the runtime shape the test cannot see.
  if (results.length === 0) {
    return {
      ok: false,
      messageCount: 0,
      ruleIds: [],
      output:
        'ESLint linted ZERO files. The ruleset is not running — check the `files` globs and ' +
        '`ignores` in frontend/eslint.config.mjs. A gate that checks nothing must never report green.',
    };
  }

  const ok = results.every((r) => r.errorCount === 0);

  return { ok, messageCount: messages.length, ruleIds, output };
}

/**
 * Extra CLI arguments are target overrides, same as `lintFrontend`'s parameter — used
 * only by tests, driving the CLI as a subprocess against isolated fixtures. `npm run
 * lint` passes none, so it always lints the real frontend tree.
 */
async function main() {
  const targets = process.argv.slice(2);
  const result = await lintFrontend(targets.length > 0 ? targets : undefined);
  if (result.output) console.log(result.output);
  process.exit(result.ok ? 0 : 1);
}

// Only run as a script, so importing this module for tests or from verify.ts does not print or exit.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
