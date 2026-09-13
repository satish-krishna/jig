---
name: add-a-screen
description: Use when adding or changing a page in the app — a new route, a list or detail view, a sidebar or header entry, or the View half of an MVVM pair. Covers the view-binds-only-to-the-ViewModel boundary, wiring the route, contributing a menu Command so the screen is reachable, and the control-flow and change-detection rules the linter enforces on every component. Reach for this on "add a screen", "add a page", "new route", "put it in the sidebar", "make it navigable", "the view for X", or before creating any *.view.ts under frontend/src/app/features/.
---

# Add a screen

## Where you are

This is step 6 of `.claude/skills/add-a-feature/SKILL.md`: the View half of the MVVM pair, plus the route and menu wiring that make it reachable. The ViewModel is the input to this step, not something it builds — if it does not exist yet, go build it with add-a-view-model before coming back here.

## Copy this

The `users` slice is the exemplar. Copy its shape rather than inventing a new one:

- View: `frontend/src/app/features/users/user-list.view.ts`
- View spec: `frontend/src/app/features/users/user-list.view.spec.ts`
- Menu contribution: `frontend/src/app/features/users/users.commands.ts`
- Menu contribution spec: `frontend/src/app/features/users/users.commands.spec.ts`
- Route table: `frontend/src/app/app.routes.ts`
- The Command abstraction navigation is built on: `frontend/src/app/menu/navigate-command.ts`

Navigation is a Command, not a hard-coded router link — see `.bob/adr/0008-actions-are-commands.md` for why: a region-keyed registry lets the sidebar and header stay ignorant of which features exist, and a screen becomes reachable purely by contributing a Command to it.

## The sequence (TDD)

**1.** Write the failing view spec first, asserting what renders from the ViewModel's signals.
**2.** Run `cd frontend && npm test` and see it fail.
**3.** Write the view, binding only to the ViewModel — no direct data access, no feature service reached into from the template — and provide the ViewModel at the component.
**4.** Run the test again and see it pass.
**5.** Add the route in `app.routes.ts`.
**6.** Add the `*.commands.ts` contribution so the screen appears in the region-keyed menu.
**7.** Run `cd frontend && npm test` and see it pass.

## What the hooks will say

`check-frontend` fires on every write under `frontend/src/`, hands back the violations with the offending rule's doc path attached, unasked. `eslint-disable` does nothing here — `noInlineConfig` is on.

## Rules that bite here

- `no-state-outside-view-model` — a view holds no state of its own; doc at `docs/architecture/rules/no-state-outside-view-model.md`.
- `no-unprovided-view-model` — a view's ViewModel is provided at the component, not left to resolve from an ancestor; doc at `docs/architecture/rules/no-unprovided-view-model.md`.
- `no-root-provided-view-model` — a feature ViewModel is not provided at the root injector; doc at `docs/architecture/rules/no-root-provided-view-model.md`.
- `no-feature-inject-data` — a view injects its ViewModel, never an operations facade or transport directly; doc at `docs/architecture/rules/no-feature-inject-data.md`.
- `no-component-subscribe` — no manual subscribe call in a component; bind to signals instead; doc at `docs/architecture/rules/no-component-subscribe.md`.
- `no-legacy-control-flow` — modern built-in control flow only, never the legacy structural directives; doc at `docs/architecture/rules/no-legacy-control-flow.md`.
- `no-hand-set-change-detection` — no manual change-detector calls; doc at `docs/architecture/rules/no-hand-set-change-detection.md`.
- `no-explicit-standalone` — components are standalone by default; do not restate it; doc at `docs/architecture/rules/no-explicit-standalone.md`.
- `no-ng-class-style` — no class or style directive bindings; bind the class and style properties directly; doc at `docs/architecture/rules/no-ng-class-style.md`.
- `no-style-attribute` — no inline style attribute; use tokens; doc at `docs/architecture/rules/no-style-attribute.md`.

## Before you commit

`npm run lint`, then `npm run verify`. Commit only at green.
