# no-forms-module

> Engine: `tools/lint/rules/no-forms-module.ts`.

## What it forbids

A container component — a file under `frontend/src/app/features/**` or `frontend/src/app/shell/**`, per the `tierOf` helper in `tools/lint/ast.ts` — whose `@Component` metadata lists `FormsModule` in `imports`. The check reads the decorator's `imports` array literal, so it fires on the import declaration regardless of whether the template actually binds `ngModel` anywhere.

The rule bails out immediately outside the container tier: `create()` returns `{}` when `tierOf(context.filename) !== 'container'`. That scoping is deliberate — see Why.

## Why

`docs/architecture/forms.md` mandates two form systems for this app: signal-forms for a form you author at compile time, and the dynamic `SchemaForm` renderer for a schema known only at runtime. Neither is template-driven forms. `FormsModule` is the template-driven forms API — `ngModel` and its friends — and this app has no legitimate use for it anywhere a feature or the shell author a form.

### Why scoped to the container tier, and not every component

The rule as first specified flagged `FormsModule`/`ReactiveFormsModule` in any component. That is broader than the architecture it is meant to enforce, and enforcing it as written would have the gate contradict `docs/architecture/forms.md` itself:

- `ReactiveFormsModule` is imported in 17 files in this app today, and every one is legitimate. `frontend/src/app/forms/schema-form.ts` is the dynamic reactive renderer `docs/architecture/forms.md` calls for directly: it says outright, "do not try to render an unknown runtime schema through signal-forms (its typed field paths fight you) — use the dynamic renderer," and describes `SchemaForm` as building "a reactive `FormGroup` from the schema's fields." A rule flagging it would have the gate fight the document that governs it.
- The other sixteen are showcase pages demoing spartan controls against reactive forms deliberately, with explanatory copy — `input.page.ts` carries `note="Driven by a real FormControl — the error clears once a valid email is typed."` That is the showcase doing its job, not drift.
- `features/**` and `shell/**` — the container tier — contain **zero** reactive forms today. The mandate in `forms.md` is about how you author a *feature* form; the renderer and the demos sit outside it.

So `no-forms-module` (and its sibling `no-reactive-form`) reuse the existing `tierOf` tier model rather than inventing a new exemption concept, and scope to the container tier: the tier the mandate actually governs. A feature or shell author reaching for `FormsModule` is still caught — that is the case `forms.md` forbids.

## Accepted form

    // frontend/src/app/features/users/user-form.ts
    @Component({
      selector: 'app-user-form',
      imports: [FormField, HlmFieldImports, HlmInputImports, HlmButtonImports],
      template: `<input hlmInput [formField]="form.name" />`,
    })
    export class UserForm { /* ... */ }

## Rejected form

    // frontend/src/app/features/users/user-form.ts
    @Component({
      selector: 'app-user-form',
      imports: [FormsModule],
      template: `<input [(ngModel)]="name" />`,
    })
    export class UserForm { /* ... */ }

## Measured count: zero, and that is the point

`features/**` and `shell/**` contain zero `FormsModule` imports today. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the seventh such zero-violation rule on this branch (after `no-raw-icon`, `no-legacy-control-flow`, `no-ng-class-style`, `no-space-utility`, `no-raw-palette-color`, and `no-nested-flex-grid`). The team already builds container forms through signal-forms by convention; the rule's job is to keep it that way once forms are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-forms-module.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It reads the decorator metadata's `imports` array literal only. `FormsModule` reached through a spread, a computed reference, or an `NgModule`-style module import rather than a bare `imports: [FormsModule]` array element is invisible to it. It also has no opinion on the template: a component that imports `FormsModule` for a reason other than `ngModel` still reports, and a component that somehow binds `ngModel` without importing `FormsModule` (which Angular's standalone-component compiler would reject at build time) is not this rule's concern — see `no-ng-model` for the template-level check, which is not tier-scoped.
