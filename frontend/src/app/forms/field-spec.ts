import type { z } from 'zod';
import type { ControlKind, FormFieldMeta } from './form-field-meta';

/**
 * One node of the render tree: which control draws it, the zod node it came
 * from, and its resolved presentation meta.
 *
 * There is deliberately no path and no index. A control receives its live
 * AbstractControl as an input, so it never needs to know where it sits; paths
 * exist only inside applyZodIssues, which walks zod's own issue paths.
 *
 * For a `group`, `children` is its fields. For an `array`, `children` holds
 * exactly ONE entry — the item TEMPLATE, not an instance. ArrayControl calls
 * buildControl on it to mint each row.
 *
 * @capability forms.field-spec
 * @intent The render tree is data derived from the schema, never hand-authored.
 * @reuse Produced by SchemaFormBuilder.fieldsFromSchema; consumed by SchemaForm and every control.
 */
export interface FieldSpec {
  readonly key: string;
  readonly kind: ControlKind;
  /** The UNWRAPPED zod node. Controls read enum values and bounds from here. */
  readonly schema: z.ZodType;
  readonly meta: FormFieldMeta;
  readonly children?: readonly FieldSpec[];
}
