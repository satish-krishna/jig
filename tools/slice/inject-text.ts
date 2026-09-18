// C# and desktop-entry-point registry injectors for the vertical-slice generator. No
// parser is available for either target language here (unlike inject-ts.ts, which walks
// the TypeScript AST), so every injector below locates its insertion point with a single
// anchor string and splices plain text after it — the same anchored-insertion technique
// tools/init/thin.ts uses for the thin cut, including its loud-failure rule: a missing
// anchor throws naming the file and the anchor, and an ambiguous one throws too, so a
// splice never lands silently in the wrong place. Every anchor is a structural signature
// the target file cannot lose without ceasing to be that file (a method's opening brace,
// a class's constructor signature), never a line that only exists because the `users`
// sample slice was generated — a spec-generated app built with `--sample false` must still
// splice cleanly. Every function here is pure — a source string, a spec, and an optional
// product name in, a source string out, no disk access — and every function short-circuits
// to a no-op when its slice is already present.

import type { SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { pascalField, uniqueField } from './csharp.ts';
// thick:start
import { RUST_TYPE } from './emit-rust.ts';
// thick:end

/** Insert `text` immediately after the sole occurrence of `anchor`. Loud on miss or ambiguity. */
export function insertAfter(file: string, source: string, anchor: string, text: string): string {
  const first = source.indexOf(anchor);
  if (first === -1) throw new Error(`${file}: anchor not found: ${JSON.stringify(anchor.slice(0, 90))}`);
  if (source.indexOf(anchor, first + anchor.length) !== -1) {
    throw new Error(`${file}: anchor is ambiguous: ${JSON.stringify(anchor.slice(0, 90))}`);
  }
  const at = first + anchor.length;
  return source.slice(0, at) + text + source.slice(at);
}

// ---------------------------------------------------------------------------
// {P}.Application/ApplicationModule.cs
// ---------------------------------------------------------------------------

/**
 * Register a slice's application service in the DI composition root. Anchors on the
 * `AddApplication` method's own signature and opening brace — present in every clone
 * regardless of which sample slice was generated — rather than the `users` sample's
 * own registration line.
 *
 * @capability tools.slice.inject-application-module
 * @intent Wire a generated slice's service into the application composition root without
 * depending on the sample slice being present.
 * @reuse Call once per slice from the generator CLI; idempotent on the service registration.
 * `product` is accepted but unused, to keep the call shape uniform across all four injectors
 * (only injectDbContext's anchor needs it — the DI module files never name the product).
 */
export function injectApplicationModule(source: string, spec: SliceSpec, product?: string): string {
  const n = deriveNames(spec);
  const registration = `services.AddScoped<${n.pascal}Service>();`;
  if (source.includes(registration)) return source;
  const anchor = 'AddApplication(this IServiceCollection services)\n    {\n';
  return insertAfter('ApplicationModule.cs', source, anchor, `        ${registration}\n`);
}

// ---------------------------------------------------------------------------
// {P}.Infrastructure/InfrastructureModule.cs
// ---------------------------------------------------------------------------

/**
 * Register a slice's repository in the DI composition root. Anchors on the
 * `AddInfrastructure` method's own signature and opening brace, for the same
 * sample-independence reason as injectApplicationModule.
 *
 * @capability tools.slice.inject-infrastructure-module
 * @intent Wire a generated slice's repository into the infrastructure composition root
 * without depending on the sample slice being present.
 * @reuse Call once per slice from the generator CLI; idempotent on the repository registration.
 * `product` is accepted but unused, for the same call-shape-uniformity reason as
 * injectApplicationModule.
 */
export function injectInfrastructureModule(source: string, spec: SliceSpec, product?: string): string {
  const n = deriveNames(spec);
  const registration = `services.AddScoped<I${n.pascal}Repository, ${n.pascal}Repository>();`;
  if (source.includes(registration)) return source;
  const anchor = 'AddInfrastructure(this IServiceCollection services, string connectionString)\n    {\n';
  return insertAfter('InfrastructureModule.cs', source, anchor, `        ${registration}\n`);
}

// ---------------------------------------------------------------------------
// {P}.Infrastructure/{P}DbContext.cs
// ---------------------------------------------------------------------------

/**
 * The EF Core entity-configuration block for one slice's OnModelCreating body. Every
 * field gets a required property mapping; the spec's one unique field (validateSpec
 * guarantees at most one) additionally gets a unique index. `HasIndex` is emitted only
 * when a field is unique, per the same reasoning IUserRepository's lookup method gets
 * gated in emit-dotnet.ts.
 */
function entityConfigBlock(spec: SliceSpec, n: SliceNames): string {
  const outer = n.camel;
  const inner = outer.charAt(0);
  const propLines = spec.fields
    .map((f) => `            ${outer}.Property(${inner} => ${inner}.${pascalField(f.name)}).IsRequired();`)
    .join('\n');
  const unique = uniqueField(spec);
  const uniqueLine = unique
    ? `\n            ${outer}.HasIndex(${inner} => ${inner}.${pascalField(unique.name)}).IsUnique();`
    : '';
  return (
    `        modelBuilder.Entity<${n.pascal}>(${outer} =>\n` +
    `        {\n` +
    `            ${outer}.HasKey(${inner} => ${inner}.Id);\n` +
    `${propLines}${uniqueLine}\n` +
    `        });\n`
  );
}

/**
 * Add a slice's DbSet property and OnModelCreating entity configuration to the DbContext.
 * Anchors on the constructor signature (for the DbSet property) and the OnModelCreating
 * signature (for the entity block) — both structural to any EF Core DbContext, never on
 * the `users` sample's own DbSet or entity configuration.
 *
 * @capability tools.slice.inject-db-context
 * @intent Register a generated slice's table and EF Core mapping without depending on the
 * sample slice being present.
 * @reuse Call once per slice from the generator CLI; idempotent on the entity configuration.
 */
export function injectDbContext(source: string, spec: SliceSpec, product = 'Jig'): string {
  const n = deriveNames(spec);
  if (source.includes(`modelBuilder.Entity<${n.pascal}>(`)) return source;

  const file = `${product}DbContext.cs`;
  const ctorAnchor = `${product}DbContext(DbContextOptions<${product}DbContext> options) : base(options) { }\n`;
  const withDbSet = insertAfter(
    file,
    source,
    ctorAnchor,
    `\n    public DbSet<${n.pascal}> ${n.pascalPlural} => Set<${n.pascal}>();\n`,
  );

  const modelAnchor = 'protected override void OnModelCreating(ModelBuilder modelBuilder)\n    {\n';
  return insertAfter(file, withDbSet, modelAnchor, entityConfigBlock(spec, n));
}

// thick:start
// ---------------------------------------------------------------------------
// The desktop shell's entry point
// ---------------------------------------------------------------------------
// This section is specific to that shell and has no meaning once it is removed, so all of
// it — this heading included — sits inside the marker. Nothing outside the marker depends
// on a symbol the cut deletes, and nothing outside it describes one either.
/**
 * Add a slice's module declaration, its managed store, and its three command-handler
 * entries to the desktop entry point. Four anchors: `mod commands;`, the module declaration
 * this function has just inserted (unique by construction, since the guard above proved it
 * absent), the plugin registration line, and the `generate_handler!` list's opening bracket.
 * All but the second are present in every clone regardless of which sample slice was
 * generated, and none is the `users` sample's own module, managed store, or handler entry.
 *
 * @capability tools.slice.inject-lib-rs
 * @intent Wire a generated slice's store and commands into the desktop shell without
 * depending on the sample slice being present.
 * @reuse Call once per slice from the generator CLI; idempotent on the module declaration.
 * `product` is accepted but unused, for the same call-shape-uniformity reason as
 * injectApplicationModule — the entry point never names the product either.
 *
 * Any caller importing this function needs the same thick-marker treatment around that
 * import, or a thin clone's copy of the calling file would import a symbol this file no
 * longer exports.
 */
export function injectLibRs(source: string, spec: SliceSpec, product?: string): string {
  const n = deriveNames(spec);
  const moduleDecl = `mod ${n.snakePlural};`;
  if (source.includes(moduleDecl)) return source;

  const withModule = insertAfter('lib.rs', source, 'mod commands;\n', `${moduleDecl}\n`);

  // The store type has to be in scope for .manage() below to name it — mirrors the
  // exemplar's own `use users::UserStore;`. Anchored on the module declaration this
  // function just inserted, which is unique in the file by construction (the guard
  // above already proved it was absent before this call).
  const withUse = insertAfter('lib.rs', withModule, `${moduleDecl}\n`, `use ${n.snakePlural}::${n.pascal}Store;\n`);

  const withManage = insertAfter(
    'lib.rs',
    withUse,
    '.plugin(tauri_plugin_updater::Builder::new().build())\n',
    `        .manage(${n.pascal}Store::default())\n`,
  );

  const handlers =
    `            commands::${n.snakePlural}_list,\n` +
    `            commands::${n.snakePlural}_get,\n` +
    `            commands::${n.snakePlural}_save,\n`;
  return insertAfter('lib.rs', withManage, 'tauri::generate_handler![\n', handlers);
}

/**
 * Add a slice's `use` import and its three `#[tauri::command]` adapter functions to the
 * desktop shell's shared command-adapter file. Anchors on `use tauri::State;` (present in
 * every clone regardless of which sample slice was generated) for the import, and the
 * adapters are appended at the end of the file — commands.rs is nothing but a growing list
 * of adapters, so "the end of the file" is itself the structural anchor rather than any
 * one adapter's own content. Mirrors the exemplar's own users_list/users_get/users_save
 * shape exactly: deref the managed store, stringify errors into a rejected invoke.
 *
 * @capability tools.slice.inject-commands-rs
 * @intent Wire a generated slice's store into the desktop shell's command layer, matching
 * `injectLibRs`'s `commands::{slice}_*` handler entries with real adapter functions.
 * @reuse Call once per slice from the generator CLI, alongside injectLibRs; idempotent on
 * the list adapter's own signature.
 */
export function injectCommandsRs(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  const marker = `pub fn ${n.snakePlural}_list(`;
  if (source.includes(marker)) return source;

  const withUse = insertAfter(
    'commands.rs',
    source,
    'use tauri::State;\n',
    `use crate::${n.snakePlural}::{${n.pascal}, ${n.pascal}Store};\n`,
  );

  const params = spec.fields.map((f) => `    ${f.name}: ${RUST_TYPE[f.type]},`).join('\n');
  const saveArgs = spec.fields.map((f) => f.name).join(', ');

  const adapters = `
/// ${n.opPrefix}.list — returns every ${n.camel}.
#[tauri::command]
pub fn ${n.snakePlural}_list(store: State<'_, ${n.pascal}Store>) -> Vec<${n.pascal}> {
    store.list()
}

/// ${n.opPrefix}.get — one ${n.camel}, or a rejected invoke carrying the not-found message.
#[tauri::command]
pub fn ${n.snakePlural}_get(id: String, store: State<'_, ${n.pascal}Store>) -> Result<${n.pascal}, String> {
    store.get(&id).map_err(|e| e.to_string())
}

/// ${n.opPrefix}.save — create (null id) or update; conflict and not-found become a rejected invoke.
#[tauri::command]
pub fn ${n.snakePlural}_save(
    id: Option<String>,
${params}
    store: State<'_, ${n.pascal}Store>,
) -> Result<${n.pascal}, String> {
    store.save(id, ${saveArgs}).map_err(|e| e.to_string())
}
`;

  return withUse + adapters;
}
// thick:end
