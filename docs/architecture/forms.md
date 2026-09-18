# Schema-driven forms (zod + spartan)

Read this before you build or change a form. A **zod schema is always the single source of truth** for shape, validation, and field labels. There are two ways to turn that schema into a form, and one of them is the default.

## The rule: which form system

| Every form in the app | A form whose fields you must bind one by one |
|---|---|
| **Dynamic renderer** (`SchemaForm`) | **Angular signal-forms** (typed, you author it) |
| `features/users/user-form.ts` is the reference | `showcase/pages/signal-form.page.ts` is the reference |
| `<app-schema-form [schema]="schema" (submitted)="...">` | `form(model, p => validateStandardSchema(p, schema))` |

`SchemaForm` is the default, including for a schema you know at compile time. This used to be the other way around, on the reasoning that a known schema deserves typed field paths. The control registry (ADR 0013) removed the trade that argument rested on: a field's control is now resolved from its zod type, so rendering a known schema through `SchemaForm` costs one line and adding a field costs an edit to the schema alone. The hand-wired version cost an `hlm-field` block per field, a per-field error loop, and — because a component may not own form state — a ViewModel holding a form the component then reached back into.

It matters beyond line count that the default is the renderer: `npm run slice` generates a feature's form, so the renderer is what every new slice in an app built from this template will use. An exemplar that demonstrated the other path would be showing agents a shape the generator never emits.

Reach for signal-forms when you genuinely need typed per-field bindings — a field whose template markup is bespoke, or cross-field behavior expressed in the template rather than in the schema. Do not try to render an unknown runtime schema through signal-forms; its typed field paths fight you.

## Both systems, whichever you pick

- **The model type is `z.infer<typeof schema>`.** Never hand-write a form interface.
- **Validation is native.** zod 4 is a Standard Schema, so the rules on the schema are the rules the form enforces. Do not restate one as a `required()`/`minLength()` validator.
- **Labels ride on the schema** via `.meta()`, read with `formMeta(schema)`.

## The default: the dynamic renderer (`SchemaForm`)

`forms/schema-form.ts` builds the form from the schema, whether that schema is a literal in the file next door or one that arrives at runtime.

- It walks the schema into a field tree with a matching control tree (`SchemaFormBuilder`), resolves each node to a registered control — inferred from the zod type or overridden by `meta.control` — renders it through `NgComponentOutlet`, and on submit validates through `schema.safeParse`, folding zod issues back onto the matching controls by path.
- Usage: `<app-schema-form [schema]="mySchema" submitLabel="Save" (submitted)="onSaved($event)" />`. The emitted value is the parsed, valid data.
- **A control kind is a registered `FormControlDefinition`, never a branch.** It carries the kind name, the component, a `matches(zodType)` predicate for inference, and a default value. Add one with a new file under `forms/controls/` plus one entry in `controls/index.ts`; `SchemaForm` never changes. Registration order is semantic — resolution is first-match-wins, so a narrower `matches` must precede a broader one.
- **The zod type owns shape and valid values; the meta owns the human-facing words.** `meta.control` is an override, absent by default. `z.enum` supplies a select's values; `optionMeta` supplies only their labels, descriptions, disabled flags and icons.
- **A shape no control claims throws `SchemaFormUnsupportedError`.** Unions, records, tuples, conditionals and `z.lazy` are unsupported. The agreed response is to register the missing control, not to catch the error — no caller branches on it and there is no fallback renderer.
- **Changing the `schema` input rebuilds the form and discards user input,** including added array rows. Nothing here swaps a schema mid-edit; preserving state across two schema versions would be a diffing subsystem.
- This is the substrate for agent-generated forms: an agent emits a zod schema, the renderer turns it into a validated form with no hand-written component.

## The exception: signal-forms

For a form whose fields you must bind one by one, `@angular/forms/signals` gives you typed field paths.

- **Build it from the same schema:** `form(model, (path) => validateStandardSchema(path, schema))` validates the whole form through zod.
- **Controls are spartan helm.** Bind with `[formField]="form.name"` inside `hlm-field`; show errors from `form.name().errors()`.
- **Submit runs only when valid:** `submit(this.form, async () => { ... })`.
- **A component may not own the form.** `form()` is state, so it lives on a ViewModel the component provides (`no-state-outside-view-model`). That cost is one of the reasons the renderer is the default.
- The worked example is `frontend/src/app/showcase/pages/signal-form.page.ts`.

## Where spartan lives

Helm components are generated into `frontend/libs/ui` (the CLI copy model) behind the `@spartan-ng/helm/*` tsconfig alias. Add one with `ng g @spartan-ng/cli:ui <name>`. `vite-tsconfig-paths` makes Vitest resolve the same alias. The spartan MCP and `spartan` skill are wired for component APIs.

## Smells that mean the pattern is breaking

- A hand-written form-model interface instead of `z.infer`.
- A validation rule stated in both the zod schema and a validator.
- A form built field by field when the schema already says what the fields are. Reaching for signal-forms is a decision with a reason behind it, not the starting point.
- A `switch` on control type anywhere, including inside `SchemaForm` — a kind is a registered definition.
- Values hand-listed in meta next to a `z.string()`, instead of declared with `z.enum`.
- Labels hard-coded instead of read from `.meta()`.
