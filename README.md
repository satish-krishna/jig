# Jig

A jig is the fixture a maker builds once so every part after it comes out identical and correct without rework. That is this repository's whole job: build the fixture once, and every app cloned from it comes out following the same patterns, gates, and conventions.

Jig is an AI-native desktop template. One Angular SPA runs two ways: as a **thick client** inside a Tauri shell (Rust core, IPC) and as a **thin client** against a remote **.NET FastEndpoints** API (HTTP). One frontend, two wires. It is optimized for agent-driven development: every future agent that opens this repo can discover what exists and extend it rather than reinventing it.

This is a template, not a product. It ships one worked vertical slice, `users`, that exercises every layer end to end. Copy its shape; do not add speculative features.

## One-command setup

From a fresh clone:

```
npm run setup
```

That verifies the toolchain and language servers, wires the git hooks, installs dependencies (root, frontend, Playwright browser), restores .NET and Rust, and generates the capability catalog. Then confirm everything is green:

```
npm run verify
```

`verify` runs the full build and every test suite across all three languages plus the catalog freshness check. Green here is the definition of the fixture holding.

### Prerequisites

The setup script checks for and fails early without: Node 22+, the .NET 10 SDK, the Rust toolchain, the Tauri CLI, and three language servers (`rust-analyzer`, a TypeScript server, and `csharp-ls`).

## How it fits together

```mermaid
flowchart TD
    View --> VM["ViewModel (signals)"]
    VM --> Repo["Repository (operations)"]
    Repo --> Norm["NormalizingTransport (one error seam)"]
    Norm --> Port["Transport port"]
    Port -. "isTauri() at bootstrap" .-> Ipc["IpcTransport -> Rust core"]
    Port -.-> Http["HttpTransport -> .NET API"]
```

- **Contracts** (`frontend/src/app/contracts`): one typed operation registry is the single source of truth for every request and response shape. Response types are the OpenAPI-generated DTOs, so HTTP and IPC cannot disagree.
- **Transport** (`frontend/src/app/transport`): the only place that knows two wires exist. The wire is chosen once, at bootstrap, by `isTauri()`. Errors from either wire fold into one `AppError` at a single seam.
- **Backend** (`services/api`): .NET FastEndpoints with a Result envelope, FluentValidation, and EF Core, in clean-architecture layers (Api, Application, Domain, Infrastructure).
- **Rust core** (`apps/desktop/src-tauri`): thin Tauri commands over a store that mirrors the API's use-cases, so both wires behave the same.
- **Forms** (`frontend/src/app/forms`): one zod schema per form owns shape, validation, and field metadata; a single renderer turns it into controls.

## Working here

- **`CLAUDE.md`** is the agent constitution: read it first. It carries the discovery gate, the non-negotiables, and a routing table to the deeper docs.
- **`CONTRIBUTING.md`** is the working manual: coding standards, TDD per language, commit conventions, and the gate commands.
- **`docs/architecture/`** holds the task-scoped deep rules (the transport seam, the schema-driven forms).
- **`.forge/registry/CATALOG.md`** is the generated index of every reusable capability. Never hand-edit it; annotate the code and run `npm run catalog`.

## Adding a feature

Follow `.forge/prompts/new-feature.md` and copy the `users` slice end to end. Discover first, annotate what you build, regenerate the catalog, and commit at a green gate with a Conventional Commits message.

## Commands

| Command | What it does |
|---|---|
| `npm run setup` | One-command environment bootstrap for a fresh clone |
| `npm run verify` | Full build, all tests, catalog freshness (the gate) |
| `npm run catalog` | Regenerate the capability catalog |
| `npm run codegen` | Emit OpenAPI from the API and generate the TypeScript DTOs |
| `npm --prefix frontend run e2e` | Playwright smoke over the users slice |
