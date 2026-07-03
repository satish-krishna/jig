# ADR 0006 — Forms use Angular signal-forms + spartan helm, with the zod schema as the single source of truth

- Status: accepted (supersedes the earlier "spartan deferred" decision)
- Date: 2026-07-03
- Scope: `forms`

## Context

The initial build deferred spartan-ng (Tailwind setup risk during an unattended run) and shipped a generic reactive-forms renderer. With Node upgraded and spartan requested as non-negotiable, forms were reworked onto Angular **signal-forms** (`@angular/forms/signals`) with **spartan helm** controls. The open question was how to keep zod as the single source of truth when signal-forms' native validators are programmatic (`required()`, `validate()`).

## Decision

- **zod stays the single source of truth.** Angular signal-forms ships `validateStandardSchema(path, schema)`, and zod 4 schemas are Standard Schema compliant, so the zod schema validates the form natively. No validation rule is restated. The schema's `.meta()` still carries field labels (read via `formMeta`).
- **Forms are per-feature components, not one generic renderer.** signal-forms is built around statically-typed field paths (`form.name`), which a fully-dynamic renderer fights. The reference `UserForm` binds each field with `[formField]="form.name"` and a spartan `hlm-field` / `hlmInput`; a new feature copies its shape and swaps the schema.
- **spartan is installed via the CLI copy model.** Helm components live in `frontend/libs/ui` behind the `@spartan-ng/helm/*` tsconfig alias; `vite-tsconfig-paths` makes Vitest resolve the same alias.

## Consequences

- Every DRY win is kept: the model is `z.infer`, validation is the one zod schema (native, not mirrored), and labels come from `.meta()`. Only the generic-renderer component is gone, replaced by copyable per-feature forms — the grain signal-forms is designed for.
- Errors display is gated on `touched()` so validation does not shout on first paint; `submit()` runs the action only when the schema passes.
- Adding a control kind or restyling is a spartan-helm change in `libs/ui`, owned in the repo.
- The spartan MCP (`.mcp.json`) and skill (`.claude/skills/spartan`) are wired so future agents get spartan project context and component APIs.
