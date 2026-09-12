#!/usr/bin/env node
// Idempotent environment bootstrap for a fresh Jig clone. One command
// (`npm run setup`) from clone to a working, LSP-aware agent environment:
// it verifies every toolchain and language server the repo depends on, wires
// git to the committed hooks, installs commit tooling, and generates the catalog.
//
// Fails early and loudly if a required binary is missing — a half-working
// environment is worse than a clear "install this first".

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const log = (m) => console.log(m);
const ok = (m) => console.log(`  ok   ${m}`);
const bad = (m) => console.log(`  MISS ${m}`);

// Angular 22's packages require this Node range. A major-only check would pass
// unsupported versions (23.x, 24.0-24.14, 25.x) and then fail cryptically deep in
// the Angular build, so the Node slot validates the full major.minor.patch.
const NODE_REQUIREMENT = '^22.22.3 || ^24.15.0 || >=26.0.0';
function isSupportedNode(versionString) {
  const m = versionString.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return false;
  const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (maj === 22) return min > 22 || (min === 22 && pat >= 3);
  if (maj === 24) return min >= 15;
  return maj >= 26;
}

// Each check: a slot, one or more candidate commands (the first that responds
// wins, so any of several tools can satisfy a slot), and whether it is required.
const CHECKS = [
  { slot: 'git', required: true, candidates: [['git', ['--version']]] },
  { slot: 'node', required: true, candidates: [['node', ['--version']]], node: true },
  { slot: '.NET SDK', required: true, candidates: [['dotnet', ['--version']]] },
  // thick:start
  { slot: 'rustc', required: true, candidates: [['rustc', ['--version']]] },
  { slot: 'cargo', required: true, candidates: [['cargo', ['--version']]] },
  { slot: 'tauri-cli', required: true, candidates: [['cargo-tauri', ['--version']], ['cargo', ['tauri', '--version']]] },
  { slot: 'rust-analyzer (LSP)', required: true, candidates: [['rust-analyzer', ['--version']]] },
  // thick:end
  { slot: 'TypeScript LSP', required: true, candidates: [['typescript-language-server', ['--version']], ['vtsls', ['--version']]] },
  { slot: 'C# LSP', required: true, candidates: [['csharp-ls', ['--version']]] },
];

function tryVersion(cmd, args) {
  // On Windows many tools are .cmd/.bat shims that need a shell to resolve. Pass
  // one command string in that case (avoids DEP0190 from args + shell:true).
  const r = process.platform === 'win32'
    ? spawnSync([cmd, ...args].join(' '), { encoding: 'utf8', shell: true })
    : spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status === 0 && (r.stdout || r.stderr)) {
    return (r.stdout || r.stderr).trim().split('\n')[0];
  }
  return null;
}

function checkTools() {
  log('\nToolchain and language servers:');
  let missing = 0;
  for (const c of CHECKS) {
    let found = null;
    for (const [cmd, args] of c.candidates) {
      const v = tryVersion(cmd, args);
      if (v) { found = v; break; }
    }
    if (!found) {
      bad(`${c.slot} — not found (looked for: ${c.candidates.map((x) => x[0]).join(', ')})`);
      if (c.required) missing++;
      continue;
    }
    if (c.node && !isSupportedNode(found)) {
      bad(`${c.slot} — ${found} (need ${NODE_REQUIREMENT})`);
      missing++;
      continue;
    }
    ok(`${c.slot} — ${found}`);
  }
  return missing;
}

function wireGitHooks() {
  log('\nGit hooks:');
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: ROOT, stdio: 'ignore' });
    execSync('git config core.hooksPath .githooks', { cwd: ROOT, stdio: 'ignore' });
    ok('core.hooksPath → .githooks');
  } catch {
    bad('not a git repository — run `git init` first');
  }
}

function installDeps() {
  log('\nCommit tooling (commitlint):');
  if (existsSync(join(ROOT, 'node_modules', '@commitlint', 'cli'))) {
    ok('commitlint already installed');
    return;
  }
  log('  installing dev dependencies…');
  execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  ok('npm install complete');
}

function installFrontend() {
  log('\nFrontend dependencies:');
  execSync('npm install', { cwd: join(ROOT, 'frontend'), stdio: 'inherit' });
  ok('frontend npm install complete');
  log('  installing Playwright browser (chromium)...');
  execSync('npx playwright install chromium', { cwd: join(ROOT, 'frontend'), stdio: 'inherit' });
  ok('Playwright chromium installed');
}

function restoreBackend() {
  log('\nBackend restore (.NET):');
  execSync('dotnet restore services/api/Jig.sln', { cwd: ROOT, stdio: 'inherit' });
  ok('dotnet restore complete');
}

// thick:start
function fetchRust() {
  log('\nRust crates:');
  execSync('cargo fetch', { cwd: join(ROOT, 'apps', 'desktop', 'src-tauri'), stdio: 'inherit' });
  ok('cargo fetch complete');
}
// thick:end

function generateCatalog() {
  log('\nCapability catalog:');
  execSync('node tools/catalog/catalog.ts', { cwd: ROOT, stdio: 'inherit' });
}

function main() {
  log('Jig setup — building the fixture environment.');
  const missing = checkTools();
  if (missing > 0) {
    log(`\nSetup incomplete: ${missing} required tool(s) missing. Install them and re-run \`npm run setup\`.`);
    process.exit(1);
  }
  wireGitHooks();
  installDeps();
  installFrontend();
  restoreBackend();
  // thick:start
  fetchRust();
  // thick:end
  generateCatalog();
  log('\nSetup complete. Run `npm run verify` to confirm the fixture is green.');
  log('Next: read CLAUDE.md and .bob/registry/CATALOG.md.');
}

main();
