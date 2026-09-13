---
name: add-a-view-model
description: Use when adding or changing a ViewModel, a capability service, or any @Injectable under frontend/src/app that is not a view. Covers where state lives (signals on the ViewModel, never in the component), how a ViewModel is provided (at the component, never in root), the inject() and signals conventions the codebase follows, and which folder a new unit belongs in. Reach for this on "add a view model", "where does this state go", "add a service", "inject a dependency", "the component is holding state", "add a capability", or before creating any *.view-model.ts or *.service.ts under frontend/src/app.
---

# Add a ViewModel or service

Two things go wrong when an agent adds an Angular ViewModel or service: it rebuilds a capability that already exists because it could not cheaply find it, and it puts the new unit in the wrong layer so a seam leaks. This skill is the discover-first checklist for the first and the placement-and-shape rules for the second.

## Where you are

This is step 5 of `.claude/skills/add-a-feature/SKILL.md`: the ViewModel that sits between the operations facade and the View, exposing signals for the View to bind to. The facade it injects is built by `.claude/skills/conduit/SKILL.md`, not by this skill.

## Discover first

This is the CLAUDE.md prime directive, made concrete for the frontend. Run it in order before writing a new reusable unit:

1. **Read the catalog.** Open `.bob/registry/CATALOG.md` and scan the area — ViewModels, capabilities, shared components. It is generated from `@capability` annotations, so it is the fastest index of what already exists.
2. **LSP-search the concept, do not grep.** Use the LSP workspace-symbol search for the noun you are about to introduce (the entity, the operation, the capability). Find-references on a near-match tells you whether to extend it.
3. **Reuse or extend before creating.** Generalizing the existing unit beats adding a parallel one. A second ViewModel that exposes the same state, or a second service that wraps the same capability, is a DRY defect.
4. **If nothing fits, create it and annotate it.** Add the `@capability`, `@intent`, `@reuse` annotations (copy the shape from `frontend/src/app/operations/user.operations.ts`), then run `npm run catalog`. An un-annotated unit is invisible to the next agent, which is how the reinvention starts again.
5. **If you created something that overlaps an existing capability, that is a defect.** Record why in an ADR under `.bob/adr/`.

## Which unit is this, and where does it live

Pick the layer by what the thing actually does. Putting a unit in the wrong folder is how a seam leaks.

The operations facade that speaks typed operations to the backend (list users, save user) is not this skill's concern — it belongs to `.claude/skills/conduit/SKILL.md`.

| It... | is a | lives in |
|---|---|---|
| is the wire itself (HTTP, IPC, error normalizing) | **transport** | `frontend/src/app/transport/` — you almost never add here |
<!-- thick:start -->
| wraps a native-only ability (filesystem, OS keychain, notifications) | **capability** | a capabilities folder under `frontend/src/app/`. It does not exist yet (see CLAUDE.md's map) — create it when the first capability needs one |
<!-- thick:end -->
| holds a screen's state and view logic, exposed as signals | **ViewModel** | `frontend/src/app/features/<slice>/*.view-model.ts` |
| is reused UI with no data access | **shared component** | the `ui` library / feature-agnostic component folder |

The `users` slice is the worked example for every one of these. Copy its shape rather than inventing a new one.

## Shape: how a jig injectable is written

- **`inject()` over constructor DI.** The codebase uses the `inject()` function, not constructor parameters. Match it.
- **Signals for state.** Reactive state is a `signal` / `computed`, exposed read-only, and it lives on the ViewModel — never on the component. No `BehaviorSubject` for local state.
- **Provided at the component, never in root.** A ViewModel is scoped to the component that owns the screen, so each instance of the screen gets its own state.
<!-- thick:start -->
- **A capability is provided only in the native bootstrap.** The web bootstrap leaves it out, so a browser build cannot inject something only the desktop shell can do. ViewModels that need it inject it; the rest never see it.
<!-- thick:end -->
- **A colocated `*.spec.ts`, written first.** TDD is a non-negotiable here — the failing test exists before the class does.

## What the hooks will say

- `angular-service-guide` (`tools/hooks/angular-service-guide.ts`) is the one hook that names this skill, and this is the only area it fires in. It runs after a Write of a new `*.operations.ts`, `*.repository.ts`, `*.service.ts` or `*.transport.ts` under `frontend/src/app/`, or of any file in a capabilities folder there, and hands back a reminder as extra context — it never blocks, and it stays silent on Edit so an iteration loop is not nagged. The reminder says to run discover-first, annotate the new unit with `@capability`, run `npm run catalog`, and confirm the unit sits in the right layer and crosses no seam. The correct response is to do that before writing anything on top of the new unit, not to acknowledge it and carry on.
- `check-frontend` returns lint violations with the offending rule's doc path attached, unasked, after every write under `frontend/src/`. Fix the code. `eslint-disable` does nothing — `noInlineConfig` is on.

## Rules that bite here

- `no-state-outside-view-model` — a component holds no state of its own; doc at `docs/architecture/rules/no-state-outside-view-model.md`.
- `no-unprovided-view-model` — a ViewModel is provided at the component, not left to resolve from an ancestor; doc at `docs/architecture/rules/no-unprovided-view-model.md`.
- `no-root-provided-view-model` — a feature ViewModel is not provided at the root injector; doc at `docs/architecture/rules/no-root-provided-view-model.md`.
- `no-component-subscribe` — no manual subscribe call in a component; bind to signals instead; doc at `docs/architecture/rules/no-component-subscribe.md`.

## Seams a service must not cross

These are the boundaries the architecture depends on. Crossing one is the kind of thing the analyzer and the transport design exist to prevent:

<!-- thick:start -->
- **A ViewModel talks to the operations facade, never to a concrete wire.** Do not `import` `HttpTransport` or `IpcTransport` into a ViewModel — inject the facade.
- **`isTauri()` is called in exactly one place: `provide-transport.ts`.** A service that branches on `isTauri()` has pulled the two-wire decision out of its one home. Read `docs/architecture/conduit.md` before touching the transport seam.
<!-- thick:end -->
- **Request and response shapes come from the contracts registry**, not hand-written interfaces. Response types are the OpenAPI-generated DTOs, so HTTP and IPC cannot disagree.

When in doubt about the wire-agnostic side of this, `.claude/skills/conduit/SKILL.md` covers the transport seam in depth.
