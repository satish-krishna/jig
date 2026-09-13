---
name: add-a-tauri-command
description: Use when adding or changing a Tauri IPC command in the desktop shell — the Rust side of an operation the Angular app invokes. Covers the store-and-command split, matching the command name and payload to the operations registry, registering it in lib.rs, and testing the store rather than the command. Reach for this on "add a Tauri command", "Rust command", "IPC", "invoke", "src-tauri", "the desktop side of X", or before editing apps/desktop/src-tauri/src/.
---

# Add a Tauri command

## Where you are

This is step 4 of `.claude/skills/add-a-feature/SKILL.md`, thick clients only: a Rust command matching the operations registry, inserted between the contract (step 3) and data access (step 5). The registry already names the command and the `req`/`res` shapes by the time you get here — this skill's job is to make the Rust side satisfy them, not to invent new ones.

## Discover first

The CLAUDE.md prime directive, for this layer:

1. Read `.bob/registry/CATALOG.md` for the `shell.*` capability prefix — that is the Rust half of the catalog, and the fastest way to see what stores already exist under `apps/desktop/src-tauri/src/`.
2. LSP-search the concept via workspace-symbol before reaching for grep.
3. Reuse or extend what already exists; a second store for the same entity is a defect, not a shortcut.
4. If you still create something that overlaps, record why in an ADR under `.bob/adr/`.

## Copy this

The `users` slice is the exemplar. Copy its shape rather than inventing a new one:

- The store, holding the logic: `apps/desktop/src-tauri/src/users.rs`
- The thin command adapters over it: `apps/desktop/src-tauri/src/commands.rs`
- Registration in the Tauri builder: `apps/desktop/src-tauri/src/lib.rs`
- The mapping this command must preserve, in depth: `.claude/skills/conduit/references/rust-command-side.md`

The split is deliberate and it is the point of this skill: a store holds the use-case and is unit-tested in isolation, and a `#[tauri::command]` is a thin adapter that derefs the managed store and stringifies its error into a rejected `invoke`. Put logic in the command and you have nowhere to unit-test it without spinning up a Tauri runtime.

## The sequence (TDD)

**1.** Write the failing store test first, in the shape of the `#[cfg(test)] mod tests` block in `apps/desktop/src-tauri/src/users.rs`, calling the store directly with the same payload shape the operations registry's `req` names.
**2.** Run `cargo test` from `apps/desktop/src-tauri` and see it fail.
**3.** Add the store method, returning a typed error rather than a string.
**4.** Run `cargo test` again and see it pass.
**5.** Add the thin `#[tauri::command]` adapter in `commands.rs` that derefs the managed store and maps its error to a rejected `invoke` with `.map_err(|e| e.to_string())`.
**6.** Register the command in `tauri::generate_handler!` in `lib.rs`.
**7.** Confirm the command name and its `req`/`res` shapes match the `COMMANDS` table and `Operations` map in `frontend/src/app/contracts/registry.ts` — a mismatched name compiles on both sides and fails only at runtime, so check it by eye.

## Before you commit

Annotate the store with the rustdoc form — `@capability`, `@intent`, `@reuse` — then run `npm run catalog` so the annotation surfaces in `.bob/registry/CATALOG.md`, then `npm run verify` for the full gate. Commit only at green.
