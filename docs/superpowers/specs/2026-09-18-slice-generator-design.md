# Slice generator design

Status: accepted
Date: 2026-09-18

## Why

A jig feature is a vertical: endpoint → OpenAPI → generated DTO → operation key → HTTP route and IPC command → repository → ViewModel → view. Today an agent builds one by reading the `users` exemplar and emitting roughly twenty-seven files. That works — Tour of Heroes proved it — but it costs about 25k output tokens per slice, and in a cloned application several slices land in a day.

The generator is a token-economics play. It is not a correctness play: the lint ruleset, the Roslyn layer rules, and `npm run verify` already prevent drift, and they did so for a slice an agent wrote by hand. The claim under test is narrower — that emitting the invariant part mechanically is cheaper than emitting it through a model, with no loss of quality.

## What does not change: the shape

Every file in the `users` slice was read and classified line by line. The result is stronger than expected: for a CRUD slice there is no "logic" left over after the shape is removed. The whole slice is a function of one small input.

### The input

```ts
interface SliceSpec {
  /** Singular PascalCase entity name. e.g. "Order" */
  name: string;
  /** Plural form, if the naive rule is wrong. e.g. "Heroes" for "Hero". */
  plural?: string;
  /** Sidebar icon, a lucide export name. e.g. "lucideShoppingCart" */
  icon: string;
  fields: readonly FieldSpec[];
}

interface FieldSpec {
  /** camelCase property name. e.g. "reference" */
  name: string;
  /** The wire type. */
  type: 'string' | 'number' | 'boolean';
  /** Form label. e.g. "Reference" */
  label: string;
  /** Rejects duplicates with a Conflict; at most one field may be the unique key. */
  unique?: boolean;
  /** Renders as an email control and validates as one. */
  format?: 'email';
  /** Form placeholder. */
  placeholder?: string;
}
```

`users` expressed in it:

```ts
{ name: 'User', icon: 'lucideUsers', fields: [
  { name: 'name',  type: 'string', label: 'Name',  placeholder: 'Ada Lovelace' },
  { name: 'email', type: 'string', label: 'Email', placeholder: 'ada@example.io', unique: true, format: 'email' },
]}
```

Twelve lines producing twenty-seven files. That ratio is the whole argument.

### Classification

Every file is shape. The column records what the spec varies inside it.

| File | Varies by |
|---|---|
| `Jig.Domain/{E}.cs` | fields |
| `Jig.Application/I{E}Repository.cs` | unique field (adds `GetBy{Unique}Async`) |
| `Jig.Application/{E}Service.cs` | unique field, fields copied on update |
| `Jig.Api/{E}Contracts.cs` | fields |
| `Jig.Api/List{Es}Endpoint.cs` | names, route |
| `Jig.Api/Get{E}Endpoint.cs` | names, route |
| `Jig.Api/Save{E}Endpoint.cs` | names, route, fields passed to `SaveAsync` |
| `Jig.Api/Save{E}Validator.cs` | fields (`NotEmpty`, `EmailAddress`) |
| `Jig.Api/{E}Mapping.cs` | fields |
| `Jig.Infrastructure/{E}Repository.cs` | unique field, sort field (first field) |
| `operations/{e}.operations.ts` | names |
| `features/{es}/{e}-list.view-model.ts` | names only |
| `features/{es}/{e}-list.view.ts` | names, list row renders each field |
| `features/{es}/{e}-form.schema.ts` | fields |
| `features/{es}/{e}-form.view-model.ts` | fields (`markAsTouched` per field, empty model) |
| `features/{es}/{e}-form.ts` | fields (one `hlm-field` block each) |
| `features/{es}/{es}.commands.ts` | names, icon |
| the eight test files | fields (sample values) |

The `users` files carry prose that is exemplar documentation rather than slice shape — "This is the reference ViewModel: copy its shape", the note in `user-form.ts` explaining why `hlm-field-error` is not guarded on `touched()`. Generated slices do not inherit that; it belongs to the exemplar's teaching job, not to the shape.

### The registries: what must be edited, not created

Ten injection sites. This is the part `dotnet new` cannot do (create-only, [dotnet/templating#2148](https://github.com/dotnet/templating/issues/2148) closed as not planned) and the reason the generator is a script rather than a template engine.

| Site | Insert |
|---|---|
| `Jig.Application/ApplicationModule.cs` | `services.AddScoped<{E}Service>();` |
| `Jig.Infrastructure/InfrastructureModule.cs` | `services.AddScoped<I{E}Repository, {E}Repository>();` |
| `Jig.Infrastructure/JigDbContext.cs` | `DbSet<{E}>` property and the `OnModelCreating` entity block |
| `contracts/operations.ts` | two DTO aliases, three `Operations` keys |
| `contracts/registry.ts` | three `ROUTES` entries, three `COMMANDS` entries |
| `app.routes.ts` | one route, one import |
| `app.config.ts` | `provide{Es}Menu()`, its import, the icon in `provideIcons` |
| `src-tauri/src/lib.rs` (thick) | `mod {es};`, a `use {es}::{E}Store;`, and three `invoke_handler!` entries |
| `src-tauri/src/lib.rs` (thick) | `.manage({E}Store::default())` registration |
| `src-tauri/src/commands.rs` (thick) | a `use` import and three `#[tauri::command]` adapter functions |

## How big is a slice

The registries answer this, not taste. `contracts/registry.ts` declares `ROUTES` and `COMMANDS` as `{ [K in OperationName]: … }` — a mapped type over every operation. Add a key to `Operations` and omit either map and the build breaks. So the smallest change that leaves the repo green is not a file and not a screen; it is **one operation**, and an operation drags its endpoint, its two registry entries, its facade method, and (thick) its Tauri command along with it.

That gives a four-rung ladder, from the unit the compiler enforces to the unit a person asks for:

| Unit | Contains | Green alone? |
|---|---|---|
| **Operation** | endpoint, contracts entry, `Operations` key, `ROUTES` + `COMMANDS`, facade method, Tauri command | Yes — this is the atom |
| **Entity** | domain type, port, service, EF repository, `DbSet`, two DI lines | Yes, but nothing can reach it |
| **Screen** | view, ViewModel, route, menu command | Yes, but renders nothing |
| **Slice** | entity + list/get/save + screen + form schema | Yes, and useful |

The generator is built as those four groups composed behind one CLI, and **exposes only `slice` today**. Composition costs nothing — it is where the function boundaries fall anyway — while a second entry point is speculative until the case appears. When it does (`add archive to orders`, one operation, no new entity or screen), the subcommand is a few lines of argument parsing over emitters that already exist.

A slice is **one aggregate with CRUD**. It is deliberately not "a feature": a feature with two entities is two slices plus hand-written glue, and the glue is where the domain behavior lives — the part that was never generatable and never should be. The generator's contract is exactly the shape `users` has. Everything past it is the agent's work, extending the tests the generator emitted.

## How

### Two phases, forced by codegen

The frontend DTOs do not exist until the API compiles and emits OpenAPI. `add-an-api-slice` step 9 is `npm run codegen` for this reason, and it constrains the generator's shape:

```
Phase A   .NET files + 3 registration sites  →  dotnet build  →  npm run codegen
Phase B   contracts, operations, feature files, routes, menu, Rust
```

`slice.ts` runs both by default and stops with a readable error if phase A does not build, because phase B emitted against a stale `api-types.ts` produces TypeScript that compiles and is wrong.

### Locate with the AST, edit with a string splice

`typescript` is already a devDependency. Injection parses the target with `ts.createSourceFile`, finds the node (the `Operations` interface, the `ROUTES` object literal, the `routes` array), and splices text at `node.end`. It never re-prints: the printer reformats the whole file and every generated slice would arrive with a gratuitous diff.

C# and Rust have no parser available and do not need one — `AddScoped` lists, a `DbSet` block, and a `generate_handler!` list are regular enough for anchored insertion. Anchors follow `tools/init/thin.ts`'s rule: throw when an anchor is missing or ambiguous, never silently skip.

Injection is idempotent. Running the generator twice for the same slice is a no-op on every registry, not a duplicate entry.

### Shape only, and that means green

Last stated intent was "generate the shape, leave the bodies empty". Reading the files overturned it: for a CRUD slice there is no residual logic, so an empty-bodied emission would be a worse artifact that an agent must then fill with the exact code the generator already knows. The generator emits a complete, compiling, tested slice.

That collides with the TDD non-negotiable — *no production line exists before a failing test that demands it*. The collision is real and is resolved in ADR 0015: the generator emits production code and its tests in one atomic step, and `tools/slice/*.test.ts` is the failing-test-first cycle that demanded the emitter. Red-green-refactor applies to the generator. The generated slice is an artifact of a tested tool, the same status as `frontend/libs/ui/` (ADR 0010) and `.bob/registry/CATALOG.md` — generated, never hand-authored, and re-derivable.

Domain behavior beyond CRUD is not generated and never will be. The generator's contract is: it produces the slice `users` is. Anything past that is the agent's work, and the generated tests are the harness it extends.

### Test strategy

1. Pure emit functions are unit-tested against fixture specs. This is the bulk.
2. Injection is unit-tested against fixture source strings — insert, assert the result, insert again, assert idempotence, assert the throw on a missing anchor.
3. The acceptance test generates a slice into a temp directory and asserts every emitted TypeScript file parses without diagnostics via `ts.createSourceFile`.
4. Once, by hand, before merge: generate `orders` into the working tree, run `npm run verify`, delete it. A generated slice that survives the full gate is the only proof that matters.

Exact reproduction of the `users` files is deliberately *not* the acceptance test. The exemplar carries teaching prose that generated slices should not inherit, so a byte-diff would either fail forever or force that prose into every slice.

## Rejected

**Nx generators.** The article that prompted this needs an Nx workspace to host `generators.json`, and `Tree` is a write buffer implementable in forty lines. Nothing here needs Nx.

**Angular schematics.** Gives `Tree`, `--dry-run`, and `ng-morph`. Costs a `collection.json`, a build step, and a packaging story, in a repo where every tool is `node tools/x.ts` with no build at all. The injection half is available directly from the TypeScript compiler API, already a dependency. Schematics would win only if third parties needed to `ng add` jig capabilities into non-jig apps, which is not a goal.

**Per-language generators** (schematics for Angular, `dotnet new` item templates for C#). Two tools with a handoff between them, where the handoff — codegen, the operations registry — is the hard part and neither tool owns it. A jig feature is one vertical; its generator is one tool.

**Marker interfaces plus assembly scanning for .NET registration.** `AddFastEndpoints()` already scans, so endpoints, validators, and mappers register themselves today. The entire remaining .NET registration surface is three lines. A scanning convention to avoid three lines also trades a compile error for a runtime surprise, against ADR 0009.

**Plop and Hygen.** Both want a `_templates/` directory: a parallel copy of the slice written in a language the linter cannot parse, the compiler cannot check, and the catalog cannot see. That is the fourth source of truth the prime directive exists to prevent.

**Bun.** The repo runs `node tools/x.ts` on Node 22+ with native type stripping. A second runtime buys nothing.

## Out of scope

The `dotnet new` whole-repo template (replacing `tools/init`), the `//#if (sample)` markers that would let a clone omit `users`, and `npm run upstream` (reverse-rename a clone and diff it against the template) are separate pieces of work. The generator does not depend on any of them.
