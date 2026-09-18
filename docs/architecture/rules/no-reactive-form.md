# no-reactive-form

> Engine: `tools/lint/rules/no-reactive-form.ts`.

## What it forbids

A container component — a file under `frontend/src/app/features/**` or `frontend/src/app/shell/**`, per the `tierOf` helper in `tools/lint/ast.ts` — that either lists `ReactiveFormsModule` in its `@Component` metadata's `imports`, or constructs `new FormGroup(...)` anywhere in the class body. Both are the same underlying defect — a container hand-building a reactive form — so a component that does both still reports **once**, not twice: the rule tracks reported classes in a `Set` and the second trigger is a no-op once the first has fired.

The rule bails out immediately outside the container tier: `create()` returns `{}` when `tierOf(context.filename) !== 'container'`. That scoping is deliberate — see Why.

## Why

`docs/architecture/forms.md` mandates two form systems: the dynamic `SchemaForm` renderer, which is the default for every form including one whose schema is a literal in the file next door, and Angular signal-forms for the exception — a form whose fields you must bind one by one. A feature form goes through the renderer, so reaching for `ReactiveFormsModule` and a hand-built `FormGroup` in a feature rebuilds by hand the machinery `SchemaForm` already owns, for a case that does not need it.

### Why scoped to the container tier, and not every component

The rule as first specified flagged `ReactiveFormsModule` in any component. That is broader than the architecture it is meant to enforce, and enforcing it as written would have the gate contradict `docs/architecture/forms.md` itself:

- `ReactiveFormsModule` is imported in 25 files in this app today, and every one is legitimate. `frontend/src/app/forms/schema-form.ts` is the dynamic reactive renderer `docs/architecture/forms.md` makes the default for every form: it says outright, "Do not try to render an unknown runtime schema through signal-forms; its typed field paths fight you," and describes the renderer walking the schema into a field tree with a matching control tree. A rule flagging it would have the gate fight the document that governs it.
- Eight more are the registered controls under `forms/controls/`, which is what `SchemaForm` renders each field through; they are the renderer's own parts, not separate forms.
- The remaining sixteen are showcase pages demoing spartan controls against reactive forms deliberately, with explanatory copy — `input.page.ts` carries `note="Driven by a real FormControl — the error clears once a valid email is typed."` That is the showcase doing its job, not drift.
- `features/**` and `shell/**` — the container tier — contain **zero** hand-built reactive forms today. `forms.md` is about how a *feature* form is authored; the renderer, its controls, and the demos sit outside it.

So `no-reactive-form` (and its sibling `no-forms-module`) reuse the existing `tierOf` tier model rather than inventing a new exemption concept, and scope to the container tier: the tier the mandate actually governs. A feature or shell author reaching for reactive forms is still caught — that is the case `forms.md` forbids.

## Accepted form

    // frontend/src/app/features/users/user-form.ts — the whole form, rendered from the schema
    template: `<app-schema-form [schema]="userFormSchema" submitLabel="Add user" (submitted)="onSubmitted($event)" />`,

## Rejected form

    // a feature component
    @Component({ imports: [ReactiveFormsModule] })
    export class UserForm {
      readonly form = new FormGroup({ name: new FormControl('') });
    }

## Measured count: zero, and that is the point

`features/**` and `shell/**` contain zero `ReactiveFormsModule` imports and zero hand-built `FormGroup`s today. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the eighth such zero-violation rule on this branch. Container forms go through `SchemaForm`, and `npm run slice` generates every new feature's form that way, so nothing in the tier reaches for reactive forms by hand; the rule's job is to keep it that way once forms are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-reactive-form.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

The `FormGroup` check matches the bare identifier `new FormGroup(...)` only: a `FormGroup` reached through a namespace import (`forms.FormGroup`) or reassigned to a local alias would not match `node.callee?.name`. The `imports` check reads the decorator metadata's array literal only, via `componentImports`, which matches the bare `ReactiveFormsModule` identifier and the configured call form `ReactiveFormsModule.withConfig({ ... })` but not a spread or an alias — the same blind spot `no-forms-module` documents for `FormsModule`. Neither gap has a real instance in this app today.
