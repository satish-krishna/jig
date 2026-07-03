# Contributing to Jig

This is how you work inside Jig. `CLAUDE.md` is the always-on constitution and routes you here before you write code, run tests, or commit. Architecture-specific rules live in `docs/architecture/` and are routed from `CLAUDE.md` when you touch that seam.

## The non-negotiables, with smell tests

Each gate below comes with the smell that means you are breaking it. When you catch the smell, stop.

- **SOLID.** Every unit has one reason to change; depend on abstractions; interfaces are small and client-specific; new behaviour arrives by extension, not by editing stable code.
  - Smell: a class that changes for two unrelated reasons; a fat interface whose one caller uses one method.
- **YAGNI.** Build only the `users` slice and the machinery it proves. No config knobs, extension points, or "future" abstractions with a single implementation.
  - Smell: an abstraction with exactly one implementer and no second one imminent. Inline it.
- **DRY, docs included.** No fact is stated twice by hand. The catalog is generated, form models are `z.infer`, DTOs are generated from OpenAPI.
  - Smell: a shape copied between two files; a validation rule written in both a zod schema and an Angular validator.
- **TDD, strict red-green-refactor.** No production line exists before a failing test that demands it.
  - Smell: production code in a diff with no test that would have failed without it.
- **AI-native throughout.** LSP navigation over grep; generated catalogs over tribal knowledge; machine-checked gates over "please remember".
  - Smell: reaching for grep when `workspace/symbol` would answer; documenting a capability in prose instead of an annotation.
- **Conventional Commits, enforced.** Every commit is `type(scope): summary`; commits land only at a green gate.
  - Smell: a commit message the `commit-msg` hook has to reject; a commit made with red tests.

## TDD is mandatory

The order is always: write the failing test, run it, confirm the red is for the right reason, write the minimum to pass, refactor under green. Never batch. Commit at green.

Per language:

- **.NET:** unit tests against handlers with FakeItEasy doubles; integration tests through the FastEndpoints test host per endpoint (real routing, real validation, SQLite in-memory or Testcontainers per ADR 0001). Assert the Result envelope, not thrown exceptions, for expected failures.
- **Angular:** ViewModels tested as plain classes with a fake `Transport` implementing the operation registry (this is why the port exists). Components via Angular Testing Library. One Playwright smoke that boots the SPA and drives the `users` slice.
- **Rust:** every Tauri command has a test that calls it directly with a payload matching the operation registry's `req` shape and asserts the `res` shape. Keep the command layer thin; unit-test the logic it delegates to in isolation.

The `users` slice ships with tests at all three levels as the reference pattern future features copy.

## Coding standards

- **Error handling.** Backend expected failures travel as a `Result` envelope, never thrown exceptions. Frontend failures fold to one `AppError` at the `NormalizingTransport` seam; nothing above it branches on the wire. See `docs/architecture/conduit.md`.
- **Types are generated, not hand-written.** Frontend DTOs come from the OpenAPI spec (`npm run codegen`); form model types are `z.infer<typeof schema>`. If you are typing a shape by hand that already exists at a boundary, stop and generate it.
- **Naming mirrors the areas.** Frontend workspace scope is `@jig/*`; .NET projects are `Jig.Api`, `Jig.Application`, `Jig.Domain`, `Jig.Infrastructure`; the Rust crate and Tauri identifier are `jig`.
- **Match the surrounding code.** Comment density, naming, and idiom follow the file you are editing, not your defaults.

## Annotate every reusable unit (this feeds the catalog)

A reusable unit without a capability block is either annotated or it is not reusable. Write the block inline in the language's native doc format; the generator reads it.

TypeScript (TSDoc):
```ts
/**
 * Folds HTTP and IPC failures into one AppError at a single seam.
 * @capability transport.normalizing
 * @intent One place to shape errors; nothing above branches on wire.
 * @reuse Wrap the selected Transport at bootstrap.
 * @since 0.1.0
 */
```

Rust (rustdoc): `/// @capability`, `/// @intent`, `/// @reuse`.
C# (XML doc): `<capability>`, `<intent>`, `<reuse>`.

## The catalog is generated, never written

`.forge/registry/catalog.json` and `.forge/registry/CATALOG.md` are output of `tools/catalog`. Never hand-edit them.

- Regenerate: `npm run catalog`
- Verify freshness: `npm run catalog:check` (this is what the pre-commit hook and CI run; a stale catalog fails the build)

## Commits: Conventional Commits, enforced

Format: `type(scope): summary`.

- **Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.
- **Scopes (required):** `transport`, `forms`, `contracts`, `api`, `shell`, `catalog`, `tools`, `repo`.
- Enforced by the `commit-msg` hook via `commitlint` (`commitlint.config.mjs`). A malformed message is rejected, not merely discouraged.
- Commits land only at a green gate. The `pre-commit` hook blocks the commit if the catalog is stale or the tooling tests fail.

Examples:
- Good: `feat(transport): add NormalizingTransport error seam`
- Good: `test(api): cover users.save validation failures`
- Rejected: `added transport stuff` (no type, no scope)

## Running the gates

- One-command environment bootstrap: `npm run setup` (idempotent; checks the toolchain and all three language servers, wires git hooks, generates the catalog).
- Tooling tests: `npm run test:tools`
- Catalog freshness: `npm run catalog:check`
- Per-language test gates arrive with their phases: `dotnet test` (backend), the frontend test runner (Vitest + Playwright), and `cargo test` (Rust).

## Adding a feature

Follow `.forge/prompts/new-feature.md` and copy the `users` slice end to end. Discover first (the prime directive in `CLAUDE.md`), annotate what you build, regenerate the catalog, commit at green.
