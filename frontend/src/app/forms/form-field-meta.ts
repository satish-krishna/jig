/**
 * Presentation metadata that rides on a zod field via `.meta()`. Strongly typed,
 * so a missing label is a compile error rather than a runtime surprise. The one
 * definition the renderer reads to decide which control to render.
 *
 * @capability forms.field-meta
 * @intent Field presentation lives on the schema field, not in a parallel config object.
 * @reuse Attach with `.meta({...} satisfies FormFieldMeta)` on each zod field.
 */
export type ControlKind = 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface FormFieldMeta {
  label: string;
  control: ControlKind;
  placeholder?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  order?: number;
  help?: string;
}
