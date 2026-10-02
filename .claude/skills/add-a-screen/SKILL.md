---
name: add-a-screen
description: Use when adding or changing a page in the app — a new route, a list or detail view, a sidebar or header entry, or the View half of an MVVM pair. Covers generating the list screen rather than writing it, the view-binds-only-to-the-ViewModel boundary, wiring a route, contributing a menu Command so the screen is reachable, and the control-flow and change-detection rules the linter enforces on every component. Reach for this on "add a screen", "add a page", "new route", "put it in the sidebar", "make it navigable", "the view for X", or before creating any *.view.ts under frontend/src/app/features/.
---

# Add a screen

## Where you are

The View half of the MVVM pair, plus the route and menu wiring that make it reachable. The ViewModel is this step's input, not its output — if it does not exist, build it with `.claude/skills/add-a-view-model/SKILL.md` first.

A slice's list screen is generated, not written: `npm run slice` emits the view, its ViewModel, their specs and the menu contribution, and wires the route and the icon. Come here for a second screen, a detail view, a screen with no slice behind it, or a change to a generated one.

## The shape to copy

`frontend/src/app/features/users/user-list.view.ts` and `users.commands.ts`, with their specs, are the exemplar and the generator's own output. The route table is `frontend/src/app/app.routes.ts`; the abstraction navigation is built on is `frontend/src/app/menu/navigate-command.ts`.

Navigation is a Command, not a hard-coded router link — `.bob/adr/0008-actions-are-commands.md` has the why: a region-keyed registry lets the sidebar and header stay ignorant of which features exist. A screen with a route and no Command is unreachable, which is the mistake this step exists to prevent.

## The sequence (TDD)

**1.** Failing view spec first, asserting what renders from the ViewModel's signals.
**2.** `cd frontend && npm test` — see it fail.
**3.** Write the view, binding only to the ViewModel — no direct data access, no feature service reached into from the template — and provide the ViewModel at the component.
**4.** See it pass.
**5.** Add the route in `app.routes.ts`, then the `*.commands.ts` contribution so the screen appears in the region-keyed menu.
**6.** `cd frontend && npm test` — see it pass.

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
