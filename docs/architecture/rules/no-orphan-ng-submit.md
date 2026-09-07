# no-orphan-ng-submit

> Engine: `tools/lint/rules/no-orphan-ng-submit.ts`.

## What it forbids

An `(ngSubmit)` event binding on an element that carries no `[formGroup]` binding. `ngSubmit` is an output of two different Angular directives with two different selectors: `NgForm` (from the template-driven forms API, whose selector matches any `form` element with neither `ngNoForm` nor `[formGroup]`) and `FormGroupDirective` (from reactive forms, selector `[formGroup]`). An `(ngSubmit)` with no `[formGroup]` alongside it is bound to the template-driven `NgForm`, not the reactive directive — an "orphan" in the sense that the reactive anchor a schema-driven form needs is missing. The check is on the pair of bindings, not the tag name: it fires "on any element," per the rule's own test cases, because `ngSubmit` is not restricted to `<form>` at the template-syntax level.

## Why

`docs/architecture/forms.md` mandates two form systems, neither of which is template-driven forms. The dynamic `SchemaForm` renderer (`frontend/src/app/forms/schema-form.ts`) is reactive by design — it pairs `[formGroup]="form()"` with `(ngSubmit)="onSubmit()"`, the idiomatic Angular reactive-forms submit pattern. Signal-forms, by contrast, submits through the native `(submit)` event (see `frontend/src/app/features/users/user-form.ts`), not `ngSubmit` at all. So the only shape this app ever legitimately wants is `(ngSubmit)` paired with `[formGroup]`; a bare `(ngSubmit)` with no `[formGroup]` can only be binding to `NgForm`, which means a template-driven form has crept in — exactly the pattern `no-forms-module` and `no-ng-model` also exist to keep out.

A rule that flagged every `(ngSubmit)` unconditionally would also flag `schema-form.ts`'s own legitimate, by-design usage, putting the gate at odds with `docs/architecture/forms.md`. Requiring the `[formGroup]` pairing is what keeps the rule aimed at the actual defect — a template-driven `ngSubmit` — without contradicting the one reactive form this app is supposed to have.

## Accepted form

    <!-- frontend/src/app/forms/schema-form.ts — the dynamic renderer, reactive by design -->
    <form hlmFieldGroup [formGroup]="form()" (ngSubmit)="onSubmit()">...</form>

    <!-- frontend/src/app/features/users/user-form.ts — signal-forms submits natively -->
    <form hlmFieldGroup (submit)="onSubmit($event)">...</form>

## Rejected form

    <form (ngSubmit)="onSubmit()">...</form>

## Measured count: zero, and that is the point

There is exactly one `(ngSubmit)` binding anywhere in this app: `frontend/src/app/forms/schema-form.ts:46`, `<form hlmFieldGroup [formGroup]="form()" (ngSubmit)="onSubmit()">`. It is paired with `[formGroup]` on the same element, so it is not an orphan and the rule correctly reports zero. That zero is expected, not a sign of a broken or pointless rule: it is carried as prevention, consistent with the zero-violation rules elsewhere on this branch. The `no-orphan-ng-submit.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It checks for the literal `[formGroup]` input name on the *same* element only. A `[formGroup]` set higher up the tree with `(ngSubmit)` on a descendant — which is not how `FormGroupDirective` actually works, since `ngSubmit` is the directive's own output and the directive is selected by `[formGroup]` on that same element — would not be a real Angular pattern in the first place, so this is not an observed gap. It also has no opinion on whether `[formGroup]`'s value is a genuine reactive form; a `[formGroup]="{}"` decoy would silence the rule without being a real reactive form, but that is a fabrication no legitimate code has a reason to write.
