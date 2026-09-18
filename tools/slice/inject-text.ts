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
 */
export function injectApplicationModule(source: string, spec: SliceSpec): string {
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
 */
export function injectInfrastructureModule(source: string, spec: SliceSpec): string {
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

// ---------------------------------------------------------------------------
// The desktop shell's entry point (lib.rs)
// ---------------------------------------------------------------------------
// This whole section is specific to that shell and has no meaning once it is removed, so
// the block below is marked for removal on the thin cut: stripped along with it, so the
// repo-wide vocabulary scan that guards that cut never sees this file's anchor strings
// survive into a clone with nothing left to receive them. Task 8's generator entry point
// will import injectLibRs and needs the same treatment there, or a thin clone's copy of
// that file would import a symbol this file no longer exports.

// thick:start
/**
 * Add a slice's module declaration and its three command-handler entries to the desktop
 * entry point. Anchors on `mod commands;` (present in every clone regardless of which
 * sample slice was generated) and the `generate_handler!` list's opening bracket, never
 * on the `users` sample's own module or handler entries.
 *
 * @capability tools.slice.inject-lib-rs
 * @intent Wire a generated slice's commands into the desktop shell without depending on
 * the sample slice being present.
 * @reuse Call once per slice from the generator CLI; idempotent on the module declaration.
 */
export function injectLibRs(source: string, spec: SliceSpec): string {
  const n = deriveNames(spec);
  const moduleDecl = `mod ${n.snakePlural};`;
  if (source.includes(moduleDecl)) return source;

  const withModule = insertAfter('lib.rs', source, 'mod commands;\n', `${moduleDecl}\n`);

  const handlers =
    `            commands::${n.snakePlural}_list,\n` +
    `            commands::${n.snakePlural}_get,\n` +
    `            commands::${n.snakePlural}_save,\n`;
  return insertAfter('lib.rs', withModule, 'tauri::generate_handler![\n', handlers);
}
// thick:end
