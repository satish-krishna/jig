# ADR 0003 — Documentation is tiered for progressive disclosure

- Status: accepted
- Date: 2026-07-02
- Scope: `repo`

## Context

`CLAUDE.md` is loaded into every agent's context on every turn. When it carried the full coding standards, per-language TDD mechanics, Conduit rules, and form rules, every agent paid that token and attention cost regardless of the task, and an agent fixing a typo waded through transport asymmetries it would never touch. A fat always-on file is skimmed, not read.

## Decision

Tier the documentation so each agent reads only what its task needs.

- **Tier 1 — `CLAUDE.md` (always loaded):** identity, the prime directive and discovery gate, the six non-negotiables as one-liners, a routing table, and the repo map. Nothing task-scoped.
- **Tier 2 — routed on demand:**
  - `CONTRIBUTING.md` — coding standards, smell tests, TDD per language, commit conventions, gate commands, annotation and catalog workflow.
  - `docs/architecture/conduit.md` — the transport seam rules, read before touching transport, contracts, or repositories.
  - `docs/architecture/forms.md` — schema-driven form rules, read before building a form.
  - `.forge/prompts/new-feature.md` — the feature recipe.

The load-bearing element is the routing table in `CLAUDE.md`: a "when you are about to X, read Y" trigger for each tier-2 doc. Disclosed docs with no trigger are just hidden docs.

## Consequences

- The always-on context cost drops to the universal rules plus pointers.
- Conduit and forms are separate files rather than sections of `CONTRIBUTING.md`, so a backend-only agent never loads form rules. This is progressive disclosure applied consistently, at the cost of more files to keep in sync.
- New task-scoped rules get a new tier-2 doc and a routing-table row, never a paragraph bolted onto `CLAUDE.md`.
