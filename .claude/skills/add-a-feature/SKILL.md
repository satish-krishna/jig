---
name: add-a-feature
description: Use when adding a whole vertical slice to this app — anything that needs backend data and a screen to show it. Covers the order the layers must be built in and the handoffs that bite, then hands each layer to its own skill. Reach for this on "add a feature", "add users/orders/projects to the app", "new slice", "build X end to end", "I need a page that lists Y", or any request that will end up touching both the API and the UI. Read it BEFORE writing the first file, because the contract cannot be written until the API exists and codegen has run — doing it in the natural reading order produces hand-typed DTOs that compile and silently drift.
---

# Add a feature

This skill owns the build order for a whole vertical slice, backend data through to the screen that shows it, and hands each layer to its own spoke skill so this file never repeats their content. The order below is not the one you would reach for by reading top to bottom, because a response type only exists once the API is built and codegen has run against it.

## Where you are

This skill covers the whole slice, front to back; if you only need one layer, skip straight to that spoke instead of working through every step below — add-an-api-slice, add-a-screen, add-a-form, or add-a-view-model.

## Discover first

The CLAUDE.md prime directive, restated for a feature slice:

1. Read `.bob/registry/CATALOG.md` for the area you are about to touch.
2. LSP-search the concept via workspace-symbol before reaching for grep.
3. Reuse or extend what already exists; a second implementer of the same capability is a defect, not a shortcut.
4. If you still create something that overlaps, record why in an ADR under `.bob/adr/`.

The smell test for each of these is in `CONTRIBUTING.md`.

## The order

Discover (above) is the prerequisite, not a build step, so numbering here starts at 1. Each item states its own step number as text rather than relying on list auto-numbering, because an ordered list renumbers sequentially from whichever item renders first — the thin cut removes step 4 entirely, and a renumbered list would silently relabel "step 5" as "step 4" for a thin-client reader.

- **Step 1:** .NET slice: domain → application + `Result<T>` → infrastructure → endpoint, TDD at each step — owner: add-an-api-slice
- **Step 2:** `npm run codegen` — DTOs regenerate. **The trap.** Nothing downstream exists without it — owner: hub
- **Step 3:** Contract: `operations.ts` + `registry.ts` `ROUTES` — owner: `.claude/skills/conduit/SKILL.md`

<!-- thick:start -->
- **Step 4:** Rust command matching the registry, TDD (thick only) — owner: add-a-tauri-command
<!-- thick:end -->

- **Step 5:** Data access: `UserOperations` facade, then a ViewModel exposing signals — owner: `.claude/skills/conduit/SKILL.md`, add-a-view-model
- **Step 6:** Screen: view + route + menu command contribution — owner: add-a-screen
- **Step 7:** Form, when the feature has one: zod schema → `z.infer` → `SchemaForm` — owner: add-a-form
- **Step 8:** Annotate every reusable unit, then `npm run catalog` — owner: hub
- **Step 9:** `npm run verify`, conventional commit, feature branch — owner: hub

<!-- thick:start -->
Step 3 also fills in `registry.ts`'s `COMMANDS` map, one entry per operation, so the IPC wire has a command to call.
<!-- thick:end -->

```mermaid
flowchart TD
    A[.NET slice] --> C[npm run codegen]
    C --> R[Contract: operations + registry]
    R --> O[UserOperations + ViewModel]
    O --> S[Screen: view, route, menu]
    S --> F[Form, if any]
    F --> N[Annotate + catalog]
    S --> N
    N --> G[verify, commit at green]
```

<!-- thick:start -->
Thick clients insert step 4 between the contract and data access: a Rust command matching the registry, owned by add-a-tauri-command, TDD at each step.
<!-- thick:end -->

The trap is step 2. Response types resolve to generated DTOs, so the API shapes exist first, `npm run codegen` runs second, and the contract is written third. Writing the contract first, the order the file names invite, produces a hand-typed interface that compiles and quietly drifts from the API it claims to describe.

## What the hooks will say

- `guard-ruleset` can deny a Write, Edit or Bash outright. It guards `ArchLayers.txt`, `tools/hooks/guard-ruleset.ts` and `services/api/src/Directory.Build.props`. A denial means fix the flagged code, never the rule.
- `check-frontend` returns lint violations with the rule's doc path attached, unasked, after every frontend write. Fix the code. `eslint-disable` does nothing — `noInlineConfig` is on — and stylelint runs with `--ignore-disables`.
- `angular-service-guide` nudges when a new `*.operations.ts`, `*.service.ts`, `*.transport.ts` or anything under capabilities/ is written. It means run the discover checklist before building on it.

## Before you commit

Annotate every new reusable unit with `@capability`, `@intent`, `@reuse` (the shape is in `CONTRIBUTING.md`), run `npm run catalog`, run `npm run verify`, then commit with a conventional message on a feature branch.
