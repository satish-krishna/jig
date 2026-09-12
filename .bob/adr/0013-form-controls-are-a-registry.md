# ADR 0013 — Form controls are a registry, not a switch

- Status: accepted
- Date: 2026-09-09
- Scope: frontend/src/app/forms
- Supersedes: the `@switch` rule in `docs/architecture/forms.md`

## Context

Eight tasks rebuilt the dynamic zod-schema form renderer so control kind selection moves from a component-local `@switch` to a Dependency Injection multi-provider registry. Each kind is now a `FormControlDefinition` — an object carrying the kind name, the component class, a `matches(zodType)` predicate for type inference, and a default value.

The dynamic renderer (`SchemaForm`) contains no control-kind branches. It asks the registry for a control that matches the zod type, and `NgComponentOutlet` renders it. A new control kind is a new file under `forms/controls/` plus one entry in the registry export (`controls/index.ts`); `SchemaForm` never changes.

## Decision

Control kinds are registered `FormControlDefinition` values resolved through an Angular DI multi-provider and rendered via `NgComponentOutlet`. The registry is immutable and entirely known at bootstrap time. A control kind is never a runtime branch in the renderer component.

## Why not reuse `MenuService`

`MenuService` is a mutable, region-keyed registry whose `register()` ties a contribution's lifetime to the caller's `DestroyRef`. It was built for features contributing commands to the sidebar and header menus as they mount — their registrations must outlive the feature if the menu persists after navigating away, but disappear when the feature is truly torn down.

Control kinds are exactly opposite. They are known at bootstrap (before any component mounts), must be resolved before the first form renders, and never change. A mutable registry with dynamic contribution registration buys nothing and costs allocation overhead. The immutable DI multi-provider is the right fit, and generalizing `MenuService` to handle both cases would make it worse at both jobs. The prime directive requires this justification in writing rather than being discovered by fragile future copies.

## Accepted costs and mitigations

**First-match-wins makes registration order semantic.** The deleted `@switch` had its evaluation order visible in one file. A registry order is now spread across three files: the default definitions in `controls/index.ts`, then caller definitions that resolve first through the multi-provider setup.

This is mitigated by:

- Shipping the defaults pre-ordered so narrower predicates precede broader ones (e.g., `z.enum` matches before `z.string`).
- Letting the caller's `provideFormControls()` set take priority in the DI multi-provider resolution order, so test controls or feature-specific control overrides resolve before the shipped `provideDefaultFormControls()` catalog.
- Testing the resolution order explicitly in Task 2 (the control registry test), so a misordering is caught by that unit test before any render.

The cost is not eliminated: a future maintainer who adds two controls without understanding the ordering risk will introduce an order-dependent bug. Mitigated-but-not-eliminated is the boundary this repo accepts.

## Boundary: unsupported types throw

Unions, intersections, conditionals, tuples, records and `z.lazy` have no registered control. When `fieldsFromSchema` encounters one, it throws `SchemaFormUnsupportedError`. There is no `supportsSchema` predicate, no fallback renderer, and no caller-side branching on the error — it is a developer-time assertion.

The agreed response to a thrown shape is to register the missing control, not to catch the error. The boundary is expected to move one control at a time, by extension. A discriminated union is the likely first, which is why `fieldsFromSchema` accepts any node at runtime and is callable from tests.

## Consequences

- A new control kind costs four locations: the component, `controls/index.ts`, the registry test, and `ControlKindRegistry` in `form-field-meta.ts`.
- Control inference (`matches`) frees the schema author from writing `meta.control` overrides for the obvious cases.
- The zod type is the single source of truth for shape and valid values; `optionMeta` supplies only human-facing words (`label`, `description`, `disabled`, `icon`) for select options.
- Schema swap resets the form (no state diffing), which is documented in `docs/architecture/forms.md`.
