/**
 * Presentation metadata that rides on a zod field via `.meta()`. The zod TYPE
 * owns shape and valid values; this owns the human-facing words and layout.
 * `control` is an override — the registry infers a kind from the type when it
 * is absent.
 *
 * @capability forms.field-meta
 * @intent Field presentation lives on the schema field, not in a parallel config object.
 * @reuse Attach with `.meta({...} satisfies FormFieldMeta)` on each zod field, AFTER any
 *        .optional()/.nullable()/.default() wrapper where practical.
 */

/**
 * The registered control kinds. Declared as an interface rather than a union so
 * a control registered from outside this folder can widen it without editing
 * here — the registry's extend-without-editing rule, applied to the type:
 *
 *   declare module '@app/forms' {
 *     interface ControlKindRegistry { slider: true }
 *   }
 */
export interface ControlKindRegistry {
  text: true;
  email: true;
  number: true;
  textarea: true;
  checkbox: true;
  select: true;
  radio: true;
  multiselect: true;
  date: true;
  group: true;
  array: true;
}

export type ControlKind = keyof ControlKindRegistry;

/**
 * Per-option presentation the zod type cannot express. A named interface, not
 * an open bag: a misspelled key must be a compile error, not an option that
 * silently renders enabled. Widen it the same way as ControlKindRegistry.
 */
export interface OptionMeta {
  /** Defaults to the enum value itself. */
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Registered @ng-icons/lucide name, e.g. 'lucideUsers'. */
  icon?: string;
}

export interface FormFieldMeta {
  label: string;
  /** Override the inferred kind. Absent means "infer from the zod type". */
  control?: ControlKind;
  /** Columns of the four-column grid this field occupies. Defaults to 4 — a full row. */
  span?: 1 | 2 | 3 | 4;
  placeholder?: string;
  /** Keyed by enum value. Only read by the option-bearing controls. */
  optionMeta?: Record<string, OptionMeta>;
  order?: number;
  help?: string;
}
