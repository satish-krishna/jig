#!/usr/bin/env node
// The one-command gate: full build, all tests across all three languages, and
// catalog freshness. Green here is the definition of "the fixture holds". Runs
// each step in order and stops at the first failure, naming it.

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');
const FRONTEND = join(ROOT, 'frontend');

const steps = [
  ['catalog freshness', 'node tools/catalog/catalog.ts --check', ROOT],
  ['showcase api freshness', 'node tools/showcase-api/showcase-api.ts --check', ROOT],
  ['tooling tests', 'node --test "tools/**/*.test.ts" "tools/**/*.test.mjs"', ROOT],
  ['backend tests (.NET)', 'dotnet test services/api/Jig.sln --nologo -v q', ROOT],
  ['rust tests', 'cargo test', SRC_TAURI],
  ['frontend unit tests (Vitest)', 'npm test', FRONTEND],
  ['frontend build (Angular AOT)', 'npm run build', FRONTEND],
  ['e2e smoke (Playwright)', 'npm run e2e', FRONTEND],
];

let failed = null;
for (const [name, cmd, cwd] of steps) {
  console.log(`\n=== ${name} ===`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
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
