# ADR 0008 — Actions the shell surfaces (menu and header) are Commands

- Status: accepted
- Date: 2026-07-05
- Scope: shell

## Context

The app-shell feature introduced one `Command` interface and a region-keyed `MenuService`: navigation items are commands that wrap the Angular Router, header actions are commands that own their data, and both register at runtime and auto-dispose on the caller's `DestroyRef`. The mechanics live in the design spec at `docs/superpowers/specs/2026-07-03-app-shell-command-menu-design.md`.

That spec is the right home for the wiring, but the wrong home for the principle. It is explicitly scoped to the feature ("scope stops at two `users` commands") and it is a dated `docs/superpowers/specs/` artifact — the same scaffolding class as the implementation plans we no longer check in. Nothing in it commits the template to a standing rule. Without one, a future module can wire an ad-hoc button into the sidebar or header that bypasses the `Command` contract, and the shell loses the single action model that lets it render its own surfaces. That is a consistency (DRY) erosion at the shell boundary, and consistency there is a gate.

## Decision

- **Every action a feature surfaces through the shell is a `Command` dispatched through `MenuService`.** The shell's action surfaces are its sidebar navigation items and its header/toolbar buttons. If it appears in the menu or the header, it is a command — there is no "too simple for a command" exception for those surfaces.
- **The rule stops at the shell boundary. It does not reach inside a module.** A logic-heavy module's own internal interactions — a canvas, a drag surface, a streaming view, in-view controls and buttons that belong to the module's body — use whatever shape fits. They are not forced through the `Command` interface. The rule governs what a feature contributes to the shell, not how it behaves once you are inside the module.
- **Navigation commands wrap the Router.** The URL is the source of truth; active state is a computed signal derived from `router.url`, never stored on the command, and routing guards are never bypassed.
- **Shell commands own their data**, expose `canExecute` as a reactive `Signal<boolean>`, and register at runtime with auto-unregistration on `inject(DestroyRef)` — no manual `ngOnDestroy` cleanup.
- **The shell renders its regions from `MenuService` only.** It never hard-codes a nav item or a header action.

## Consequences

- One action model for the shell's surfaces. A feature is discoverable by the commands it registers into the menu and header, and every such action is testable the same way — against a fake `MenuService`.
- The boundary is deliberate. Forcing *every* in-module interaction through commands would break on the first case where the shape is wrong — a canvas, a drag gesture, a streaming control. Scoping the rule to the shell's surfaces keeps the consistency where it pays and stays out of the module's body where it would not.
- A trivial menu or header action still wears the command shape (`id`, `label`, `canExecute`, `execute`). Accepted for shell surfaces: the uniformity is what lets the shell render and test them the same way, and it is what stops each feature from wiring bespoke chrome.
- The design spec stays the reference for the mechanics; this ADR is the standing rule. When they disagree, this ADR governs the principle and the spec governs the wiring detail.
- Scope is the frontend presentation layer only. The transport seam, repositories, and the .NET API are unaffected.
