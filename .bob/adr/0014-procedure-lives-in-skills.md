# ADR 0014 — Procedure lives in skills, not in a prompt file

- Status: accepted
- Date: 2026-09-12
- Scope: `.claude/skills`, `.bob/prompts`
- Amends: ADR 0003, whose Tier 2 bullet "`.bob/prompts/new-feature.md` — the feature recipe." is amended by this record.

## Context

`.bob/prompts/new-feature.md` carried the step-by-step recipe for adding a whole vertical slice: contract, backend, Rust, frontend, annotate, commit. It was accurate and complete, and nothing ever loaded it. ADR 0003 tiered `CLAUDE.md`'s routing table to point at it on "Add a whole feature", but a routing-table row in a file an agent reads at the start of a session is not the same thing as automatic invocation — it only fires if the agent already recognizes the request as a whole-feature task and goes looking for the row. Automatic invocation is a property of a skill's `description` field and nothing else: Claude Code matches a task against every skill description on its own, before any file gets read. A prompt file has no such field, so it never entered that matching process. It sat in the repo, correct and complete, doing nothing.

## Decision

Procedure for a task an agent is about to perform lives in `.claude/skills/`, where a `description` field can trigger it automatically. `docs/architecture/*.md` keeps the reasoning behind a design — why the transport seam looks the way it does, why forms are schema-driven — read on demand from a skill or a routing-table row, but not the sequence of steps to execute. `.bob/prompts/new-feature.md` is deleted; its procedure was rebuilt as `add-a-feature` (the hub, owning the build order) plus `add-an-api-slice`, `add-a-tauri-command`, `add-a-view-model`, `add-a-screen`, and `add-a-form` (the spokes, one per layer), with `conduit` retrofitted to own the contract seam the hub used to describe inline.

This amends ADR 0003 rather than superseding it. ADR 0003's tiering stands: `CLAUDE.md` stays tier one, task-scoped detail stays disclosed on demand rather than always loaded. What changes is which tier owns procedure — a prompt file with a routing-table pointer is replaced by a skill with a triggering description, because only the latter is actually reachable without an agent already knowing where to look.

## Consequences

- `.claude/skills/` is no longer only reference material a routing-table row happens to point at; it is where an agent finds out how to do a task in the first place, whether or not `CLAUDE.md`'s table names it.
- The skills gate area is not inert the way the prompt file was. `tools/verify/skills.ts` (run via `npm run skills:check`) checks referential integrity: every repo-relative path a skill cites still resolves, and every lint rule a skill names is a real rule in the jig plugin. It is wired into `npm run verify` and the `pre-commit` hook's tooling-test pass, so a moved file or a renamed rule fails the gate instead of silently going stale the way the prompt file did.
- One property stays explicitly unchecked: whether a skill's `description` actually triggers on the requests it claims to. There is no honest machine test for this — a length floor or a "must quote a phrase" rule is gameable in one edit and would manufacture confidence the check has not earned. Trigger quality stays human-reviewed, the same way it was reviewed by hand when this plan's final verification step asked a fresh session to act on a natural-language request and checked which skill loaded.
- A future recipe that only reasoning, not action, belongs in `docs/architecture/`; a future recipe that is action an agent should take unprompted belongs in `.claude/skills/`. Putting the second kind in a prompt file recreates exactly the defect this ADR retires.
