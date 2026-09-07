#!/usr/bin/env node
// The one-command gate: full build, all tests across all three languages, and
// catalog freshness. Green here is the definition of "the fixture holds". Runs
// each step in order and stops at the first failure, naming it.

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { logFiring } from '../hooks/_hook-log.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');
const FRONTEND = join(ROOT, 'frontend');
const FRONTEND_ESLINT_CONFIG = join(FRONTEND, 'eslint.config.mjs');

/**
 * Runs the same ESLint ruleset as `npm run lint`, but via the API instead of the CLI,
 * so the violation count and rule ids are available to log rather than only printed.
 *
 * Task 15's whole measurement rests on the distinction between the two places this
 * ruleset runs: `tools/hooks/check-frontend.ts` fires per file, in flight, right after
 * an edit. This step fires once per verify run, at the gate — drift it finds here is
 * drift that reached a commit without the per-file hook catching it first. Logging
 * happens BEFORE the pass/fail decision below, so a run that finds violations still
 * records what they were instead of only recording clean runs.
 */
async function runFrontendLint(): Promise<boolean> {
  const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: FRONTEND_ESLINT_CONFIG });
  const results = await eslint.lintFiles([FRONTEND]);

  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  if (output) console.log(output);

  const messages = results.flatMap((r) => r.messages);
  const ruleIds = messages.map((m) => m.ruleId).filter((id): id is string => Boolean(id));
  logFiring('verify', 'frontend', messages.length, ruleIds);

  return results.every((r) => r.errorCount === 0);
}

const steps: [string, string | (() => Promise<boolean>), string][] = [
  ['catalog freshness', 'node tools/catalog/catalog.ts --check', ROOT],
  ['showcase api freshness', 'node tools/showcase-api/showcase-api.ts --check', ROOT],
  ['tools typecheck', 'npm run typecheck', ROOT],
  ['tooling tests', 'node --test "tools/**/*.test.ts"', ROOT],
  ['backend tests (.NET)', 'dotnet test services/api/Jig.sln --nologo -v q', ROOT],
  ['rust tests', 'cargo test', SRC_TAURI],
  ['frontend unit tests (Vitest)', 'npm test', FRONTEND],
  ['frontend lint (ESLint)', runFrontendLint, ROOT],
  ['frontend css (stylelint)', 'npm run stylelint', ROOT],
  ['frontend build (Angular AOT)', 'npm run build', FRONTEND],
  ['e2e smoke (Playwright)', 'npm run e2e', FRONTEND],
];

let failed: string | null = null;
for (const [name, cmd, cwd] of steps) {
  console.log(`\n=== ${name} ===`);
  try {
    if (typeof cmd === 'function') {
      const ok = await cmd();
      if (!ok) throw new Error(`${name} failed`);
    } else {
      execSync(cmd, { cwd, stdio: 'inherit' });
    }
  } catch {
    failed = name;
    break;
  }
}

if (failed) {
  console.error(`\nVERIFY FAILED at: ${failed}`);
  process.exit(1);
}
console.log('\nVERIFY OK - full build, all tests, and catalog freshness are green.');
