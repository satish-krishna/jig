---
name: adding-an-angular-service
description: Use when adding or extending an Angular reusable unit in this repo — a repository, a transport, a capability service, a shared component, or any @Injectable under frontend/src/app. Covers the discover-first checklist that stops agents reinventing existing capabilities, and the injectable-shape conventions the codebase already follows (inject() over constructor DI, signals for state, which folder a unit belongs in, and the seams a service must not cross). Reach for this on "add a service", "new repository", "where does this service go", "inject a dependency", "add a capability", or before creating any new *.service.ts / *.repository.ts / *.transport.ts.
---

# Adding an Angular reusable unit

Two things go wrong when an agent adds an Angular service: it rebuilds a capability that already exists because it could not cheaply find it, and it puts the new unit in the wrong layer so a seam leaks. This skill is the discover-first checklist for the first and the placement-and-shape rules for the second. It is guidance, not a gate — the catalog freshness check and the architecture analyzer are the gates.

## First: discover before you build

This is the CLAUDE.md prime directive, made concrete for the frontend. Run it in order before writing a new reusable unit:

1. **Read the catalog.** Open `.bob/registry/CATALOG.md` and scan the area — repositories, transport, capabilities, shared components. It is generated from `@capability` annotations, so it is the fastest index of what already exists.
2. **LSP-search the concept, do not grep.** Use `workspace/symbol` for the noun you are about to introduce (the entity, the operation, the capability). Find-references on a near-match tells you whether to extend it.
3. **Reuse or extend before creating.** Generalising the existing unit beats adding a parallel one. A second repository that speaks the same operations, or a second service that wraps the same capability, is a DRY defect.
4. **If nothing fits, create it and annotate it.** Add the `@capability`, `@intent`, `@reuse` annotations (copy the shape from `frontend/src/app/repositories/user.repository.ts`), then run `npm run catalog`. An un-annotated unit is invisible to the next agent, which is how the reinvention starts again.
5. **If you created something that overlaps an existing capability, that is a defect.** Record why in an ADR under `.bob/adr/`.

## Then: which unit is this, and where does it live

Pick the layer by what the thing actually does. Putting a unit in the wrong folder is how a seam leaks.

| It... | is a | lives in |
|---|---|---|
| speaks typed operations to the backend (list users, save user) | **repository** | `frontend/src/app/repositories/*.repository.ts` |
| is the wire itself (HTTP, IPC, error normalizing) | **transport** | `frontend/src/app/transport/` — you almost never add here |
| wraps a native-only ability (filesystem, OS keychain, notifications) | **capability** | `frontend/src/app/capabilities/` — absent from the web bootstrap by design |
| holds feature state or view logic for one slice | **feature service** | `frontend/src/app/features/<slice>/` |
| is reused UI with no data access | **shared component** | the `ui` library / feature-agnostic component folder |

The `users` slice is the worked example for every one of these. Copy its shape rather than inventing a new one.

## Shape: how a jig injectable is written

- **`inject()` over constructor DI.** The codebase uses the `inject()` function, not constructor parameters. Match it.
- **Signals for state.** Reactive state is a `signal` / `computed`, exposed read-only. No `BehaviorSubject` for local state.
- **`providedIn` or an explicit provider.** A repository is `providedIn: 'root'` unless it is scoped to a feature; a capability is registered only in the native bootstrap, never the web one.
- **A colocated `*.spec.ts`, written first.** TDD is a non-negotiable here — the failing test exists before the class does.

## Seams a service must not cross

These are the boundaries the architecture depends on. Crossing one is the kind of thing the analyzer and the transport design exist to prevent:

- **A repository talks to the `Transport` port, never to a concrete wire.** Do not `import` `HttpTransport` or `IpcTransport` into a repository — inject the `Transport` abstraction.
- **`isTauri()` is called in exactly one place: `provide-transport.ts`.** A service that branches on `isTauri()` has pulled the two-wire decision out of its one home. Read `docs/architecture/conduit.md` before touching the transport seam.
- **Request and response shapes come from the contracts registry**, not hand-written interfaces. Response types are the OpenAPI-generated DTOs, so HTTP and IPC cannot disagree.

When in doubt about the wire-agnostic side of this, the `conduit` skill covers the transport seam in depth.
