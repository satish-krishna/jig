One-liner: The wrapper that binds a `Label`, control, and helper/error text into one vertically-rhythmic group (Spartan `hlmField`).

```jsx
<Field>
  <Label htmlFor="slug">Project slug</Label>
  <Input id="slug" invalid defaultValue="Acme Portal" />
  <FieldDescription>Lowercase, hyphenated. Used for the npm name.</FieldDescription>
  <FieldError>Slug must be kebab-case.</FieldError>
</Field>
```

Parts: `Field`, `FieldDescription`, `FieldError`. Use `orientation="horizontal"` for a control-then-label row (checkbox/switch).
