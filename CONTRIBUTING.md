# Contributing to Jig

This is how you work inside Jig. `CLAUDE.md` is the always-on constitution and routes you here before you write code, run tests, or commit. Architecture-specific rules live in `docs/architecture/` and are routed from `CLAUDE.md` when you touch that seam.

## The non-negotiables, with smell tests

Each gate below comes with the smell that means you are breaking it. When you catch the smell, stop.

- **SOLID.** Every unit has one reason to change; depend on abstractions; interfaces are small and client-specific; new behaviour arrives by extension, not by editing stable code.
  - Smell: a class that changes for two unrelated reasons; a fat interface whose one caller uses one method.
- **YAGNI.** Build only the `users` slice and the machinery it proves. No config knobs, extension points, or "future" abstractions with a single implementation.
  - Smell: an abstraction with exactly one implementer and no second one imminent. Inline it.
- **DRY, docs included.** No fact is stated twice by hand. The catalog is generated, form models are `z.infer`, DTOs are generated from OpenAPI.
  - Smell: a shape copied between two files; a validation rule written in both a zod schema and a hand-written validator.
- **KISS, the plainest thing that works.** The code you write is the simplest version that passes — straight-line over clever, obvious over compact. A tired reader should trace it at 3AM without a comment explaining *how* it works. This is a cousin of YAGNI, not a duplicate: YAGNI decides whether a thing gets built; KISS decides that the thing you do build stays simple.
  - Smell: a clever one-liner that needs a comment to decode; a metaprogramming trick where a plain loop would do; a layer of indirection with one caller and no second one coming.
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
- **Angular:** ViewModels tested as plain classes with a fake `Transport` implementing the operation registry (this is why the port exists). Components via Angular's `TestBed` under Vitest. One Playwright smoke that boots the SPA and drives the `users` slice.
- **Rust:** every Tauri command has a test that calls it directly with a payload matching the operation registry's `req` shape and asserts the `res` shape. Keep the command layer thin; unit-test the logic it delegates to in isolation.

The `users` slice ships with tests at all three levels as the reference pattern future features copy.

## Coding standards

- **Error handling.** Backend expected failures travel as a `Result` envelope, never thrown exceptions. Frontend failures fold to one `AppError` at the `NormalizingTransport` seam; nothing above it branches on the wire. See `docs/architecture/conduit.md`.
- **Types are generated, not hand-written.** Frontend DTOs come from the OpenAPI spec (`npm run codegen`); form model types are `z.infer<typeof schema>`. If you are typing a shape by hand that already exists at a boundary, stop and generate it.
- **UI follows the design system, tokens are not hand-written.** Production UI composes spartan helm components (`frontend/libs/ui/*`) and reads colour and radius from the `frontend/src/styles.css` custom properties (`--primary`, `--border`, `--radius`, …). Control size and spacing is not a token — the spartan style inlines `h-8`/`px-2.5` into `libs/ui` at generation time, so it changes with `npm run ui:style`, not with CSS. A literal hex or px in a component is the smell — the same DRY-at-a-boundary rule as types. For mocks, previews, and prototypes, use the `jig-design` skill (portable, buildless). The skill is a downstream mirror of the app, not a second source of truth: change the theme in `styles.css`, never fork the skill's CSS into production. See `docs/architecture/design.md` and ADR 0007.
- **Naming mirrors the app.** The .NET projects are `Jig.Api`, `Jig.Application`, `Jig.Domain`, `Jig.Infrastructure`; the Rust crate and Tauri identifier are `jig`; spartan helm components sit under the `@spartan-ng/helm/*` alias. `tools/init` rewrites all of these when the template is renamed to a new app.
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
 */
```

Rust (rustdoc): `/// @capability`, `/// @intent`, `/// @reuse`. C# (XML doc): `<capability>`, `<intent>`, `<reuse>`.

## The catalog is generated, never written

`.bob/registry/catalog.json` and `.bob/registry/CATALOG.md` are output of `tools/catalog`. Never hand-edit them.

- Regenerate: `npm run catalog`
- Verify freshness: `npm run catalog:check` (this is what the pre-commit hook and CI run; a stale catalog fails the build)

## Branching: work on a feature branch, never on main

All work happens on a feature branch. `main` takes no direct commits: it stays linear and integrates feature branches by pull request, so every unit of work reaches `main` as merged pull request. This is a hard gate, enforced by the `pre-commit` hook — a commit on `main`/`master` is refused, and a feature branch whose name breaks the convention is refused too.

Branch names follow the conventional-commit prefix: `type/kebab-description`. The `type` is one of the commit types below, matching the commit the branch will land as. Examples: `feat/design-system`, `fix/null-user`, `docs/branching-gate`, `refactor/collapse-seam`.

Start work with `git switch -c feat/<short-description>`. The one sanctioned commit on `main` is the template bootstrap `tools/init` makes; it sets `JIG_ALLOW_MAIN=1` to pass the gate. Nothing else should.

## Commits: Conventional Commits, enforced

Format: `type(scope): summary`.

- **Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.
- **Scopes (required):** `transport`, `forms`, `contracts`, `api`, `shell`, `catalog`, `tools`, `repo`.
- Enforced by the `commit-msg` hook via `commitlint` (`commitlint.config.mjs`). A malformed message is rejected, not merely discouraged.
- Commits land at green. The `pre-commit` hook blocks a commit if the catalog is stale or the tooling tests fail (the fast checks). The full `npm run verify` gate runs in CI on every push and PR (`.github/workflows/verify.yml`); run it yourself before pushing meaningful work.

Examples:
- Good: `feat(transport): add NormalizingTransport error seam`
- Good: `test(api): cover users.save validation failures`
- Rejected: `added transport stuff` (no type, no scope)

## Running the gates

- **The gate, one command:** `npm run verify` — the full build, all tests across .NET, Rust, and the frontend, plus catalog freshness. Green here is the definition of done, and commits land only here.
- **Fresh-clone bootstrap:** `npm run setup` (idempotent; checks the toolchain and all three language servers, installs dependencies, wires git hooks, generates the catalog).
- **Individual checks** when you want one slice: `npm run test:tools`, `npm run catalog:check`, `dotnet test services/api/Jig.sln`, `cargo test` (in `apps/desktop/src-tauri`), `npm --prefix frontend test` (Vitest), `npm --prefix frontend run e2e` (Playwright).

## Development loop

For iterative work, do not full-build after every change. Start the watchers and let compile errors come to you:

- `npm run dev` runs the Angular dev server (frontend HMR) and `dotnet watch` (backend hot reload) together, output line-prefixed `[web]` / `[api]`. Run it in the background and watch it for compile errors.
- **LSP is the type-check backup:** `workspace/symbol`, hover, and diagnostics catch type errors with no build at all.
- For the desktop shell (Rust + WebView), use `cargo tauri dev` instead; it opens a window, so it is on-demand.

This is the inner loop, not the gate. HMR being green means the code compiles, not that it is correct — it runs no tests. Run `npm run verify` before you commit. (In dev the frontend on `:4200` calling the API will hit CORS on live data; compile feedback is unaffected. Add CORS to the API if you want live cross-calls in the browser.)

## Adding a feature

Follow `.bob/prompts/new-feature.md` and copy the `users` slice end to end. Discover first (the prime directive in `CLAUDE.md`), annotate what you build, regenerate the catalog, commit at green.
