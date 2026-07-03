# Jig: agent constitution

You are in **Jig**, an AI-native desktop template. A jig is the fixture a maker builds once so every part after it comes out identical and correct without rework. Build the fixture once, and every app cloned from it follows the same patterns, gates, and conventions.

This file is the always-loaded entry point. It stays short on purpose: it carries only the rules that apply to every task, and it routes you to the detail for the task in front of you. Read the routed file before you start that kind of work.

## Prime directive: discover before you build

Agents reinvent because they cannot cheaply find what exists. Before authoring any **reusable unit** (a transport, a repository, a base endpoint, a validator, a shared component, a capability service, a Rust command helper), run this checklist in order:

1. Read `.forge/registry/CATALOG.md` for the relevant area.
2. Run an LSP `workspace/symbol` search for the concept.
3. If a match exists, reuse or extend it. Generalising the existing unit beats adding a parallel one.
4. If nothing fits, create it, annotate it (see CONTRIBUTING.md), and regenerate the catalog with `npm run catalog`.
5. If you create something that overlaps an existing capability, that is a defect. Record why in an ADR under `.forge/adr/`.

This is a template, not a product. The `users` slice is the one worked example that exercises every layer. Copy its shape; add no speculative features.

## The non-negotiables (gates, not preferences)

- **SOLID:** one reason to change; depend on abstractions; small client-specific interfaces; new behaviour by extension, not by editing stable code.
- **YAGNI:** build only the `users` slice and the machinery it proves. One implementer and no second one imminent means inline it.
- **DRY, docs included:** no fact stated twice by hand. The catalog is generated; form models are `z.infer`; DTOs are generated from OpenAPI.
- **TDD, red-green-refactor:** no production line exists before a failing test that demands it. Holds in TypeScript, C#, and Rust.
- **AI-native:** LSP navigation over grep; generated catalogs over tribal knowledge; machine-checked gates over "please remember".
- **Conventional Commits:** every commit is `type(scope): summary`, and commits land only at a green gate.

The smell test for each lives in CONTRIBUTING.md. If any instruction conflicts with these six, stop and surface the conflict before proceeding.

## Read before you start (progressive disclosure)

This file is tier one. Everything below is disclosed on demand: open the file that matches your task, not all of them.

| When you are about to | Read first |
|---|---|
| Write code, run tests, or commit | `CONTRIBUTING.md` |
| Touch the transport seam (IPC or HTTP) | `docs/architecture/conduit.md` |
| Build or change a form | `docs/architecture/forms.md` |
| Add a whole feature | `.forge/prompts/new-feature.md` |
| Understand a past decision | `.forge/adr/` |

Two rules that apply everywhere: the catalog under `.forge/registry/` is generated, so never hand-edit it (annotate the code and run `npm run catalog`); and prefer LSP navigation (`workspace/symbol`, find-references, hover) over grep. Native LSP covers TypeScript and Rust (install via `/plugin`); C# is wired through `.lsp.json`.

## Map of the repo

```
CLAUDE.md              this file, always read first
CONTRIBUTING.md        how to work here: standards, TDD, commits, gates
docs/architecture/     task-scoped deep rules (conduit, forms)
.forge/registry/       GENERATED catalog (do not hand-edit)
.forge/adr/            architecture decision records
.forge/prompts/        feature recipes
apps/desktop/          Tauri shell (Rust core, src-tauri)
frontend/src/app/
  contracts/           operation registry + generated DTOs (single source of truth)
  transport/           port, http/ipc/normalizing transports, provide-transport
  repositories/        speak operations only
  forms/               FormFieldMeta + zod-meta helper (forms are signal-forms, per feature)
  capabilities/        native-only services (absent from web bootstrap)
  features/users/       the reference slice. Copy this shape.
services/api/          .NET FastEndpoints (Jig.sln): Api, Application, Domain, Infrastructure
contracts/openapi/     OpenAPI spec emitted by the API (source for TS codegen)
tools/                 setup, catalog generator, codegen
```

Discover first. Annotate what you build. Commit at green.
