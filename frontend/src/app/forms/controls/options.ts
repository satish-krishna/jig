import type { z } from 'zod';
import type { FieldSpec } from '../field-spec';

export interface RenderedOption {
  readonly value: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly description?: string;
  readonly icon?: string;
}

/**
 * The options of an enum-backed field. Values come from the zod type — never
 * from meta — so validity and the offered choices cannot disagree. optionMeta
 * supplies only the human-facing extras, and a value with no entry falls back
 * to using itself as its label.
 *
 * @capability forms.control-options
 * @intent Option values are owned by z.enum; meta owns only the words.
 * @reuse Call from any option-bearing control with its FieldSpec.
 */
export function optionsOf(spec: FieldSpec): readonly RenderedOption[] {
  const enumSchema = spec.kind === 'multiselect'
    ? (spec.schema.def as unknown as { element: z.ZodType }).element
    : spec.schema;
  const entries = (enumSchema.def as unknown as { entries?: Record<string, string> }).entries ?? {};
  const values = Object.values(entries);
  const meta = spec.meta.optionMeta ?? {};

  return values.map((value) => ({
    value,
    label: meta[value]?.label ?? value,
    disabled: meta[value]?.disabled ?? false,
    description: meta[value]?.description,
    icon: meta[value]?.icon,
  }));
}
