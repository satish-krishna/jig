#!/usr/bin/env node
// The slice generator's entry point: loads a SliceSpec, plans the write-and-edit list every
// earlier task's emitters and injectors produce, then drives the two phases the codegen
// ordering forces. Phase A lands the .NET files and their three registration sites, builds
// the solution, and runs codegen so the frontend's generated DTOs exist. Phase B lands the
// contracts, feature, and menu files against those DTOs, and injects the remaining sites.
// Emitting both halves before codegen produces TypeScript that references DTOs the API has
// not yet emitted — it fails the build, but only after every file has landed, which is the
// whole reason this is two passes rather than one.
//
// plan() is pure: a spec, a product name, and whether this checkout has a desktop shell in,
// a write-and-edit list out, no disk access. main() is the only impure function — it is the
// CLI, so it reads argv, the spec file, and git status, runs dotnet and npm as subprocesses,
// and writes to the working tree.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EmittedFile, SliceSpec } from './spec.ts';
import { loadSpec } from './spec.ts';
import { emitDotnet } from './emit-dotnet.ts';
import { emitDotnetTests } from './emit-dotnet-tests.ts';
import { emitFrontend } from './emit-frontend.ts';
import { emitFrontendTests } from './emit-frontend-tests.ts';
import { injectAppConfig, injectOperations, injectRegistry, injectRoutes } from './inject-ts.ts';
import { injectApplicationModule, injectDbContext, injectInfrastructureModule } from './inject-text.ts';
import { isTreeClean } from '../ui-style/ui-style.ts';
// The desktop shell's per-slice wiring is optional machinery a thin clone never has, so its
// imports stay wrapped the same way inject-text.ts wraps its own entry-point injectors — see
// inject-text.test.ts for the precedent this follows.
// thick:start
import { emitRustStore } from './emit-rust.ts';
import { injectCommandsRs, injectLibRs } from './inject-text.ts';
// thick:end

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// thick:start
const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');
const RUST_LIB_PATH = 'apps/desktop/src-tauri/src/lib.rs';
const RUST_COMMANDS_PATH = 'apps/desktop/src-tauri/src/commands.rs';
// thick:end

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

export interface ParsedArgs {
  specPath: string;
  phase: 'a' | 'b' | 'both';
  dryRun: boolean;
  force: boolean;
}

/**
 * Parse the CLI's own arguments. `--spec` is the only required flag; `--phase` lets a run
 * resume after phase A already landed (e.g. once a failed build is fixed by hand), and
 * `--force` bypasses the dirty-tree refusal the way `tools/ui-style/ui-style.ts` does for
 * its own destructive run.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  let specPath: string | undefined;
  let phase: 'a' | 'b' | 'both' = 'both';
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--spec') {
      specPath = argv[++i];
    } else if (arg === '--phase') {
      const value = argv[++i];
      if (value !== 'a' && value !== 'b' && value !== 'both') {
        throw new Error(`--phase must be 'a', 'b', or 'both' (got ${JSON.stringify(value)})`);
      }
      phase = value;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force') {
      force = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!specPath) {
    throw new Error('--spec is required');
  }

  return { specPath, phase, dryRun, force };
}

// ---------------------------------------------------------------------------
// Product detection
// ---------------------------------------------------------------------------

/**
 * Read the product name from the `*.Domain` project directory under services/api/src,
 * rather than hard-coding "Jig", so the generator works in a renamed clone — the only
 * place it will ever really run. Throws, rather than guessing, when the directory holds
 * none or several: an ambiguous product name would silently mis-namespace every emitted
 * .NET file, the same reasoning every anchored injector in this generator already applies
 * to a missing or ambiguous splice point.
 */
export function detectProduct(root: string): string {
  const srcDir = join(root, 'services', 'api', 'src');
  const domains = readdirSync(srcDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith('.Domain'))
    .map((e) => e.name);

  if (domains.length === 0) {
    throw new Error(`No *.Domain project found under ${srcDir}`);
  }
  if (domains.length > 1) {
    throw new Error(`Multiple *.Domain projects found under ${srcDir}: ${domains.join(', ')}`);
  }
  return domains[0].slice(0, -'.Domain'.length);
}

// ---------------------------------------------------------------------------
// The desktop shell (thick only)
// ---------------------------------------------------------------------------
// A thin clone has no desktop shell, so nothing below this point exists there: the store
// emitter lives in its own paired module and test file (mirroring emit-dotnet.ts's shape),
// and the entry-point and command-adapter injectors live in inject-text.ts alongside
// injectApplicationModule and friends. This file only composes them.

// ---------------------------------------------------------------------------
// plan(): pure. Composes every earlier task's emitters and injectors into one
// write-and-edit list.
// ---------------------------------------------------------------------------

export interface PlannedEdit {
  path: string;
  apply: (source: string) => string;
}

export interface SlicePlan {
  writes: EmittedFile[];
  edits: PlannedEdit[];
}

export function plan(spec: SliceSpec, product: string, thick: boolean): SlicePlan {
  const writes: EmittedFile[] = [
    ...emitDotnet(spec, product),
    ...emitDotnetTests(spec, product),
    ...emitFrontend(spec),
    ...emitFrontendTests(spec),
  ];

  const edits: PlannedEdit[] = [
    {
      path: `services/api/src/${product}.Application/ApplicationModule.cs`,
      apply: (source) => injectApplicationModule(source, spec),
    },
    {
      path: `services/api/src/${product}.Infrastructure/InfrastructureModule.cs`,
      apply: (source) => injectInfrastructureModule(source, spec),
    },
    {
      path: `services/api/src/${product}.Infrastructure/${product}DbContext.cs`,
      apply: (source) => injectDbContext(source, spec, product),
    },
    { path: 'frontend/src/app/contracts/operations.ts', apply: (source) => injectOperations(source, spec) },
    { path: 'frontend/src/app/contracts/registry.ts', apply: (source) => injectRegistry(source, spec) },
    { path: 'frontend/src/app/app.routes.ts', apply: (source) => injectRoutes(source, spec) },
    { path: 'frontend/src/app/app.config.ts', apply: (source) => injectAppConfig(source, spec) },
  ];
  // thick:start
  if (thick) {
    writes.push(emitRustStore(spec));
    edits.push({ path: RUST_LIB_PATH, apply: (source) => injectLibRs(source, spec) });
    edits.push({ path: RUST_COMMANDS_PATH, apply: (source) => injectCommandsRs(source, spec) });
  }
  // thick:end

  return { writes, edits };
}

// ---------------------------------------------------------------------------
// main(): impure. Disk, git, dotnet, npm.
// ---------------------------------------------------------------------------

function writeGenerated(file: EmittedFile): void {
  const full = join(ROOT, file.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, file.text);
}

function applyEdit(edit: PlannedEdit): void {
  const full = join(ROOT, edit.path);
  const source = readFileSync(full, 'utf8');
  writeFileSync(full, edit.apply(source));
}

const isDotnetWrite = (path: string) => path.startsWith('services/api/');

export function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const spec = loadSpec(args.specPath);
  const product = detectProduct(ROOT);

  let thick = false;
  // thick:start
  thick = existsSync(SRC_TAURI);
  // thick:end

  const { writes, edits } = plan(spec, product, thick);

  const dotnetEditPaths = new Set([
    `services/api/src/${product}.Application/ApplicationModule.cs`,
    `services/api/src/${product}.Infrastructure/InfrastructureModule.cs`,
    `services/api/src/${product}.Infrastructure/${product}DbContext.cs`,
  ]);
  const phaseAWrites = writes.filter((w) => isDotnetWrite(w.path));
  const phaseBWrites = writes.filter((w) => !isDotnetWrite(w.path));
  const phaseAEdits = edits.filter((e) => dotnetEditPaths.has(e.path));
  const phaseBEdits = edits.filter((e) => !dotnetEditPaths.has(e.path));

  if (!args.force && !isTreeClean(ROOT)) {
    throw new Error(
      'Working tree is dirty. The generator writes many files and edits several registries, ' +
        'and git is the only way back. Commit or stash first, or pass --force.',
    );
  }

  if (args.dryRun) {
    const plannedWrites = args.phase === 'a' ? phaseAWrites : args.phase === 'b' ? phaseBWrites : writes;
    const plannedEdits = args.phase === 'a' ? phaseAEdits : args.phase === 'b' ? phaseBEdits : edits;
    console.log(`Would write ${plannedWrites.length} file(s):`);
    for (const w of plannedWrites) console.log(`  ${w.path}`);
    console.log(`Would edit ${plannedEdits.length} file(s):`);
    for (const e of plannedEdits) console.log(`  ${e.path}`);
    return;
  }

  if (args.phase === 'a' || args.phase === 'both') {
    console.log(`Phase A: writing ${phaseAWrites.length} .NET file(s)...`);
    for (const w of phaseAWrites) writeGenerated(w);
    for (const e of phaseAEdits) applyEdit(e);

    console.log('Phase A: building the solution...');
    try {
      execSync(`dotnet build "services/api/${product}.sln" --nologo -v q`, { cwd: ROOT, stdio: 'inherit' });
    } catch {
      console.error(
        `\nPhase A build failed. Fix services/api/${product}.sln, then re-run with --phase b once it builds.`,
      );
      process.exit(1);
    }

    if (args.phase === 'a') {
      console.log('\nPhase A done. Run `npm run codegen`, then re-run with --phase b.');
      return;
    }
  }

  if (args.phase === 'both') {
    console.log('Running codegen...');
    execSync('npm run codegen', { cwd: ROOT, stdio: 'inherit' });
  }

  console.log(`Phase B: writing ${phaseBWrites.length} file(s)...`);
  for (const w of phaseBWrites) writeGenerated(w);
  for (const e of phaseBEdits) applyEdit(e);

  console.log('\nNext steps:');
  console.log('  1. npm run verify');
  console.log('  2. Fill in the domain behavior the generator could not know.');
}

// endsWith, not includes: `includes('slice')` also matches slice.test.ts and
// acceptance.test.ts, which would run the whole destructive main() during the test suite.
if (process.argv[1]?.endsWith('slice.ts')) {
  try {
    main();
  } catch (error) {
    console.error(`\n${(error as Error).message}`);
    process.exit(1);
  }
}
