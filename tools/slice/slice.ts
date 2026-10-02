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
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EmittedFile, SliceSpec } from './spec.ts';
import { loadSpec } from './spec.ts';
import { emitDotnet } from './emit-dotnet.ts';
import { emitDotnetTests } from './emit-dotnet-tests.ts';
import { emitFrontend } from './emit-frontend.ts';
import { emitFrontendTests } from './emit-frontend-tests.ts';
import { injectAppConfig, injectOperations, injectRegistry, injectRoutes } from './inject-ts.ts';
import { injectApplicationModule, injectDbContext, injectInfrastructureModule } from './inject-text.ts';
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
 * resume after phase A already landed (e.g. once a failed build is fixed by hand),
 * `--dry-run` prints the plan and touches nothing, and `--force` waives both refusals
 * below - the uncommitted-registry one and the would-overwrite one.
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
// A thin clone has no desktop shell, so none of the machinery this section composes exists
// there: the store emitter and both entry-point injectors are marker-wrapped in their own
// modules and are stripped by the same cut that strips the composition below. This file
// only composes them.

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

/**
 * Which of `planned` git reports as changed. Pure, so slice.test.ts can drive it with
 * porcelain text instead of a repository.
 *
 * The check this feeds is scoped to the registries THIS invocation will edit, rather than
 * to the whole tree. A whole-tree refusal blocked three things the tool itself tells you to
 * do: `--dry-run` (which writes nothing), `--phase b` (a resume, run at the exact moment
 * phase A has just dirtied the tree), and add-a-feature's own step 1, which has you author
 * a spec file. What the refusal is actually for is the registries — those are edits to
 * tracked files, and an uncommitted change in one is the case where git cannot give it
 * back. A file this run only WRITES is covered by the collision check below instead.
 *
 * Porcelain lines are `XY path`, or `XY old -> new` for a rename. A path containing a space
 * or a quote arrives quoted and simply will not match a planned path, which errs toward
 * letting the run proceed — no registry in this repository has such a name, and an injector
 * handed a missing file throws by itself.
 */
export function dirtyAmong(porcelain: string, planned: readonly string[]): string[] {
  const want = new Set(planned);
  const hits = new Set<string>();
  for (const line of porcelain.split('\n')) {
    if (line.trim() === '') continue;
    for (const side of line.slice(3).split(' -> ')) {
      if (want.has(side)) hits.add(side);
    }
  }
  return [...hits].sort();
}

/**
 * Which planned writes would land on a path that already holds a file. The CLI's own
 * closing instruction is "fill in the domain behavior the generator could not know", so a
 * second run against the same spec would silently overwrite exactly that work. Pure in the
 * same way dirtyAmong is: the caller supplies the existence test.
 */
export function collidingPaths(writes: readonly EmittedFile[], exists: (path: string) => boolean): string[] {
  return writes.filter((w) => exists(w.path)).map((w) => w.path);
}

/**
 * Run every planned edit against its current source, in memory. main() calls this before it
 * writes anything, so an injector that cannot find its anchor throws while the tree is still
 * untouched — applied one at a time instead, a throw in the fourth registry leaves the first
 * three edited and a plain re-run refuses on the files already written.
 */
export function renderEdits(edits: readonly PlannedEdit[], read: (path: string) => string): EmittedFile[] {
  return edits.map((edit) => {
    try {
      return { path: edit.path, text: edit.apply(read(edit.path)) };
    } catch (error) {
      throw new Error(`${edit.path}: ${(error as Error).message}`);
    }
  });
}

/**
 * Whether a phase regenerates the frontend's DTOs before it writes the frontend half. Phase B
 * does even when run alone: it is the resume the CLI advises after a failed build, and without
 * codegen it would compile against the DTOs the API emitted before this slice existed.
 */
export function runsCodegen(phase: ParsedArgs['phase']): boolean {
  return phase !== 'a';
}

/**
 * Which entries of the API project directory are the dev SQLite database and its sidecars.
 * The API creates its schema with EnsureCreated, which does nothing when the file already
 * exists, so a database left by an earlier `npm run dev` never gains the new slice's table.
 * It is git-ignored dev data, so the generator deletes it and the next run recreates it.
 * Only `database`, the file the connection string names, is matched; any other database
 * there is left alone.
 */
export function staleDatabaseFiles(entries: readonly string[], database: string): string[] {
  return entries.filter((name) => [database, `${database}-shm`, `${database}-wal`].includes(name));
}

/**
 * The SQLite file the API's fallback connection string names, read from Program.cs source.
 * Read rather than derived from the product name: init names the file from the raw name
 * typed at init, which the Pascal product name cannot always reproduce.
 */
export function databaseFileName(programCs: string): string | undefined {
  return /Data Source=([^";]+)/.exec(programCs)?.[1];
}

/**
 * Where a Data Source points: the folder to look in (a relative path is resolved against the API
 * project the dev run starts from; an absolute one stands on its own) and the file name to match.
 */
export function databaseLocation(apiDir: string, dataSource: string): { dir: string; file: string } {
  return { dir: resolve(apiDir, dirname(dataSource)), file: basename(dataSource) };
}

function removeStaleDatabase(product: string): void {
  const apiDir = join(ROOT, 'services', 'api', 'src', `${product}.Api`);
  const dataSource = databaseFileName(readFileSync(join(apiDir, 'Program.cs'), 'utf8'));
  if (!dataSource) {
    console.warn(
      `Found no "Data Source=" in ${join(apiDir, 'Program.cs')}, so no dev database was deleted. If one ` +
        `exists, delete it by hand, or the new endpoints will fail with "no such table".`,
    );
    return;
  }
  const { dir, file } = databaseLocation(apiDir, dataSource);
  if (!existsSync(dir)) return;
  for (const name of staleDatabaseFiles(readdirSync(dir), file)) {
    try {
      rmSync(join(dir, name));
      console.log(`Deleted the dev database ${name}; the next run recreates it with the new table.`);
    } catch {
      console.warn(
        `Could not delete ${join(dir, name)} (is \`npm run dev\` running?). Stop it and delete ` +
          `the file by hand, or the new endpoints will fail with "no such table".`,
      );
    }
  }
}

const isDotnetWrite = (path: string) => path.startsWith('services/api/');

/**
 * Run once phase B has landed, before the CLI hands back.
 *
 * Every layer of a generated slice is annotated, and `.bob/registry/` is generated from
 * those annotations — so the instant phase B writes those files the committed catalog is
 * stale. Catalog freshness is the FIRST step of `npm run verify`, which is the very command
 * this CLI prints as the next thing to do, so leaving it stale means a generated slice
 * greets its author with a failing gate that has nothing to do with the slice. Regenerating
 * here is what makes "a generated slice arrives green" true (ADR 0015).
 *
 * Exported so slice.test.ts can assert it without running main(), which writes to the tree.
 */
export const CATALOG_REFRESH_COMMAND = 'npm run catalog';

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

  const plannedWrites = args.phase === 'a' ? phaseAWrites : args.phase === 'b' ? phaseBWrites : writes;
  const plannedEdits = args.phase === 'a' ? phaseAEdits : args.phase === 'b' ? phaseBEdits : edits;
  const alreadyThere = collidingPaths(plannedWrites, (p) => existsSync(join(ROOT, p)));
  // Read-only, so it runs before --dry-run too: a missing anchor surfaces before anything lands.
  const rendered = renderEdits(plannedEdits, (p) => readFileSync(join(ROOT, p), 'utf8'));
  const phaseARendered = rendered.filter((e) => dotnetEditPaths.has(e.path));
  const phaseBRendered = rendered.filter((e) => !dotnetEditPaths.has(e.path));

  if (args.dryRun) {
    console.log(`Would write ${plannedWrites.length} file(s):`);
    for (const w of plannedWrites) console.log(`  ${w.path}`);
    console.log(`Would edit ${plannedEdits.length} file(s):`);
    for (const e of plannedEdits) console.log(`  ${e.path}`);
    if (alreadyThere.length > 0) {
      console.log(`\n${alreadyThere.length} of those already exist; a real run would refuse without --force.`);
    }
    return;
  }

  if (!args.force) {
    const porcelain = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
    const dirty = dirtyAmong(porcelain, plannedEdits.map((e) => e.path));
    if (dirty.length > 0) {
      throw new Error(
        `These registries have uncommitted changes and this run edits them, so git could not ` +
          `give them back:\n  ${dirty.join('\n  ')}\nCommit or stash them first, or pass --force.`,
      );
    }
    if (alreadyThere.length > 0) {
      throw new Error(
        `These files already exist and this run would overwrite them, including any domain ` +
          `behavior added to them since:\n  ${alreadyThere.join('\n  ')}\n` +
          `Delete them or pass --force to regenerate over the top.`,
      );
    }
  }

  // Every phase, not only a successful phase A: `--phase b` is the resume the CLI advises
  // after a failed build, and a dev database created in between would miss the new table.
  removeStaleDatabase(product);

  if (args.phase === 'a' || args.phase === 'both') {
    console.log(`Phase A: writing ${phaseAWrites.length} .NET file(s)...`);
    for (const w of phaseAWrites) writeGenerated(w);
    for (const e of phaseARendered) writeGenerated(e);

    console.log('Phase A: building the solution...');
    try {
      execSync(`dotnet build "services/api/${product}.sln" --nologo -v q`, { cwd: ROOT, stdio: 'inherit' });
    } catch {
      console.error(
        `\nPhase A build failed. Fix services/api/${product}.sln, then re-run with --phase b once it builds ` +
          `(phase b runs codegen first).`,
      );
      process.exit(1);
    }

    if (args.phase === 'a') {
      console.log('\nPhase A done. Re-run with --phase b (it runs codegen first).');
      return;
    }
  }

  if (runsCodegen(args.phase)) {
    console.log('Running codegen...');
    try {
      execSync('npm run codegen', { cwd: ROOT, stdio: 'inherit' });
    } catch {
      console.error('\nCodegen failed. The .NET half has landed; fix the error above, then re-run with --phase b.');
      process.exit(1);
    }
  }

  console.log(`Phase B: writing ${phaseBWrites.length} file(s)...`);
  for (const w of phaseBWrites) writeGenerated(w);
  for (const e of phaseBRendered) writeGenerated(e);

  console.log(`Refreshing the capability catalog (${CATALOG_REFRESH_COMMAND})...`);
  execSync(CATALOG_REFRESH_COMMAND, { cwd: ROOT, stdio: 'inherit' });

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
