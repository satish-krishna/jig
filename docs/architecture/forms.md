# Schema-driven forms (zod + Angular signal-forms + spartan)

Read this before you build or change a form. A form is built on Angular signal-forms (`@angular/forms/signals`) with spartan helm controls, and the **zod schema is the single source of truth** for shape, validation, and field labels. Copy the reference `UserForm` (`features/users/user-form.ts`).

## The rules

- **One zod schema per form is the source of truth.** It owns field shapes and validation rules. Nothing restates them. See `user-form.schema.ts`.
- **The model type is `z.infer<typeof schema>`.** Never hand-write a form interface.
- **Validation runs through the schema, natively.** zod 4 is a Standard Schema, and signal-forms validates a Standard Schema directly:
  ```ts
  protected readonly model = signal<UserFormModel>({ name: '', email: '' });
  protected readonly form = form(this.model, (path) => validateStandardSchema(path, userFormSchema));
  ```
  Do not add `required()` / `minLength()` validators that duplicate a zod rule, and do not mirror a rule as a separate Angular validator. The schema owns it.
- **Field labels ride on the schema** via zod `.meta()` against a typed `FormFieldMeta`, read with `formMeta(schema)`. A missing label is a compile error.
- **Controls are spartan helm.** Bind each field with the signal-forms `[formField]` directive inside an `hlm-field`:
  ```html
  <hlm-field>
    <label hlmFieldLabel for="name">{{ meta['name'].label }}</label>
    <input hlmInput id="name" [formField]="form.name" />
    @if (form.name().touched()) {
      @for (error of form.name().errors(); track error.kind) {
        <hlm-field-error>{{ error.message }}</hlm-field-error>
      }
    }
  </hlm-field>
  ```
- **Errors show after interaction.** Gate the error `@for` on `form.field().touched()`; mark fields touched on submit so a fresh form does not shout on first paint.
- **Submit runs only when valid.** Use `submit(this.form, async () => { ... })`; the action runs only if the schema passes.

## Why per-feature, not one generic renderer

signal-forms is built around statically-typed field paths (`form.name`), which a fully-dynamic "render any schema" component fights. So each feature has its own small form component. The reuse is real but lives elsewhere: the one zod schema (shape + validation + meta), the native Standard Schema validation bridge, and the spartan helm controls. See ADR 0006.

## Where spartan lives

Helm components are generated into `frontend/libs/ui` (the CLI copy model) behind the `@spartan-ng/helm/*` tsconfig alias. Add a component with `ng g @spartan-ng/cli:ui <name>`. The spartan MCP and the `spartan` skill are wired for component APIs and project context.

## Smells that mean the pattern is breaking

- A hand-written form-model interface instead of `z.infer`.
- A validation rule stated in both the zod schema and a signal-forms validator.
- A form field wired without its zod schema, or labels hard-coded instead of read from `.meta()`.
- Reaching for reactive `FormGroup`/`FormControl` instead of signal-forms.
