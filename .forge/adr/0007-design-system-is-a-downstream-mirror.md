# ADR 0007 — The jig-design system is a downstream mirror of the app, not a second source of truth

- Status: accepted
- Date: 2026-07-03
- Scope: forms

## Context

A design system was added as the `jig-design` skill (`.claude/skills/jig-design`): portable CSS tokens, component classes, React primitives, layout shells, and foundation specimens. It exists so agents can produce pixel-accurate jig mocks, previews, and slides without an Angular/Tailwind build. Apps cloned from this template inherit it.

The skill is a *reproduction* of the real frontend — its tokens are translated from `frontend/src/styles.css` and its component classes from the spartan `hlm-*` directives in `frontend/libs/ui/*`. That creates a directionality question the naive instruction "use the design system" gets wrong: if UI work treats the skill as the source of truth, the theme now has two homes (the skill's `css/*` and the real `styles.css`), and they drift. That is a DRY violation, and DRY is a gate.

## Decision

- **Production UI has one source of truth: spartan helm + `frontend/src/styles.css`.** Views compose from `frontend/libs/ui/*`; all visual values come from the `styles.css` custom properties. No literal hex/px, no forking the skill's CSS into the app.
- **The `jig-design` skill is the prototyping surface and the canonical statement of the design *language*.** Mocks, previews, and slides are built from it (one `styles.css` import, no build). The visual rules with their rationale — neutral OKLCH grayscale, 32px density, radius 0, hairlines over shadow, terse lowercase copy — live in its readme and `foundations/`, where `styles.css` only holds numbers.
- **The app is upstream; the skill mirrors it.** When the two disagree, `styles.css` / `libs/ui` win. Theme changes are made in the app; the skill is regenerated to follow, never edited to drive the app's look.
- **Routing.** `docs/architecture/design.md` carries the rule; `CLAUDE.md` routes UI / design / mock work there, and `CONTRIBUTING.md` states the no-hardcoded-token standard.

## Consequences

- One theme, one home. The skill can be regenerated from the app without a merge conflict of intent, and an agent "fixing a color" in the skill does not silently ship a divergent app theme.
- Mock work is fast and buildless; promotion to production is an explicit rebuild in spartan + `styles.css`, not a wiring of the prototype bundle.
- The design language becomes a machine-discoverable gate (the feel list in `design.md`) rather than tribal taste — consistent with AI-native.
- Cost: the skill's mirrored tokens can lag the app after a theme change. Accepted; the skill is a preview aid, and its readme already names `styles.css` / `hlm-*` as ground truth.
