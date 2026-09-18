---
name: add-a-feature
description: Use when adding a whole vertical slice to this app — anything that needs backend data and a screen to show it. A slice is generated, not hand-written; this skill covers what to do before running the generator, what the generator cannot know, and which spoke owns each of those. Reach for this on "add a feature", "add users/orders/projects to the app", "new slice", "build X end to end", "I need a page that lists Y", or any request that will end up touching both the API and the UI. Read it BEFORE writing the first file, because writing a slice by hand in the order the file names invite produces hand-typed DTOs that compile and silently drift.
---

# Add a feature

A whole vertical slice is generated. `npm run slice` emits twenty-four files — the .NET layers and their tests, the contract, the screen, the form, the native store — edits nine registries, and leaves a tree that passes `npm run verify`. Do not hand-write a slice that the generator can emit.

This skill covers the three things around it: what to do before you run it, what it cannot know, and who owns each of those.

## Discover first

The CLAUDE.md prime directive, restated for a feature slice. The generator will not tell you that the capability already exists — it will happily emit a second one.

1. Read `.bob/registry/CATALOG.md` for the area you are about to touch.
2. LSP-search the concept via workspace-symbol before reaching for grep.
3. Reuse or extend what already exists; a second implementer of the same capability is a defect, not a shortcut.
4. If you still create something that overlaps, record why in an ADR under `.bob/adr/`.

The smell test for each of these is in `CONTRIBUTING.md`.

## Generate the slice

1. Copy `examples/slices/users.slice.json`, change the name, the icon and the fields.
2. `npm run slice -- --spec <file> --dry-run` to see what it would write and edit.
3. Commit or stash first — the generator refuses a dirty tree, because git is the only way back from twenty-four files and nine edits.
4. `npm run slice -- --spec <file>`, then `npm run verify`.

**Why this is a tool and not a checklist:** the generator runs in two phases with `npm run codegen` between them. A response type resolves to a generated DTO, so the API has to exist and codegen has to have run before a single line of the contract is written. Emitting both halves first produces TypeScript referencing DTOs the API has not emitted — it fails, but only after every file has landed. That ordering is the trap the generator exists to make unmissable.

## What the generator does not know

It emits CRUD: list, get, save, a list screen, a form over the spec's fields. Everything past that is yours, and everything past that is TDD in the literal sense — the failing test comes first.

| What you are adding | Spoke |
|---|---|
| Domain behavior beyond create/read/list, a new endpoint, a validator rule | `.claude/skills/add-an-api-slice/SKILL.md` |
| An operation the generator did not emit | `.claude/skills/conduit/SKILL.md` |
| A second screen, a detail view, different menu placement | `.claude/skills/add-a-screen/SKILL.md` |
| A field whose control kind does not exist yet | `.claude/skills/add-a-form/SKILL.md` |
| A ViewModel or capability service of your own | `.claude/skills/add-a-view-model/SKILL.md` |
<!-- thick:start -->
| A native command beyond the generated store | `.claude/skills/add-a-tauri-command/SKILL.md` |
<!-- thick:end -->

**Extend the generated tests; do not replace them.** They cover CRUD and they were written red-green-refactor against the emitters, one level up. `.bob/adr/0015-generated-slices-satisfy-tdd-at-the-generator.md` records why that satisfies the TDD gate and where the exemption stops.

**A generated file that is wrong is a generator bug.** Fix the emitter in `tools/slice/`, add its unit test, and regenerate. Editing the generated file means the next slice reintroduces the defect.

## Changing a slice that already exists

Skip everything above and go straight to the spoke that owns the layer you are touching.

## What the hooks will say

- `guard-ruleset` can deny a Write, Edit or Bash outright. It guards `ArchLayers.txt`, `tools/hooks/guard-ruleset.ts` and `services/api/src/Directory.Build.props`. A denial means fix the flagged code, never the rule.
- `check-frontend` returns lint violations with the rule's doc path attached, unasked, after every frontend write. Fix the code. `eslint-disable` does nothing — `noInlineConfig` is on — and stylelint runs with `--ignore-disables`.
- `angular-service-guide` nudges when a new `*.operations.ts`, `*.service.ts`, `*.transport.ts` or anything under capabilities/ is written. It means run the discover checklist before building on it.

## Before you commit

The generator refreshes the catalog itself. Anything you added by hand does not: annotate every new reusable unit with `@capability`, `@intent`, `@reuse` (the shape is in `CONTRIBUTING.md`) and run `npm run catalog`. Then `npm run verify`, and commit with a conventional message on a feature branch.
