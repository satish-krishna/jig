# Schema-driven forms (zod + spartan)

Read this before you build or change a form. Forms follow the same idea as ngx-formly, but the schema *is* a zod schema, so validation, the model type, and the field metadata all come from one definition instead of a separate config object. There is one reusable renderer; never hand-assemble a form again.

## The rules

- **One zod schema per form is the source of truth.** It owns field shapes and validation rules. Nothing restates them.
- **The form model type is `z.infer<typeof schema>`.** Never hand-write a form interface. Same DRY win as the generated transport DTOs.
- **Presentation metadata rides on the field** via zod 4 `.meta()` against a typed `FormFieldMeta` (label, control kind, placeholder, options, order, help text). Strongly typed, so a missing label is a compile error, not a runtime surprise.
- **The shared renderer is the only place that maps a zod type plus meta to a spartan control** and binds it to the reactive form. Adding a control kind extends the renderer's map once, never per feature.
- **Validation runs through zod, once.** On submit (and optionally per field) call `schema.safeParse(value)`; on failure, fold the zod issue tree back onto the matching controls so spartan shows the errors. Do not mirror a zod rule as a separate Angular validator.
- **Boundary reuse (the bonus).** zod 4 emits JSON Schema, so where a form schema and a transport operation describe the same shape, the one schema can also validate the wire. Share it rather than defining the shape twice.

## The typed meta and a schema example

```ts
type FormFieldMeta = {
  label: string;
  control: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';
  placeholder?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  order?: number;
};

const userForm = z.object({
  name:  z.string().min(1).meta({ label: 'Name', control: 'text' } satisfies FormFieldMeta),
  email: z.string().email().meta({ label: 'Email', control: 'email' } satisfies FormFieldMeta),
});
```

## Smells that mean the pattern is breaking

- A hand-written form-model interface.
- A validation rule stated in both the schema and an Angular validator.
- A `switch` on control type living in a feature instead of the renderer.
- A form built by wiring `FormControl`s by hand instead of from a schema.
