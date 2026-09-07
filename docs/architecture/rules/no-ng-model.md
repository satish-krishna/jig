# no-ng-model

> Engine: `tools/lint/rules/no-ng-model.ts`.

## What it forbids

`ngModel` on any template element, in any of its three forms: the two-way `[(ngModel)]` banana-in-a-box, the one-way `[ngModel]` property binding, and the bare `ngModel` attribute. Angular's template parser desugars the banana-in-a-box into a bound input named `ngModel` (plus an `ngModelChange` output), so checking `node.inputs` for the name `ngModel` catches both bound forms; the bare attribute is checked separately against `node.attributes`. The rule is not scoped by tier: `ngModel` is template-driven forms, and this app has no legitimate use for it anywhere.

## Why

`docs/architecture/forms.md` mandates two form systems — signal-forms (`[formField]="form.name"`, bound with spartan controls inside `hlm-field`) for a form you author, and the dynamic `SchemaForm` renderer (`[formControlName]`) for a runtime schema. `ngModel` is neither: it is the template-driven forms API, which this app does not use at all. A stray `[(ngModel)]` bypasses the zod schema entirely — no shared validation, no shared labels, and a binding the signal-forms and reactive-forms machinery both ignore.

## Accepted form

    <input hlmInput [formField]="form.name" />
    <input hlmInput [formControlName]="field.name" />

## Rejected form

    <input [(ngModel)]="name" />
    <input [ngModel]="name" />
    <input ngModel />

## Measured count: zero, and that is the point

There is no `ngModel` attribute, input, or output anywhere in an app template. The literal word `ngModel` appears exactly once in the whole app, at `frontend/src/app/showcase/pages/radio-group.page.ts:24` — inside the *value* of an unrelated `note` attribute (`note="A plain value/valueChange binding — no ngModel or formControl needed."`), which is prose explaining what the demo does *not* use. It is not an attribute named `ngModel`, so the AST-based rule correctly does not match it; a text grep for the word would over-count by one. That zero is expected, not a sign of a broken or pointless rule: it is carried as prevention, consistent with the zero-violation rules elsewhere on this branch. The `no-ng-model.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads template attribute and input names only, so `ngModel` set dynamically — through `[attr.ngModel]` (which Angular does not treat as the directive selector anyway) or a directive applied via a host binding — would not be caught by this particular check; in practice `ngModel` only ever arrives as a literal attribute or bound input, so this is a theoretical gap rather than an observed one.
