# no-reactive-form

> Engine: `tools/lint/rules/no-reactive-form.ts`.

## What it forbids

A container component — a file under `frontend/src/app/features/**` or `frontend/src/app/shell/**`, per the `tierOf` helper in `tools/lint/ast.ts` — that either lists `ReactiveFormsModule` in its `@Component` metadata's `imports`, or constructs `new FormGroup(...)` anywhere in the class body. Both are the same underlying defect — a container hand-building a reactive form — so a component that does both still reports **once**, not twice: the rule tracks reported classes in a `Set` and the second trigger is a no-op once the first has fired.

The rule bails out immediately outside the container tier: `create()` returns `{}` when `tierOf(context.filename) !== 'container'`. That scoping is deliberate — see Why.

## Why

`docs/architecture/forms.md` mandates two form systems: signal-forms for a form you author at compile time, and the dynamic `SchemaForm` renderer for a schema known only at runtime. A feature form's fields are known when you write the code, so it uses signal-forms; reaching for `ReactiveFormsModule` and a hand-built `FormGroup` in a feature restates the dynamic renderer's own machinery for a case that does not need it.

### Why scoped to the container tier, and not every component

The rule as first specified flagged `ReactiveFormsModule` in any component. That is broader than the architecture it is meant to enforce, and enforcing it as written would have the gate contradict `docs/architecture/forms.md` itself:

- `ReactiveFormsModule` is imported in 17 files in this app today, and every one is legitimate. `frontend/src/app/forms/schema-form.ts` is the dynamic reactive renderer `docs/architecture/forms.md` calls for directly: it says outright, "do not try to render an unknown runtime schema through signal-forms (its typed field paths fight you) — use the dynamic renderer," and describes `SchemaForm` as building "a reactive `FormGroup` from the schema's fields." A rule flagging it would have the gate fight the document that governs it.
- The other sixteen are showcase pages demoing spartan controls against reactive forms deliberately, with explanatory copy — `input.page.ts` carries `note="Driven by a real FormControl — the error clears once a valid email is typed."` That is the showcase doing its job, not drift.
- `features/**` and `shell/**` — the container tier — contain **zero** reactive forms today. The mandate in `forms.md` is about how you author a *feature* form; the renderer and the demos sit outside it.

So `no-reactive-form` (and its sibling `no-forms-module`) reuse the existing `tierOf` tier model rather than inventing a new exemption concept, and scope to the container tier: the tier the mandate actually governs. A feature or shell author reaching for reactive forms is still caught — that is the case `forms.md` forbids.

## Accepted form

    // frontend/src/app/features/users/user-form.ts
    protected readonly form = form(this.model, (path) => validateStandardSchema(path, userFormSchema));

## Rejected form

    // a feature component
    @Component({ imports: [ReactiveFormsModule] })
    export class UserForm {
      readonly form = new FormGroup({ name: new FormControl('') });
    }

## Measured count: zero, and that is the point

`features/**` and `shell/**` contain zero `ReactiveFormsModule` imports and zero hand-built `FormGroup`s today. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, the eighth such zero-violation rule on this branch. The team already builds container forms through signal-forms by convention; the rule's job is to keep it that way once forms are written faster than they are reviewed. A future reader who finds this rule with a zero-violation history should not read that as dead weight to delete — the `no-reactive-form.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

The `FormGroup` check matches the bare identifier `new FormGroup(...)` only: a `FormGroup` reached through a namespace import (`forms.FormGroup`) or reassigned to a local alias would not match `node.callee?.name`. The `imports` check reads the decorator metadata's array literal only, via `componentImports`, which matches the bare `ReactiveFormsModule` identifier and the configured call form `ReactiveFormsModule.withConfig({ ... })` but not a spread or an alias — the same blind spot `no-forms-module` documents for `FormsModule`. Neither gap has a real instance in this app today.
