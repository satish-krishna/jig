#!/usr/bin/env node
// The one-command gate: full build, all tests across all three languages, and
// catalog freshness. Green here is the definition of "the fixture holds". Runs
// each step in order and stops at the first failure, naming it.

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logFiring } from '../hooks/_hook-log.ts';
import { lintFrontend } from '../lint/lint-frontend.ts';
import { VERIFY_HOOK } from '../lint/analyze-firings.ts';
import { activeAreas, selectSteps, type Area } from './select.ts';
import { changedSince } from './areas.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');
const FRONTEND = join(ROOT, 'frontend');

/**
 * Runs the same `lintFrontend()` that backs `npm run lint` — one definition of "lint
 * the frontend", never two that can quietly drift apart — and logs its own tally.
 *
 * Task 15's whole measurement rests on the distinction between the two places this
 * ruleset runs: `tools/hooks/check-frontend.ts` fires per file, in flight, right after
 * an edit. This step fires once per verify run, at the gate — drift it finds here is
 * drift that reached a commit without the per-file hook catching it first. Logging
 * happens BEFORE the pass/fail decision below, so a run that finds violations still
 * records what they were instead of only recording clean runs. `file: 'frontend'`
 * because this is a whole-tree run, not a single file — analyze-firings.ts excludes
 * the `verify` hook from its per-file episode grouping for exactly this reason.
 */
async function runFrontendLint(): Promise<boolean> {
  const result = await lintFrontend();
  if (result.output) console.log(result.output);
  logFiring(VERIFY_HOOK, 'frontend', result.messageCount, result.ruleIds);
  return result.ok;
}

/**
 * Every step, in order, tagged with whether it is native — .NET or Rust.
 *
 * `--frontend` drops the native ones, which is the whole difference between the
 * two gates. It exists because a branch that touches only `frontend/` and
 * `tools/` still paid for `dotnet test` and `cargo test` on every run, and a
 * two-minute inner loop gets run less often than a twenty-second one.
 *
 * It is a LOOP gate, never a substitute. The frontend consumes DTOs generated
 * from the API, so a contract change breaks the TypeScript side without any
 * frontend file being touched — only the full run proves the fixture holds.
 * Commits and CI use the full gate; this is the same split CLAUDE.md already
 * draws between `npm run dev` and `npm run verify`.
 */
interface Step {
  name: string;
  cmd: string | (() => Promise<boolean>);
  cwd: string;
  /** The subsystems that can break this step. See tools/verify/select.ts. */
  areas: readonly Area[];
  /** Needs the .NET or Rust toolchain, so `--frontend` drops it. */
  native?: true;
}

const steps: Step[] = [
  { name: 'catalog freshness', cmd: 'node tools/catalog/catalog.ts --check', cwd: ROOT, areas: ['dotnet', 'rust', 'frontend', 'tools'] },
  { name: 'showcase api freshness', cmd: 'node tools/showcase-api/showcase-api.ts --check', cwd: ROOT, areas: ['frontend', 'tools'] },
  { name: 'tools typecheck', cmd: 'npm run typecheck', cwd: ROOT, areas: ['tools'] },
  { name: 'tooling tests', cmd: 'node --test "tools/**/*.test.ts"', cwd: ROOT, areas: ['tools'] },
  { name: 'backend tests (.NET)', cmd: 'dotnet test services/api/Jig.sln --nologo -v q', cwd: ROOT, areas: ['dotnet'], native: true },
  { name: 'contract freshness (codegen)', cmd: 'node tools/codegen/generate.ts --check', cwd: ROOT, areas: ['dotnet', 'contracts'], native: true },
  { name: 'rust tests', cmd: 'cargo test', cwd: SRC_TAURI, areas: ['rust'], native: true },
  { name: 'frontend unit tests (Vitest)', cmd: 'npm test', cwd: FRONTEND, areas: ['frontend', 'contracts'] },
  { name: 'frontend lint (ESLint)', cmd: runFrontendLint, cwd: ROOT, areas: ['frontend', 'tools'] },
  { name: 'frontend css (stylelint)', cmd: 'npm run stylelint', cwd: ROOT, areas: ['frontend', 'tools'] },
  { name: 'frontend build (Angular AOT)', cmd: 'npm run build', cwd: FRONTEND, areas: ['frontend', 'contracts'] },
  { name: 'e2e smoke (Playwright)', cmd: 'npm run e2e', cwd: FRONTEND, areas: ['frontend'] },
];

// `--since=<ref>` narrows the run to the steps the diff against `<ref>` can actually break.
// CI passes it; a local `npm run verify` does not, and with no flag every step still runs.
//
// This is the one place the gate is allowed to do less, so it says out loud what it chose.
// A gate that silently skips is a gate nobody trusts, and an untrusted gate gets routed
// around — the same reasoning ADR 0009 applies to suppression dials.
const frontendOnly = process.argv.includes('--frontend');
const since = (process.argv.find((a) => a.startsWith('--since=')) ?? '').split('=')[1];

let selected = steps;

if (since) {
  const paths = changedSince(since);
  const active = activeAreas(paths);
  selected = selectSteps(selected, active);
  console.log(`Changed since ${since}: ${paths.length} file(s).`);
  console.log(`Active areas: ${active.size ? [...active].join(', ') : 'none — prose only'}`);
  const skipped = steps.filter((s) => !selected.includes(s)).map((s) => s.name);
  if (skipped.length) console.log(`Skipping: ${skipped.join(', ')}`);
}

if (frontendOnly) {
  selected = selected.filter((s) => !s.native);
  console.log('Frontend gate: skipping .NET and Rust. Run `npm run verify` before committing.');
}

let failed: string | null = null;
for (const { name, cmd, cwd } of selected) {
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
// The two gates must never print the same sentence. A frontend run that claimed
// a "full build" would be a gate lying about what it checked, which is the exact
// thing this repo's enforcement work exists to stop.
console.log(
  frontendOnly
    ? '\nVERIFY OK (frontend) - .NET and Rust were NOT run. Run `npm run verify` before committing.'
    : '\nVERIFY OK - full build, all tests, and catalog freshness are green.',
);
