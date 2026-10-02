# ADR 0016 — Emitted slice text lives in EJS templates, not template literals

- Status: accepted
- Date: 2026-09-30
- Scope: tools/slice

## Context

The five emitters in `tools/slice/` (one each for .NET services, .NET tests, frontend, frontend tests, and Rust) held about 1,700 lines of template literals, each encoding the text shape of a whole file.

The design spec rejected Plop and Hygen because their templates are "a language the linter cannot parse"; the same objection applied here. Nx was considered as a way to obtain a template folder and a build step to feed it, but it is a monorepo build system against the repo's `node tools/x.ts` idiom.

## Decision

Emitted text lives in `tools/slice/templates/**/*.ejs`, rendered by `tools/slice/render.ts` with EJS. Templates hold layout only. Which fields appear, which blocks appear, and every computed fragment are decided in typed TypeScript model builders; templates iterate and branch only on model values. Injectors, spec validation, the CLI, and the emitter functions all remain code.

## Why the old objection no longer holds

ADR 0015 built `slice --check`, a golden test that renders the `users` exemplar and compares it against the committed baseline on every `npm run verify`. The emitter tests (`tools/slice/emit-*.test.ts`) and `acceptance.test.ts` cover other spec shapes. A template that emits broken code for the `users` shape fails the gate, because that output is compiled, linted, and tested as real code; for other shapes the emitter tests check the rendered text and the acceptance test parses it.

## What it costs, and how each cost is contained

Templates lose `tsc` checking of their substitutions in the template syntax itself. This is contained by the strict proxy in `render.ts`, which throws on a misspelled model key, naming the key — the same defense as a type error, one step later. EJS has a `<%=` tag that HTML-escapes output (rejecting `<`, `>`, and `&`); the renderer forbids it outright and exits with an error. Windows line endings (CRLF) are normalized to LF by the renderer before passing to EJS. EJS 6 copies the data object by default unless `unsafePrototypeLocals: true` is set; this keeps the strict proxy in effect. With `strict: true` and `_with: false`, no `with()` is generated, so the prototype-pollution risk EJS documents for that option does not apply; models are built in TypeScript, never from untrusted input.

## Consequences

- The body of `emit-rust.ts` sits inside thick markers; only its header comment, which names no desktop-shell vocabulary, sits above them. The `store.rs.ejs` template is deleted whole through `THIN_DELETE` in `tools/init/thin.ts` and carries no Rust or Tauri vocabulary in the thin residue.
- The catalog does not scan `.ejs` files. Capability annotations in the emitted files (the templates' output) reach the catalog through the committed `users` exemplar, not through the `.ejs` source.
- A change to generated text is now a template edit plus a regenerated `users` exemplar, which the golden test demands on the next `npm run verify`. The migration from template literals to templates was validated by rendering a seven-case matrix against the live slices and asserting byte-identical output.

## Per-field list rule

Blocks of per-field lines become template `for` loops when each line has a fixed shape with field-dependent substitutions. An inline separator-joined list of short value fragments — such as comma-joined arguments or sample values — may be joined in TypeScript or looped inline; both patterns are in use and both are acceptable.
