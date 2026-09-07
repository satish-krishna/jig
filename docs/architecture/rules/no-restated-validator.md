# no-restated-validator

> Engine: `tools/lint/rules/no-restated-validator.ts`.

## What it forbids

A call to `required`, `minLength`, `maxLength`, `min`, `max`, `email`, or `pattern` inside a `@Component` class, when that identifier is imported from `@angular/forms/signals`. The rule uses `importedFrom` (`tools/lint/ast.ts`) to confirm the specific import source before reporting, so a local function of the same name — or the same name imported from anywhere else — is not flagged. It is not scoped by tier: a restated validator is a defect wherever it appears, not only in `features/**`/`shell/**`.

## Why

`docs/architecture/forms.md` states plainly that a zod schema is always the single source of truth for shape, validation, and labels, and that signal-forms validates the whole form through `validateStandardSchema` because zod 4 is a Standard Schema. Calling `required(path.name)` (or any of its siblings) inside a component restates a rule the schema already carries — a second place the same fact can go stale against the first. The zod schema stays the one place a rule is written; `required()` and friends are signal-forms' own validator functions, present for a form with no schema behind it, which is not this app's pattern.

## Accepted form

    // frontend/src/app/features/users/user-form.schema.ts
    export const userFormSchema = z.object({
      name: z.string().min(1, 'Name is required'),
    });

## Rejected form

    import { required } from '@angular/forms/signals';

    @Component({})
    export class UserForm {
      readonly form = form(this.model, (path) => {
        required(path.name); // restates userFormSchema's own .min(1, ...)
      });
    }

## Measured count: zero, and that is the point

Only two files in this app import from `@angular/forms/signals` at all — `frontend/src/app/features/users/user-form.ts` and `frontend/src/app/showcase/pages/signal-form.page.ts` — and both import only `FormField`, `form`, `submit`, and `validateStandardSchema`. Neither calls `required`, `minLength`, `maxLength`, `min`, `max`, `email`, or `pattern`; both validate through `.min()`/`.email()` on the zod schema itself, which are zod's own chained methods (a `MemberExpression` callee), not a bare call to a signal-forms validator function, so they never match this rule's `CallExpression` check regardless of import source. The measured violation count is zero, not the two-file import count a grep for the module specifier alone would suggest. That is expected, not a sign of a broken or pointless rule: it is carried as prevention, consistent with the zero-violation rules elsewhere on this branch. The `no-restated-validator.test.ts` `RuleTester` cases are what prove the implementation still fires, independent of whether the live app currently has anything to catch.

## Known blind spots

It matches a bare call expression (`required(...)`) only: a validator reached through a namespace import, reassigned to a local alias, or invoked via `.call()`/`.apply()` would not match `node.callee?.name`. It also only checks the call's import source, not whether the same rule is genuinely duplicated in the schema — a validator call with no corresponding schema rule at all still reports, which is the conservative direction to be wrong in.
