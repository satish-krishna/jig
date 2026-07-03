# Jig — agent constitution

You are working in **Jig**, an AI-native desktop template. A jig is the fixture a maker builds once so every part after it comes out identical and correct without rework. That is this repo's whole job. Build the fixture once, and every app cloned from it follows the same patterns, gates, and conventions.

**Prime directive: discover before you build.** Agents reinvent because they cannot cheaply find what exists. This repo fixes that structurally with a generated capability catalog and an LSP-aware environment. Use them. Extending an existing unit beats adding a parallel one every time.

This is a template, not a product. The `users` slice is the one worked example that exercises every layer. Copy its shape; do not add speculative features.

## The discovery gate (run before authoring any reusable unit)

A "reusable unit" is anything used from more than one place: a transport, a repository, a base endpoint, a validator, a shared component, a capability service, a Rust command helper.

Before you create one, in order:

1. Read `.forge/registry/CATALOG.md` for the relevant area.
2. Run an LSP `workspace/symbol` search for the concept.
3. If a match exists, reuse or extend it. Editing the existing unit to generalise it is preferred over adding a parallel one.
4. Only if nothing fits: create it, annotate it (see "Annotate every reusable unit" below), and regenerate the catalog.
5. If you create something that overlaps an existing capability, that is a defect. Record why in an ADR under `.forge/adr/`.

## The non-negotiables (gates, not preferences)

Each comes with the smell that means you are breaking it.

- **SOLID.** Every unit has one reason to change; depend on abstractions; interfaces are small and client-specific; new behaviour arrives by extension, not by editing stable code. Smell: a class that changes for two unrelated reasons; a fat interface with one caller using one method.
- **YAGNI.** Build only the `users` slice and the machinery it proves. Smell: an abstraction with exactly one implementer and no second one imminent. If you find one, inline it.
- **DRY, docs included.** No fact stated twice by hand. The catalog is generated, never authored. Form models are `z.infer`, never hand-written. DTOs are generated from OpenAPI, never hand-written. Smell: a shape copied between two files; a validation rule written in both a zod schema and an Angular validator.
- **TDD, strict red-green-refactor.** No production line exists before a failing test that demands it. Write the test, watch it fail for the right reason, write the minimum to pass, refactor under green. Holds in TypeScript, C#, and Rust. Smell: production code in a diff with no test that would have failed without it.
- **AI-native throughout.** LSP navigation over grep. Generated catalogs over tribal knowledge. Machine-checked gates over "please remember." Smell: reaching for grep when `workspace/symbol` would answer; documenting a capability in prose instead of an annotation.
- **Conventional Commits, enforced.** Every commit is `type(scope): summary`. Commits land only at a green gate.

If any instruction appears to conflict with these, stop and surface the conflict before proceeding.

## The Conduit pattern (the transport seam)

One Angular frontend runs unchanged over two wires: Tauri IPC (thick client) and HTTP to the .NET API (thin client). The transport seam is the **only** place in the frontend that knows two worlds exist. View, ViewModel, repository, and domain stay identical regardless of wire.

```mermaid
flowchart TD
    View --> VM["ViewModel (signals)"]
    VM --> Repo["Repository (operation calls)"]
    Repo --> Norm["NormalizingTransport (single error seam)"]
    Norm --> Port["Transport port (DI token)"]
    Port -. isTauri picks one at bootstrap .-> Ipc["IpcTransport → invoke"]
    Port -. .-> Http["HttpTransport → HttpClient"]
    Ipc --> Rust["Rust core (thick)"]
    Http --> Api[".NET API (thin)"]
```

Rules that keep it honest:

- The **operation registry** in `contracts/` is the single source of truth for every request/response shape. Both transports key off it, so TypeScript forces parity and the contract cannot drift.
- Response types resolve to the **OpenAPI-generated DTOs**, so HTTP and IPC cannot disagree about a shape.
- **One error seam.** No `HttpErrorResponse` and no raw `invoke` rejection may reach a repository or ViewModel. `NormalizingTransport` folds both into one `AppError`.

The three legitimate asymmetries (everything else is identical across wires):

1. **Transport selection** happens once, at the bootstrap factory, via `isTauri`. Nowhere above it.
2. **Auth is HTTP-only** (an interceptor). IPC trusts the local origin; the Rust core holds real credentials.
3. **Native-only capabilities** (tray, file watch, local config) are thick-only. They live behind a capability service that is simply not provided in the web bootstrap. They never enter the shared operation map as "throws on HTTP" stubs.

Smells that mean it is breaking: `isTauri()` or `window` checks above the bootstrap factory; a URL string or command name inside a repository; a `catch` that inspects `.status`; a shared operation implemented as a throw on one wire.

## Schema-driven forms (zod + spartan)

- **One zod schema per form is the source of truth.** It owns field shapes and validation rules. Nothing restates them.
- **The form model type is `z.infer<typeof schema>`.** Never hand-write a form interface.
- **Presentation metadata rides on the field** via zod `.meta()` against a typed `FormFieldMeta` (label, control kind, placeholder, options, order). A missing label is a compile error.
- **The shared renderer is the only place that maps a zod type plus meta to a spartan control.** Adding a control kind extends the renderer's map once, never per feature.
- **Validation runs through zod, once.** On submit call `schema.safeParse(value)`; on failure fold the zod issue tree back onto the matching controls. Do not mirror a zod rule as a separate Angular validator.

Smells: a hand-written form-model interface; a rule stated in both the schema and a validator; a `switch` on control type in a feature instead of the renderer; a form built by wiring `FormControl`s by hand.

## Annotate every reusable unit

Each reusable unit carries a machine-parseable capability block inline in its doc comment, in the language's native format. The catalog generator reads these.

TypeScript (TSDoc): `@capability`, `@intent`, `@reuse`, `@since`.
Rust (rustdoc): `/// @capability`, `/// @intent`, `/// @reuse`.
C# (XML doc): `<capability>`, `<intent>`, `<reuse>`.

A reusable unit without a capability block is either annotated or it is not reusable.

## The catalog is generated, never written

`.forge/registry/catalog.json` and `.forge/registry/CATALOG.md` are output of `tools/catalog`. Never hand-edit them. Annotate the code and run `npm run catalog`. The pre-commit hook and CI run `npm run catalog:check` and fail on drift, so a stale catalog blocks the commit.

## TDD and commits

Red, green, refactor, per language, never batched. Commit at green with a Conventional Commits message: `type(scope): summary`. Scopes mirror the repo areas: `transport`, `forms`, `contracts`, `api`, `shell`, `catalog`, `tools`, `repo`. The `commit-msg` hook rejects a malformed message; commits land only at a green gate.

Per-language TDD shape:

- **.NET:** unit tests against handlers with FakeItEasy doubles; integration tests through the FastEndpoints test host per endpoint. Assert the Result envelope, not thrown exceptions, for expected failures.
- **Angular:** ViewModels tested as plain classes with a fake `Transport` implementing the operation registry. Components via Angular Testing Library. One Playwright smoke that drives the `users` slice.
- **Rust:** every Tauri command has a test that calls it with a payload matching the registry `req` shape and asserts the `res` shape. Keep the command layer thin; unit-test the logic it delegates to.

## LSP-first navigation

Prefer `workspace/symbol`, find-references, and hover over grep and file reads. Native Claude Code LSP covers TypeScript and Rust (install via `/plugin`); C# is wired through `.lsp.json` (csharp-ls). The MCP LSP orchestrator is deferred (see `.forge/adr/0002`); add it only for a large cross-cutting refactor.

## Map of the repo

```
CLAUDE.md              this file — read first
.forge/registry/       GENERATED catalog (do not hand-edit)
.forge/adr/            architecture decision records
.forge/prompts/        reusable feature recipes (see new-feature.md)
apps/desktop/          Tauri shell (Rust core, src-tauri)
frontend/src/app/
  contracts/           operation registry + generated DTOs (single source of truth)
  transport/           port, http/ipc/normalizing transports, provide-transport
  repositories/        speak operations only
  forms/               zod → spartan renderer + FormFieldMeta
  capabilities/        native-only services (absent from web bootstrap)
  features/users/       ← the reference slice. Copy this shape.
services/api/          .NET FastEndpoints (Jig.sln): Api, Application, Domain, Infrastructure
contracts/openapi/     OpenAPI spec emitted by the API (source for TS codegen)
tools/                 setup, catalog generator, codegen
```

When adding a feature, follow `.forge/prompts/new-feature.md` and copy the `users` slice. Discover first. Annotate what you build. Commit at green.
