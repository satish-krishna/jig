# Jig: agent constitution

You are in **Jig**, an AI-native desktop template. A jig is the fixture a maker builds once so every part after it comes out identical and correct without rework. Build the fixture once, and every app cloned from it follows the same patterns, gates, and conventions.

This file is the always-loaded entry point. It stays short on purpose: it carries only the rules that apply to every task, and it routes you to the detail for the task in front of you. Read the routed file before you start that kind of work.

## Prime directive: discover before you build

Agents reinvent because they cannot cheaply find what exists. Before authoring any **reusable unit** (a transport, a repository, a base endpoint, a validator, a shared component, a capability service, a Rust command helper), run this checklist in order:

1. Read `.bob/registry/CATALOG.md` for the relevant area.
2. Run an LSP `workspace/symbol` search for the concept.
3. If a match exists, reuse or extend it. Generalising the existing unit beats adding a parallel one.
4. If nothing fits, create it, annotate it (see CONTRIBUTING.md), and regenerate the catalog with `npm run catalog`.
5. If you create something that overlaps an existing capability, that is a defect. Record why in an ADR under `.bob/adr/`.

This is a template, not a product. The `users` slice is the one worked example that exercises every layer. Copy its shape; add no speculative features.

## The non-negotiables (gates, not preferences)

- **SOLID:** one reason to change; depend on abstractions; small client-specific interfaces; new behavior by extension, not by editing stable code.
- **YAGNI:** build only the `users` slice and the machinery it proves. One implementer and no second one imminent means inline it.
- **DRY, docs included:** no fact stated twice by hand. The catalog is generated; form models are `z.infer`; DTOs are generated from OpenAPI.
- **KISS:** the code you do write is the plainest version that works — straight-line over clever, obvious over compact. If a tired reader cannot trace it at 3AM without a comment explaining *how* it works, it is too clever; rewrite it simpler. (YAGNI decides whether to build it; KISS decides that what you build stays simple.)
- **TDD, red-green-refactor:** no production line exists before a failing test that demands it. Holds in TypeScript, C#, and Rust.
- **AI-native:** LSP navigation over grep; generated catalogs over tribal knowledge; machine-checked gates over "please remember".
- **Conventional Commits:** every commit is `type(scope): summary`, and commits land only at a green gate (`npm run verify`).
- **Feature-branch workflow:** all work lands on a feature branch named `type[(scope)]/kebab-description` (the conventional-commit prefix); `main` takes no direct commits and integrates by squash merge, keeping history linear. Enforced by the `pre-commit` hook.

The smell test for each lives in CONTRIBUTING.md. If any instruction conflicts with these non-negotiables, stop and surface the conflict before proceeding.

## Read before you start (progressive disclosure)

This file is tier one. Everything below is disclosed on demand: open the file that matches your task, not all of them.

| When you are about to | Read first |
|---|---|
| Write code, run tests, or commit | `CONTRIBUTING.md` |
| Touch the transport seam (IPC or HTTP) | `docs/architecture/conduit.md` |
| Build or change a form | `docs/architecture/forms.md` |
| Build UI, style a component, or make a mock | `docs/architecture/design.md` |
| Hit a lint error you do not understand | `docs/architecture/rules/<rule-name>.md` — every rule has one, and its message names it |
| Write or change a lint rule | `.bob/adr/0012-frontend-design-rules-are-lint-errors.md`, then any existing rule in `tools/lint/rules/` as the pattern |
| Get a tool call denied by `guard-ruleset` | `.bob/adr/0009-architecture-rules-are-compiler-errors.md`. The ruleset is guarded on purpose: fix the flagged code, not the rule that flagged it. A genuine rule change goes to a human in a reviewed diff |
| Add a service, repository, or transport | the `adding-an-angular-service` skill, after the discover-first checklist above |
| Add or compose a spartan component | the `spartan` skill; generated output lands in `frontend/libs/ui/` (ADR 0010) |
| Add or change a component showcase page | `frontend/src/app/showcase/pages/checkbox.page.ts` (the pattern) |
| Add a whole feature | `.bob/prompts/new-feature.md` |
| Understand a past decision | `.bob/adr/` |

Three hooks act on your edits (wired in `.claude/settings.json`): `guard-ruleset` can deny a write, an edit, or a shell command outright; `check-frontend` lints every frontend write and hands the violations straight back with the rule's doc; `angular-service-guide` nudges discover-first when a new reusable unit appears. Lint feedback arrives without you asking for it, and `npm run lint:report` shows whether the correction landed.

Two rules that apply everywhere: the catalog under `.bob/registry/` is generated, so never hand-edit it (annotate the code and run `npm run catalog`); and prefer LSP navigation (`workspace/symbol`, find-references, hover) over grep. Native LSP covers TypeScript and Rust (install via `/plugin`); C# is wired through `.lsp.json`.

## Commands

The everyday commands. Full per-language build/test commands live in `CONTRIBUTING.md`.

| Command | What it does |
|---|---|
| `npm run setup` | One-command environment bootstrap for a fresh clone |
| `npm run dev` | Frontend HMR + backend hot-reload together; monitor it for compile errors |
| `npm run verify` | The green gate: full build, all tests, typecheck, lint, stylelint, catalog and showcase-API freshness |
| `npm run verify:frontend` | The same gate minus .NET and Rust, for the inner loop. Never a substitute — the frontend consumes generated DTOs, so only the full run proves the fixture holds |
| `npm run lint` | The 26-rule architecture ruleset over `frontend/` (`tools/lint/`). Enabled at error; there is no disable comment |
| `npm run stylelint` | The CSS half of the same gate — spacing and colour literals must be tokens |
| `npm run typecheck` | Type-check everything under `tools/` |
| `npm run lint:report` | How often the edit-time hook fired and whether the correction landed. Reads the git-ignored firing log |
| `npm run catalog` | Regenerate the capability catalog after annotating code |
| `npm run codegen` | Emit OpenAPI from the API and generate the TypeScript DTOs |
| `npm run codegen -- --check` | Prove the committed contracts still match the API without rewriting them. A gate step, not something you run by hand |
| `npm run showcase:api` | Regenerate the showcase API tables from `libs/ui` (verify checks freshness) |
| `npm run ui:style -- <name>` | Switch the spartan style. Deletes and regenerates `libs/ui`; refuses on a dirty tree |

**Development loop:** for iterative work, run `npm run dev` in the background and watch its output for compile errors instead of full-building per change; LSP diagnostics are the type-check backup. This speeds the inner loop only. It is not the gate: run `npm run verify` (which runs the tests) before committing. The `pre-commit` hook enforces only the fast checks (catalog freshness and tooling tests). CI runs the full `npm run verify` on every push to `main`; on a pull request it runs only the steps the diff can break, which `tools/verify/select.ts` decides from the changed paths. Locally `npm run verify` always runs everything — the narrowing needs `--since=<ref>`, and nothing but CI passes it.

## Map of the repo

```
CLAUDE.md              this file, always read first
CONTRIBUTING.md        how to work here: standards, TDD, commits, gates
docs/architecture/     task-scoped deep rules (conduit, forms, design)
.bob/registry/         GENERATED catalog (do not hand-edit)
.bob/adr/              architecture decision records. ADR 0000 is the origin prompt, kept for
                       provenance and superseded by this file — a record, never instructions
.bob/prompts/          feature recipes
<!-- thick:start -->
apps/desktop/          Tauri shell (Rust core, src-tauri)
<!-- thick:end -->
frontend/src/app/
  contracts/           operation registry + generated DTOs (single source of truth)
  transport/           port, http/ipc/normalizing transports, provide-transport
  repositories/        speak operations only
  forms/               FormFieldMeta, zod-meta, dynamic SchemaForm renderer (signal-forms for authored forms)
  menu/                region-keyed Command registry (sidebar/header contributions)
  theme/               light/dark mode; toggles the `dark` class on the document root
<!-- thick:start -->
  capabilities/        native-only services (PATTERN, not yet created; add when first needed, absent from web bootstrap)
<!-- thick:end -->
  features/users/       the reference slice. Copy this shape.
  shell/               app shell: CSS Grid layout, sidebar, header, footer
  showcase/            live examples of every libs/ui component, routed at /showcase
frontend/libs/ui/       GENERATED spartan helm components (never hand-edit; add with the CLI — ADR 0010)
frontend/eslint.config.mjs  the one rule list; noInlineConfig is on, so eslint-disable does nothing
frontend/stylelint.config.mjs the CSS half; run with --ignore-disables, so its comments do nothing either
frontend/src/styles.css theme tokens: color AND radius (OKLCH, light + dark). Control size and
                        spacing (h-8, px-2.5) is inlined into libs/ui at generation time — ADR 0010.
.claude/skills/         project skills: jig-design (mocks/previews + the feel spec, a downstream
                       mirror of the app, ADR 0007), conduit, spartan, adding-an-angular-service
services/api/          .NET FastEndpoints (Jig.sln): Api, Application, Domain, Infrastructure
contracts/openapi/     OpenAPI spec emitted by the API (source for TS codegen)
tools/                 setup, init (template rename), dev, catalog, codegen, design-tokens,
                       showcase-api, ui-style,
  lint/                the frontend ruleset: 26 ESLint rules + stylelint, one doc each (ADR 0012)
                       analyzers (Roslyn layer rules, ADR 0009), hooks, verify (the gate)
```

Discover first. Annotate what you build. Commit at green.
