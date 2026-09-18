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
import type { EmittedFile, FieldSpec, SliceSpec } from './spec.ts';
import { deriveNames, loadSpec } from './spec.ts';
import { uniqueField } from './csharp.ts';
import { emitDotnet } from './emit-dotnet.ts';
import { emitDotnetTests } from './emit-dotnet-tests.ts';
import { emitFrontend } from './emit-frontend.ts';
import { emitFrontendTests } from './emit-frontend-tests.ts';
import { injectAppConfig, injectOperations, injectRegistry, injectRoutes } from './inject-ts.ts';
import { injectApplicationModule, injectDbContext, injectInfrastructureModule } from './inject-text.ts';
import { isTreeClean } from '../ui-style/ui-style.ts';
// The desktop shell's per-slice wiring is optional machinery a thin clone never has, so its
// import stays wrapped the same way inject-text.ts wraps its own entry-point injector — see
// inject-text.test.ts for the precedent this follows.
// thick:start
import { injectLibRs } from './inject-text.ts';
// thick:end

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// thick:start
const SRC_TAURI = join(ROOT, 'apps', 'desktop', 'src-tauri');
const RUST_LIB_PATH = 'apps/desktop/src-tauri/src/lib.rs';
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
// The desktop shell's per-slice store (thick only)
// ---------------------------------------------------------------------------
// No earlier task emits this file: Tasks 2-5 cover .NET and Angular, and Task 7's
// inject-text.ts only ever EDITS the desktop entry point, it does not create the store a
// generated slice needs. This is that missing write, built the same way every other
// emitter here is — shape substituted from the spec, no residual logic — and it mirrors
// the shape of the one hand-written store the exemplar already ships.
//
// KNOWN GAP, disclosed rather than silently shipped: the entry-point edit below wires
// `commands::{slice}_list` etc. into the handler list, matching how the exemplar's own
// adapters live in its shared command-adapter file rather than in its store file. No task
// provides an injector for that shared file, and this task's given interface does not
// include authoring one, so a generated slice's desktop build will not link until that
// file also gains the three matching command adapters by hand or by a follow-up injector.
// See task-8-report.md for the full trace.
// thick:start
const RUST_TYPE: Record<FieldSpec['type'], string> = { string: 'String', number: 'f64', boolean: 'bool' };

/** A Rust literal for a field's sample value, `variant` distinguishing two records. */
function rustSample(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return variant === 0 ? '1.0' : '2.0';
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? '"a@x.io".to_string()' : '"b@x.io".to_string()';
  return variant === 0 ? '"a".to_string()' : '"b".to_string()';
}

function emitRustStore(spec: SliceSpec): EmittedFile {
  const n = deriveNames(spec);
  const unique = uniqueField(spec);
  const first = spec.fields[0];

  const structFields = spec.fields.map((f) => `    pub ${f.name}: ${RUST_TYPE[f.type]},`).join('\n');
  const params = spec.fields.map((f) => `${f.name}: ${RUST_TYPE[f.type]}`).join(', ');
  const assign = spec.fields.map((f) => `                ${n.camel}.${f.name} = ${f.name};`).join('\n');
  const construct = spec.fields.map((f) => f.name).join(', ');
  const sampleArgs = (variant: 0 | 1) => spec.fields.map((f) => rustSample(f, variant)).join(', ');
  // Keeps the unique field's value at variant 0 while every other field varies, so a
  // conflict test proves the store rejects on the unique field specifically rather than
  // on an accidental exact duplicate.
  const sampleArgsKeepingUnique = (otherVariant: 0 | 1) =>
    spec.fields.map((f) => rustSample(f, f === unique ? 0 : otherVariant)).join(', ');

  const conflictCheck = unique
    ? `        if let Some(existing) = ${n.snakePlural}.values().find(|x| x.${unique.name} == ${unique.name}) {
            if Some(&existing.id) != id.as_ref() {
                return Err(StoreError::Conflict(format!("${unique.label} {${unique.name}} is already in use.")));
            }
        }

`
    : '';

  const conflictTests = unique
    ? `
    #[test]
    fn save_duplicate_${unique.name}_on_a_different_${n.camel}_is_conflict() {
        let store = ${n.pascal}Store::default();
        store.save(None, ${sampleArgs(0)}).unwrap();
        let result = store.save(None, ${sampleArgsKeepingUnique(1)});
        assert!(matches!(result, Err(StoreError::Conflict(_))));
    }

    #[test]
    fn save_update_keeps_the_same_${unique.name}_without_conflict() {
        let store = ${n.pascal}Store::default();
        let created = store.save(None, ${sampleArgs(0)}).unwrap();
        let updated = store
            .save(Some(created.id.clone()), ${sampleArgsKeepingUnique(1)})
            .unwrap();
        assert_eq!(updated.id, created.id);
    }
`
    : '';

  const text = `//! ${n.pascal} store for the desktop client. Holds the same ${n.camel} use-cases the
//! .NET API does, so the frontend behaves identically whether it talks to the native
//! store or to the API over HTTP. Command adapters are thin wrappers over this; the
//! logic is here and unit-tested in isolation.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

/// The ${n.camel} shape crossing the wire. Serializes to the same JSON as the .NET
/// ${n.pascal}Response, so the operation registry's res type fits both.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ${n.pascal} {
    pub id: String,
${structFields}
}

/// An expected failure. Maps to a rejected invoke on the wire.
#[derive(Debug, PartialEq)]
pub enum StoreError {
    NotFound(String),
    Conflict(String),
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StoreError::NotFound(m) | StoreError::Conflict(m) => write!(f, "{m}"),
        }
    }
}

/// In-memory ${n.camel} store. A template default: swap the Mutex<HashMap> for SQLite or
/// a file store without changing the commands or the frontend.
#[derive(Default)]
pub struct ${n.pascal}Store {
    ${n.snakePlural}: Mutex<HashMap<String, ${n.pascal}>>,
}

impl ${n.pascal}Store {
    pub fn list(&self) -> Vec<${n.pascal}> {
        let mut all: Vec<${n.pascal}> = self.${n.snakePlural}.lock().unwrap().values().cloned().collect();
        all.sort_by(|a, b| a.${first.name}.partial_cmp(&b.${first.name}).unwrap());
        all
    }

    pub fn get(&self, id: &str) -> Result<${n.pascal}, StoreError> {
        self.${n.snakePlural}
            .lock()
            .unwrap()
            .get(id)
            .cloned()
            .ok_or_else(|| StoreError::NotFound(format!("${n.pascal} {id} was not found.")))
    }

    pub fn save(&self, id: Option<String>, ${params}) -> Result<${n.pascal}, StoreError> {
        let mut ${n.snakePlural} = self.${n.snakePlural}.lock().unwrap();

${conflictCheck}        match id {
            Some(id) => {
                let ${n.camel} = ${n.snakePlural}
                    .get_mut(&id)
                    .ok_or_else(|| StoreError::NotFound(format!("${n.pascal} {id} was not found.")))?;
${assign}
                Ok(${n.camel}.clone())
            }
            None => {
                let ${n.camel} = ${n.pascal} { id: Uuid::new_v4().to_string(), ${construct} };
                ${n.snakePlural}.insert(${n.camel}.id.clone(), ${n.camel}.clone());
                Ok(${n.camel})
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_is_empty_on_a_fresh_store() {
        let store = ${n.pascal}Store::default();
        assert_eq!(store.list(), vec![]);
    }

    #[test]
    fn save_creates_a_${n.camel}_with_an_id() {
        let store = ${n.pascal}Store::default();
        let ${n.camel} = store.save(None, ${sampleArgs(0)}).unwrap();
        assert!(!${n.camel}.id.is_empty());
        assert_eq!(store.list().len(), 1);
    }

    #[test]
    fn get_unknown_id_is_not_found() {
        let store = ${n.pascal}Store::default();
        assert_eq!(
            store.get("missing"),
            Err(StoreError::NotFound("${n.pascal} missing was not found.".into()))
        );
    }

    #[test]
    fn save_then_get_roundtrips() {
        let store = ${n.pascal}Store::default();
        let created = store.save(None, ${sampleArgs(0)}).unwrap();
        assert_eq!(store.get(&created.id).unwrap(), created);
    }
${conflictTests}
    #[test]
    fn save_update_of_unknown_id_is_not_found() {
        let store = ${n.pascal}Store::default();
        let result = store.save(Some("ghost".to_string()), ${sampleArgs(1)});
        assert!(matches!(result, Err(StoreError::NotFound(_))));
    }
}
`;

  return { path: `apps/desktop/src-tauri/src/${n.snakePlural}.rs`, text };
}
// thick:end

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
