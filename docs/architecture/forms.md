# Schema-driven forms (zod + spartan)

Read this before you build or change a form. A **zod schema is always the single source of truth** for shape, validation, and field labels. There are two ways to turn that schema into a form; pick by whether you know the schema at compile time.

## The rule: which form system

| You know the fields when you write the code | The schema arrives at runtime |
|---|---|
| **Angular signal-forms** (typed, you author it) | **Dynamic reactive renderer** (`SchemaForm`) |
| `features/users/user-form.ts` is the reference | agent-emitted forms, admin/config UIs |
| `form(model, p => validateStandardSchema(p, schema))` | `<app-schema-form [schema]="schema" (submitted)="...">` |

Both read shape and labels from the same zod schema. Do not reach for reactive forms when you are hand-authoring a known form (use signal-forms), and do not try to render an unknown runtime schema through signal-forms (its typed field paths fight you) — use the dynamic renderer.

## Compile-time forms: signal-forms

- **The model type is `z.infer<typeof schema>`.** Never hand-write a form interface.
- **Validation is native.** zod 4 is a Standard Schema, so `form(model, (path) => validateStandardSchema(path, schema))` validates the whole form through zod. Do not restate a rule as a `required()`/`minLength()` validator.
- **Labels ride on the schema** via `.meta()`, read with `formMeta(schema)`.
- **Controls are spartan helm.** Bind with `[formField]="form.name"` inside `hlm-field`; show errors from `form.name().errors()`, gated on `form.name().touched()` so a fresh form does not shout.
- **Submit runs only when valid:** `submit(this.form, async () => { ... })`.

## Runtime forms: the dynamic renderer (`SchemaForm`)

For a schema not known until runtime, `forms/schema-form.ts` builds the form for you.

- It builds a reactive `FormGroup` from the schema's fields (`fieldsFromSchema`), renders each by its `meta.control` kind with spartan controls, and on submit validates through `schema.safeParse`, folding zod issues back onto the matching fields.
- Usage: `<app-schema-form [schema]="mySchema" submitLabel="Save" (submitted)="onSaved($event)" />`. The emitted value is the parsed, valid data.
- The zod-to-control mapping lives only in this component's `@switch`. Add a control kind there, never in a feature.
- This is the substrate for agent-generated forms (AG-UI): an agent emits a zod schema, the renderer turns it into a validated form with no hand-written component.

## Where spartan lives

Helm components are generated into `frontend/libs/ui` (the CLI copy model) behind the `@spartan-ng/helm/*` tsconfig alias. Add one with `ng g @spartan-ng/cli:ui <name>`. `vite-tsconfig-paths` makes Vitest resolve the same alias. The spartan MCP and `spartan` skill are wired for component APIs.

## Smells that mean the pattern is breaking

- A hand-written form-model interface instead of `z.infer`.
- A validation rule stated in both the zod schema and a validator.
- Rendering a runtime schema by hand instead of through `SchemaForm`, or hand-authoring a known form through `SchemaForm` instead of signal-forms.
- A `switch` on control type living in a feature instead of in `SchemaForm`.
- Labels hard-coded instead of read from `.meta()`.
