# Jig — Bootstrap Prompt (AI-Native Desktop Template: Tauri + Angular SPA + .NET FastEndpoints)

---

## 1. Mission

Scaffold **Jig**, a reusable **template repository** for building desktop applications as a **thick client** (Tauri shell with a Rust core, driving an Angular SPA over IPC) that can *also* deploy the same Angular SPA as a **thin client** against a remote **.NET FastEndpoints** web service. One frontend, two wires. The repo is the starting point I clone for every future desktop app, so optimise for **agent-driven development**: every future AI agent that opens this repo must be able to discover what already exists and extend it, rather than reinventing it.

This is a template, not a product. Build the skeleton, the conventions, the tooling, and one thin vertical slice (`users`) that exercises every layer end to end as a worked example. Do not build speculative features.

**The name.** A jig is the fixture a maker builds once so every part after it comes out identical and correct without rework. That is this repo's whole job: build the fixture once, and every app cloned from it comes out following the same patterns, gates, and conventions. Thread the name through concretely: repo name `jig`; frontend workspace scope `@jig/*` for shared libraries; .NET solution `Jig.sln` with projects namespaced `Jig.Api`, `Jig.Application`, `Jig.Domain`, `Jig.Infrastructure`; Rust crate and Tauri identifier `jig` (bundle id `com.jig.app` as a placeholder to override per clone).

## 2. Non-negotiables (these are gates, not preferences)

- **SOLID.** Every unit has one reason to change. Depend on abstractions. Interfaces are small and client-specific. New behaviour arrives by extension, not by editing stable code.
- **YAGNI.** Build only the `users` slice and the shared machinery it proves. No config knobs, no extension points, no "future" abstractions with a single implementation. If an abstraction has exactly one implementer and no second one is imminent, inline it.
- **DRY, applied to docs too.** No fact is stated in two places by hand. The capability catalog (section 5) is **generated** from code annotations, never authored. If you catch yourself copying a shape, hoist it to a shared contract.
- **TDD, strict red-green-refactor.** No production line of code exists before a failing test that demands it. Test first, watch it fail, make it pass minimally, refactor under green. This holds in all three languages.
- **AI-native throughout.** LSP-backed navigation over grep. Generated catalogs over tribal knowledge. Machine-checkable gates over "please remember". Governance files that future agents read on entry.
- **Conventional Commits, enforced.** Every commit follows `type(scope): summary` per the Conventional Commits spec, with scopes mirroring the repo areas (`transport`, `forms`, `contracts`, `api`, `shell`, `catalog`, `tools`). It is machine-checked by a `commitlint` config plus a `commit-msg` git hook installed by the setup script, so a non-conforming message is rejected, not merely discouraged. Commits still land only at a green gate. This also hands you automated changelog and semver later, for the Tauri updater, with no extra bookkeeping now.

If any instruction below appears to conflict with these six, stop and surface the conflict before proceeding.

## 3. Target architecture

The transport seam is the only place in the frontend that knows two worlds exist. View, ViewModel, repositories, and domain stay identical regardless of wire. This is the **Conduit** pattern; follow it exactly.

```mermaid
flowchart TD
    subgraph Constant["Angular SPA — constant across both contexts"]
        View["View (template + bindings)"] --> VM["ViewModel (signals)"]
        VM --> Repo["Repository (operation calls)"]
        Repo --> Norm["NormalizingTransport (single error seam)"]
        Norm --> Port["Transport port (abstract, DI token)"]
    end
    Port -. isTauri picks one at bootstrap .-> Ipc["IpcTransport → invoke"]
    Port -. .-> Http["HttpTransport → HttpClient"]
    Ipc --> Rust["Rust core (Tauri commands)<br/>thick client"]
    Http --> Api[".NET FastEndpoints API<br/>thin client"]
```

Rules that keep it honest:

- The **operation registry** is the single source of truth for every request/response shape. Both transports key off it, so TypeScript forces parity and the contract cannot drift.
- Response types resolve to the **OpenAPI-generated DTOs** from the .NET API, so HTTP and IPC cannot disagree about a shape.
- **One error seam.** No `HttpErrorResponse` and no raw `invoke` rejection may reach a repository or ViewModel. The `NormalizingTransport` decorator folds both into one `AppError`.
- **Auth lives on the HTTP side only** (interceptor). IPC trusts the local origin; the Rust core holds real credentials.
- **Native-only capabilities** (tray, file watch, local config) never enter the shared operation map as "throws on HTTP" stubs. They live behind a capability service that is simply not provided in the web bootstrap.
- Smells that mean it is breaking: `isTauri()` or `window` checks above the bootstrap factory; a URL string or command name in a repository; a `catch` inspecting `.status`; a shared operation implemented as a throw on one wire.

## 4. Tech stack (pin these choices)

| Layer | Choice |
|---|---|
| Desktop shell | Tauri v2 (Rust core, `src-tauri`), system WebView, updater plugin wired but no-op by default |
| Frontend | Angular (latest stable), standalone components, signals, SPA/SSG output only (no SSR — Tauri has no Node runtime) |
| Frontend transport | Conduit dual-transport (`contracts` → `transport` → `repositories`) |
| Frontend UI | spartan-ng primitives and form controls |
| Frontend forms | zod schema-driven: one schema is the single source of truth for shape, validation, inferred model type, and field metadata, rendered with spartan-ng controls (same principle as ngx-formly, without the parallel config layer) |
| Backend | .NET (latest LTS), FastEndpoints, FluentValidation, Result pattern (no exceptions for expected failures), EF Core |
| Contracts | OpenAPI emitted by the API → TypeScript DTOs generated into the frontend |
| Frontend tests | Vitest + Angular Testing Library (unit/component), Playwright (e2e) |
| Backend tests | xUnit + FluentAssertions + FakeItEasy, FastEndpoints integration testing, Testcontainers for anything stateful |
| Rust tests | `cargo test` (+ `cargo nextest` if available), command-level tests for every Tauri command |

Verify current package/binary names against docs before installing; do not assume versions.

### 4.1 Schema-driven forms (zod + spartan)

Forms follow the same schema-driven idea as ngx-formly, but the schema *is* a zod schema, so validation, the model type, and the field metadata all come from one definition instead of a separate config object. Build a single reusable renderer (a top-tier reusable capability, annotated per section 5.1) and never hand-assemble a form again.

- **One zod schema per form is the source of truth.** It owns field shapes and validation rules. Nothing restates them.
- **The form model type is `z.infer<typeof schema>`.** Never hand-write a form interface. This is the same DRY win as the generated transport DTOs.
- **Presentation metadata rides on the field**, via zod 4 `.meta()` against a typed `FormFieldMeta` (label, control kind, placeholder, options, order, help text). Strongly type the meta so a missing label is a compile error, not a runtime surprise. Example:
  ```ts
  type FormFieldMeta = {
    label: string;
    control: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';
    placeholder?: string;
    options?: ReadonlyArray<{ value: string; label: string }>;
    order?: number;
  };
  
  const userForm = z.object({
    name:  z.string().min(1).meta({ label: 'Name', control: 'text' } satisfies FormFieldMeta),
    email: z.string().email().meta({ label: 'Email', control: 'email' } satisfies FormFieldMeta),
  });
  ```
- **The renderer is the only place that maps a zod type + meta to a spartan control** and binds it to the reactive form. Adding a new control kind means extending the renderer's map once, never re-implementing a control per feature.
- **Validation runs through zod, once.** On submit (and optionally per field) call `schema.safeParse(value)`; on failure, fold the zod issue tree back onto the matching controls so spartan shows the errors. Do not mirror a zod rule as a separate Angular validator; the schema owns it.
- **Boundary reuse (the bonus).** zod 4 emits JSON Schema, so where a form schema and a transport operation describe the same shape, the one schema can also validate the wire. Share it rather than defining the shape twice.

Smells that mean the pattern is breaking: a hand-written form-model interface; a validation rule stated in both the schema and an Angular validator; a `switch` on control type living in a feature instead of the renderer; a form built by wiring `FormControl`s by hand instead of from a schema.

## 5. The reuse mechanism (the part that matters most)

Agents reinvent because they cannot cheaply find what exists. Fix that structurally.

### 5.1 Annotate every reusable unit at its definition

A "reusable unit" is anything meant to be used from more than one place: a transport, a repository, a base endpoint, a validator, a shared component, a capability service, a Rust command helper. Each carries a machine-parseable capability block **inline in its doc comment**, in the language's native doc format:

**TypeScript (TSDoc):**
```ts
/**
 * Folds HTTP and IPC failures into one AppError at a single seam.
 * @capability transport.normalizing
 * @intent One place to shape errors, retry, and log; nothing above branches on wire.
 * @reuse Wrap the selected Transport at bootstrap. Never add error branching above this.
 * @since 0.1.0
 */
```

**Rust (rustdoc):**
```rust
/// Native system-tray lifecycle for the desktop shell.
/// @capability shell.tray
/// @intent Own tray creation/teardown so features request tray state, not build it.
/// @reuse Call via TrayService; the web build never sees this.
```

**C# (XML doc):**
```csharp
/// <summary>Uniform success/failure envelope returned by every endpoint.</summary>
/// <capability>api.result-envelope</capability>
/// <intent>Expected failures travel as data, not exceptions.</intent>
/// <reuse>Return Result&lt;T&gt; from handlers; do not throw for validation or not-found.</reuse>
```

### 5.2 Generate the catalog, never write it

Build a small generator in `tools/catalog/` (TypeScript is fine; it must run cross-language by scanning source text for the tags above). It produces:

- `.bob/registry/catalog.json` — the machine index: capability id, intent, reuse note, file path, language, symbol name.
- `.bob/registry/CATALOG.md` — the human/agent-readable view, grouped by area.

Wire it so it runs on a `pre-commit` hook and in CI, and **fails the build if the catalog is stale** (regenerate and diff). This makes "100% embedded documentation" a mechanical guarantee: a reusable unit without a capability block is either annotated or it is not reusable, and a catalog that drifts breaks the build.

### 5.3 The discovery gate (goes into CLAUDE.md, section 10)

Before authoring any reusable unit, an agent MUST:
1. Read `.bob/registry/CATALOG.md` for the relevant area.
2. Run an LSP `workspace/symbol` search for the concept.
3. If a match exists: reuse or extend it. Editing the existing unit to generalise it is preferred over adding a parallel one.
4. Only if nothing fits: create it, annotate it (5.1), and regenerate the catalog.
5. If you create something that overlaps an existing capability, that is a defect. Record why in an ADR under `.bob/adr/`.

## 6. LSP + agent tooling (AI-native code intelligence)

Install the language servers and wire them so agents navigate by type, not by text. Structured LSP responses cost a fraction of grep and eliminate false-positive symbol matches, which is what makes the discovery gate above fast enough to actually follow.

1. **Install binaries:** `rust-analyzer`, `typescript-language-server` (or `vtsls`), and a C# server (`csharp-ls` as a dotnet global tool is the pragmatic default; the Roslyn-based `Microsoft.CodeAnalysis.LanguageServer` is the heavier alternative). Add a `version` check for each to the setup script and fail early if missing.
2. **Native Claude Code LSP (2.1.x+):** install the marketplace LSP plugins for TypeScript and Rust via `/plugin`. For C#, generate a `.lsp.json` (schema is indicative; verify against the current Claude Code plugins reference):
   ```json
   {
     "csharp": {
       "command": ["csharp-ls"],
       "extensions": [".cs"],
       "rootPatterns": ["*.sln", "*.csproj"]
     }
   }
   ```
3. **Optional power-up:** register an MCP LSP orchestrator (e.g. agent-lsp) that exposes blast-radius and speculative-edit tools across all three languages. Add it to `.mcp.json` and document in CLAUDE.md when to prefer it (large refactors, "what breaks if I change this signature").
4. Put the whole thing in `tools/setup/` as an idempotent script so a fresh clone is one command from a working, LSP-aware agent environment.

## 7. TDD workflow (enforced, per language)

For every unit, in this order: write the failing test, run it, confirm the red is for the right reason, write the minimum to pass, refactor green. Never batch. Commit at green, with a Conventional Commits message.

- **.NET:** unit tests against handlers with FakeItEasy doubles; integration tests through FastEndpoints' test host for each endpoint (real routing, real validation, in-memory or Testcontainers persistence). Assert the Result envelope, not thrown exceptions, for expected failures.
- **Angular:** ViewModels tested as plain classes with a fake `Transport` implementing the operation registry (this is why the port exists). Components via Testing Library. One Playwright smoke test that boots the SPA and drives the `users` slice.
- **Rust:** every Tauri command has a test that calls it directly with a payload matching the operation registry's `req` shape and asserts the `res` shape. The command layer stays thin; logic it delegates to is unit-tested in isolation.

The `users` slice must ship with tests at all three levels as the reference pattern future features copy.

## 8. Repository layout

```
/
├─ CLAUDE.md                 # agent constitution (section 10) — future agents read first
├─ README.md                 # human onboarding + one-command setup
├─ .mcp.json                 # MCP servers (LSP orchestrator, etc.)
├─ .lsp.json                 # custom LSP config (C#)
├─ .bob/                   # AI workflow artifacts
│  ├─ registry/              # GENERATED catalog.json + CATALOG.md (do not hand-edit)
│  ├─ adr/                   # architecture decision records
│  └─ prompts/               # reusable sub-prompts / feature recipes
├─ apps/
│  └─ desktop/               # Tauri: src-tauri (Rust core), bundles the built frontend
├─ frontend/                 # Angular SPA — the constant across both wires
│  └─ src/app/
│     ├─ contracts/          # operation registry (single source of truth) + generated DTOs
│     ├─ transport/          # port, http.transport, ipc.transport, normalizing, provide-transport
│     ├─ repositories/       # speak operations only
│     ├─ forms/              # reusable zod→spartan renderer + FormFieldMeta type (section 4.1)
│     ├─ capabilities/       # native-only services (absent from web bootstrap)
│     └─ features/users/     # reference vertical slice (view + vm + zod form + tests)
├─ services/
│  └─ api/                   # .NET FastEndpoints — thin/web deployment (Jig.sln)
│     └─ src/{Jig.Api,Jig.Application,Jig.Domain,Jig.Infrastructure}/
├─ contracts/openapi/        # OpenAPI spec emitted by the API (source for TS codegen)
└─ tools/
   ├─ setup/                 # idempotent env + LSP bootstrap
   ├─ catalog/               # capability catalog generator (section 5.2)
   └─ codegen/               # OpenAPI → TypeScript DTO generation
```

## 9. Execution phases (do these in order; each ends at a green gate + a conventional commit)

**Phase 0 — Ground rules.** Generate `CLAUDE.md` (section 10), `.bob/` layout, the empty catalog + generator, the setup script, LSP wiring, and commit-message enforcement (`commitlint` config + `commit-msg` hook). Gate: setup script runs clean, catalog generator produces an empty-but-valid catalog, `version` checks pass for all three language servers, and the commit hook rejects a malformed message while accepting a conventional one.

**Phase 1 — Contracts spine.** Define the `users` operations in the operation registry. Stand up the .NET API project with FastEndpoints, emit OpenAPI, generate TS DTOs, and confirm the registry's `res` types resolve to generated DTOs. Gate: codegen runs, types compile, no hand-written DTOs.

**Phase 2 — Backend slice (TDD).** `users.get/list/save` as FastEndpoints endpoints with FluentValidation and the Result envelope, backed by EF Core. Tests first, at unit and integration level. Gate: all backend tests green, endpoints reachable through the test host.

**Phase 3 — Transport layer (Conduit).** Build port, `HttpTransport`, `IpcTransport`, `NormalizingTransport`, and `provideTransport`. Every operation present in both `ROUTES` and `COMMANDS` (compiler-enforced). Gate: transport unit tests green against both transports with a fake wire.

**Phase 4 — Rust core.** Implement the Tauri commands the IPC transport targets, shapes matching the registry. Command tests first. Wire the updater plugin as a configured no-op. Gate: `cargo test` green, `tauri dev` opens the shell against the bundled frontend.

**Phase 5 — Frontend slice (TDD).** `UserListViewModel` (signals) + repository + view, tested with a fake `Transport`. the form built from a zod schema through the shared renderer (section 4.1), with spartan-ng controls and zod-driven validation. Gate: Vitest green (including a renderer test that a schema produces the right controls and that a `safeParse` failure surfaces on the right field), Playwright smoke passes, the same build runs under Tauri (IPC) and in the browser (HTTP) unchanged.

**Phase 6 — Seal it as a template.** Regenerate the catalog (now populated by the `users` slice). Write the README onboarding (titled **Jig**, opening with the "build the fixture once, every app comes out identical" framing) and a `.bob/prompts/new-feature.md` recipe that walks an agent through adding a feature the same way. Gate: full build + all tests + catalog freshness check green in one command; fresh clone reaches green from the setup script alone.

## 10. Governance file to generate (`CLAUDE.md`)

Author `CLAUDE.md` so every future agent inherits the rules. It must contain, in the agent's own concise voice:

- **Prime directive:** this is **Jig**, an AI-native desktop template (build the fixture once, every app comes out identical and correct); discover before you build.
- **The discovery gate** (section 5.3) stated as a hard checklist run before authoring any reusable unit.
- **The five non-negotiables** (section 2) with the specific smell tests.
- **The Conduit rules** (section 3) including the three asymmetries and the breaking smells.
- **Schema-driven forms** (section 4.1): the zod schema owns shape, validation, and field meta; form models are `z.infer`; the zod-to-control mapping lives only in the shared renderer; never restate a validation rule as an Angular validator.
- **TDD is mandatory**; the order is red-green-refactor; commits happen at green.
- **Conventional Commits are enforced** by the `commit-msg` hook; use `type(scope): summary` with scopes mirroring the repo areas; a malformed message is rejected, and commits land only at green.
- **LSP-first navigation:** prefer `workspace/symbol`, `find-references`, and hover over grep and file reads; when to reach for the MCP LSP orchestrator.
- **Catalog is generated:** never hand-edit `.bob/registry/`; annotate the code and regenerate.
- **When creating overlaps an existing capability, that is a defect;** record an ADR.
- A short **map of the repo** pointing at the reference `users` slice as the pattern to copy.

Keep it natural and readable. No ASCII diagrams (use Mermaid if a diagram helps). No em dashes.

---

**Begin at Phase 0.** After each phase, report what was built, which gate passed, and what the next phase will touch. If a decision has real trade-offs (test runner, C# LSP choice, persistence for the slice), state the options and pick the pragmatic default rather than stalling; record anything non-obvious as an ADR.
