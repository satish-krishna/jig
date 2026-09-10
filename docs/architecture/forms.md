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

- It walks the schema into a field tree with a matching control tree (`SchemaFormBuilder`), resolves each node to a registered control — inferred from the zod type or overridden by `meta.control` — renders it through `NgComponentOutlet`, and on submit validates through `schema.safeParse`, folding zod issues back onto the matching controls by path.
- Usage: `<app-schema-form [schema]="mySchema" submitLabel="Save" (submitted)="onSaved($event)" />`. The emitted value is the parsed, valid data.
- **A control kind is a registered `FormControlDefinition`, never a branch.** It carries the kind name, the component, a `matches(zodType)` predicate for inference, and a default value. Add one with a new file under `forms/controls/` plus one entry in `controls/index.ts`; `SchemaForm` never changes. Registration order is semantic — resolution is first-match-wins, so a narrower `matches` must precede a broader one.
- **The zod type owns shape and valid values; the meta owns the human-facing words.** `meta.control` is an override, absent by default. `z.enum` supplies a select's values; `optionMeta` supplies only their labels, descriptions, disabled flags and icons.
- **A shape no control claims throws `SchemaFormUnsupportedError`.** Unions, records, tuples, conditionals and `z.lazy` are unsupported. The agreed response is to register the missing control, not to catch the error — no caller branches on it and there is no fallback renderer.
- **Changing the `schema` input rebuilds the form and discards user input,** including added array rows. Nothing here swaps a schema mid-edit; preserving state across two schema versions would be a diffing subsystem.
- This is the substrate for agent-generated forms: an agent emits a zod schema, the renderer turns it into a validated form with no hand-written component.

## Where spartan lives

Helm components are generated into `frontend/libs/ui` (the CLI copy model) behind the `@spartan-ng/helm/*` tsconfig alias. Add one with `ng g @spartan-ng/cli:ui <name>`. `vite-tsconfig-paths` makes Vitest resolve the same alias. The spartan MCP and `spartan` skill are wired for component APIs.

## Smells that mean the pattern is breaking

- A hand-written form-model interface instead of `z.infer`.
- A validation rule stated in both the zod schema and a validator.
- Rendering a runtime schema by hand instead of through `SchemaForm`, or hand-authoring a known form through `SchemaForm` instead of signal-forms.
- A `switch` on control type anywhere, including inside `SchemaForm` — a kind is a registered definition.
- Values hand-listed in meta next to a `z.string()`, instead of declared with `z.enum`.
- Labels hard-coded instead of read from `.meta()`.
