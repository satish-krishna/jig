# ADR 0006 — spartan-ng is deferred; the form renderer's control map is the single swap point

- Status: accepted
- Date: 2026-07-02
- Scope: `forms`

## Context

The stack pins spartan-ng for UI primitives and form controls. spartan-ng requires a full TailwindCSS setup plus generated helm components. Standing that up correctly is a multi-step toolchain task with several failure points, and it was not safe to attempt reliably during an unattended build run.

The reusable capability that actually matters in this slice is the zod-schema-driven form **renderer**: one place maps a zod field plus its `FormFieldMeta` to a control, validation runs through `schema.safeParse` once, and zod issues fold back onto the matching controls. That pattern is independent of whether the emitted control is a spartan `hlm-input` or a plain `<input>`.

## Decision

Build the renderer now with plain, functional Angular controls, and keep the zod-type-to-control mapping in exactly one place: the `@switch` in `SchemaForm`. Defer the spartan-ng + Tailwind setup.

## Consequences

- The schema-driven-form pattern ships complete and tested: schema owns shape and validation, the model type is `z.infer`, meta rides on the field, and a `safeParse` failure surfaces on the right control. The bootstrap smell test ("a switch on control type living in a feature instead of the renderer") is satisfied.
- Adopting spartan is a localized change: install spartan-ng + Tailwind, then replace the control templates inside `SchemaForm`'s `@switch`. No feature, ViewModel, schema, or test changes, because nothing outside the renderer knows what a control looks like. That is the whole point of centralizing the map.
- Until then the controls are unstyled. This is cosmetic, not architectural.
