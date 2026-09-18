---
name: add-a-form
description: Use when adding or changing any form, field, or validation in the app. Covers the zod-schema-is-the-source rule (the model type is z.infer, never hand-written), rendering through the shared SchemaForm rather than hand-wiring FormControls, adding a control to the registry when no existing control fits, and the validation message path. Reach for this on "add a form", "add a field", "validate X", "zod", "SchemaForm", "required field", "the form is not submitting", "a dropdown for Y", or before creating any *.schema.ts or *.control.ts under frontend/src/app/.
---

# Add a form

## Where you are

This is step 7 of `.claude/skills/add-a-feature/SKILL.md`: the form, when the feature has one.

## Copy this

The `users` slice is the exemplar. Copy its shape rather than inventing a new one:

- Zod schema: `frontend/src/app/features/users/user-form.schema.ts`
- The form component: `frontend/src/app/features/users/user-form.ts`
- Form spec: `frontend/src/app/features/users/user-form.spec.ts`
- The shared renderer: `frontend/src/app/forms/schema-form.ts`
- The control registry: `frontend/src/app/forms/control-registry.ts`
- A worked control: `frontend/src/app/forms/controls/text.control.ts`
- The conformance suite every control must satisfy: `frontend/src/app/forms/controls/conformance.spec.ts`

See `docs/architecture/forms.md` for the full shape of `FormFieldMeta` and `SchemaForm`, and `.bob/adr/0013-form-controls-are-a-registry.md` for why controls are a registry rather than a growing `switch` in the renderer.

## The sequence (TDD)

**1.** Write the failing spec for the schema's validation behavior first.
**2.** Run `cd frontend && npm test` and see it fail.
**3.** Write the zod schema; the model type is `z.infer<typeof schema>`, never a hand-written interface.
**4.** Run the test again and see it pass.
**5.** Render the form through `SchemaForm`, driven by the schema.
**6.** Only if no registered control fits the field: add one under `frontend/src/app/forms/controls/`, register it in the control registry, and satisfy `frontend/src/app/forms/controls/conformance.spec.ts`.
**7.** Run `cd frontend && npm test` and see it pass.

## The validation message path

A message is authored once, on the zod schema, and travels to the field without anyone writing a second copy of it. Four hops:

1. **The schema carries the text.** The message is zod's own — `z.string().min(1, 'Name is required')`. `.meta()` in `frontend/src/app/forms/zod-meta.ts` carries presentation only (label, span, control hints); it never carries a message. A field with no `label` in its meta throws at render time rather than rendering blank, and that throw names the field.
2. **Validation runs on submit, not per keystroke.** `SchemaForm.onSubmit()` in `frontend/src/app/forms/schema-form.ts` clears the previous run's messages, then calls `safeParse` on the whole schema. There are no per-control Angular validators to keep in step, which is why `no-restated-validator` exists.
3. **Issues are folded back onto the controls by path.** `applyZodIssues` in `frontend/src/app/forms/schema-form.util.ts` walks `error.issues` and sets `{ zod: issue.message }` on the control at `issue.path`. Zod's path array is exactly the shape Angular's `AbstractControl.get()` accepts, so a nested group or an indexed array row needs no special handling. `onSubmit` then marks the tree touched, because the spartan error-state matcher only reports a control invalid once it has been touched.
4. **The field host renders it.** `frontend/src/app/forms/controls/field-host.ts` prints the control's `zod` error into the one error slot in its cell, keyed to the field's id. Every control gets that slot from the host, so a new control renders its messages correctly without doing anything.

The practical consequences: messages appear on the first submit, not before; one message shows per control, the last issue zod reported for it; and a message you cannot make appear is almost always a schema that never produced the issue, not a rendering fault. Check `safeParse` on the schema in a unit test before touching the template.

## What the hooks will say

Same `check-frontend` behavior as everywhere else under `frontend/src/`: violations come back with the rule's doc path attached, unasked. A `no-restated-validator` hit means the same validation rule was written twice — once in the zod schema, once by hand in the component or template — and the hand-written copy is the one that goes.

## Rules that bite here

- `no-reactive-form` — no hand-built reactive form control tree; drive the form from the schema instead; doc at `docs/architecture/rules/no-reactive-form.md`.
- `no-ng-model` — no two-way model binding directive; bind through the control registry; doc at `docs/architecture/rules/no-ng-model.md`.
- `no-raw-control` — no hand-wired native input or select element in place of a registered control; doc at `docs/architecture/rules/no-raw-control.md`.
- `no-restated-validator` — a validation rule lives in the zod schema, not restated by hand; doc at `docs/architecture/rules/no-restated-validator.md`.
- `no-orphan-ng-submit` — a submit event binding only on a form actually wired to submit through the shared renderer; doc at `docs/architecture/rules/no-orphan-ng-submit.md`.
- `no-forms-module` — the reactive or template-driven forms module is not imported; doc at `docs/architecture/rules/no-forms-module.md`.
- `no-missing-composition-part` — a registered control supplies every part the registry contract requires; doc at `docs/architecture/rules/no-missing-composition-part.md`.

## Before you commit

`npm run lint`, then `npm run verify`. Commit only at green.
