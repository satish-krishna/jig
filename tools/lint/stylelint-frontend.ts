#!/usr/bin/env node
// The single definition of "stylelint the frontend", mirroring `lint-frontend.ts` for
// the CSS half of the gate. `npm run stylelint` and `tools/lint/stylelint-config.test.ts`
// both call `stylelintFrontend()` below rather than hand-rolling an invocation, for the
// reason CLAUDE.md's DRY gate gives: two encodings of one fact drift, and this repo has
// been bitten by that shape twice — a test glob that changed in one place and went stale
// in two others, and an ESLint invocation duplicated between the gate and the developer
// command until Ruling 15D collapsed it.
//
// `ignoreDisables: true` is the load-bearing option and the reason this file exists.
// A `/* stylelint-disable */` comment took `npm run stylelint` from exit 2 to exit 0 on
// four hardcoded values — a working suppression dial in the half of the gate nobody had
// checked, while ESLint's `linterOptions.noInlineConfig` had held the other half shut
// since the start. The spec claimed the two mirrored each other. They did not.
//
// A rule with a suppression mechanism will eventually be suppressed and cannot report
// that it was, which is the whole argument of ADR 0009 and of this branch. Turning the
// dial off in one place, that both callers share, is what makes the claim true.

import stylelint from 'stylelint';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG_PATH = join(ROOT, 'frontend', 'stylelint.config.mjs');

/**
 * `frontend/src/styles.css` is excluded because it DECLARES the tokens every other
 * file must use; the rule that bans a raw value everywhere else cannot apply to the
 * one file whose job is to define them.
 */
const DEFAULT_FILES = 'frontend/src/**/*.css';
const IGNORED = join(ROOT, 'frontend', 'src', 'styles.css');

export interface StylelintFrontendResult {
  /** True when nothing was reported at all — the bar `npm run stylelint`'s exit code uses. */
  ok: boolean;
  /** Every warning across every linted file, flattened. */
  warnings: { text: string; rule: string; line: number }[];
  /** The formatted report, empty string when there is nothing to print. */
  output: string;
}

/**
 * Runs stylelint over `files` with the frontend config and inline disables IGNORED.
 *
 * The `files` override exists for tests, which point it at `tools/lint/fixtures/`
 * rather than the live tree — the same isolation `lintFrontend` uses, and for the same
 * reason: `node --test` runs test files concurrently and a full-tree scan can race
 * another suite's fixture writes.
 */
export async function stylelintFrontend(files: string = DEFAULT_FILES): Promise<StylelintFrontendResult> {
  const result = await stylelint.lint({
    files,
    configFile: CONFIG_PATH,
    ignorePath: undefined,
    ignorePattern: [IGNORED],
    // Not negotiable, and the reason this module exists. See the header.
    ignoreDisables: true,
    formatter: 'string',
  });

  const warnings = result.results.flatMap((r) =>
    r.warnings.map((w) => ({ text: w.text, rule: w.rule, line: w.line })),
  );

  return { ok: warnings.length === 0, warnings, output: result.report ?? '' };
}

async function main() {
  const { ok, output } = await stylelintFrontend();
  if (output) console.log(output);
  process.exit(ok ? 0 : 2);
}

// Only run as a script, so importing this module for tests does not lint or exit.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
