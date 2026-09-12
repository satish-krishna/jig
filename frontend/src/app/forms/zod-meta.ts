import type { z } from 'zod';
import type { FormFieldMeta } from './form-field-meta';

/** Wrapper types that carry an innerType and no presentation meaning of their own. */
const WRAPPERS = new Set(['optional', 'nullable', 'default', 'catch', 'readonly']);

interface WrapperDef {
  type: string;
  innerType?: z.ZodType;
}

function defOf(schema: z.ZodType): WrapperDef {
  return schema.def as unknown as WrapperDef;
}

/**
 * Strip optional/nullable/default down to the type that decides which control
 * renders. Inference must see `string`, not `optional`.
 */
export function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;
  let def = defOf(current);
  while (WRAPPERS.has(def.type) && def.innerType) {
    current = def.innerType;
    def = defOf(current);
  }
  return current;
}

/**
 * Resolve the meta for one schema node, outermost level winning per key.
 *
 * zod's `.meta()` binds to the schema INSTANCE, so `z.string().meta({...}).optional()`
 * leaves the outer ZodOptional reporting undefined. Reading only the outermost
 * level makes that a TypeError at render time with no indication that the fix
 * is reordering two method calls, so every level is read and merged.
 *
 * @capability forms.zod-meta
 * @intent Field presentation stays on the zod schema; components read it, never duplicate it.
 * @reuse Call resolveMeta(node, path) for one node, or formMeta(objectSchema) for a whole shape.
 */
export function resolveMeta(
  schema: z.ZodType,
  path: string,
  { requireLabel = true }: { requireLabel?: boolean } = {},
): FormFieldMeta {
  const levels: Partial<FormFieldMeta>[] = [];
  let current: z.ZodType | undefined = schema;
  while (current) {
    const meta = current.meta() as Partial<FormFieldMeta> | undefined;
    if (meta) levels.push(meta);
    const def = defOf(current);
    current = WRAPPERS.has(def.type) ? def.innerType : undefined;
  }

  // levels[0] is outermost. Later entries fill only what earlier ones omit.
  const merged: Partial<FormFieldMeta> = {};
  for (const level of levels) {
    for (const [key, value] of Object.entries(level)) {
      if (merged[key as keyof FormFieldMeta] === undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  if (typeof merged.label !== 'string' || merged.label.length === 0) {
    // Two nodes legitimately have no label of their own: the ROOT object, and an
    // array's ITEM TEMPLATE. Neither renders a label — FieldHost guards on it —
    // so demanding one there would assert a rule the design never wanted. Every
    // actual field still fails loudly, which is the guarantee the spec asks for.
    if (!requireLabel) return { ...merged, label: '' } as FormFieldMeta;
    throw new Error(
      `SchemaForm: field "${path}" has no label. Add .meta({ label: '…' }) to it. ` +
        `If you wrote .meta() before .optional(), zod discards it — put .meta() last.`,
    );
  }
  return merged as FormFieldMeta;
}

/** Every field of an object schema with its resolved meta, keyed by field name. */
export function formMeta(schema: z.ZodObject<z.ZodRawShape>): Record<string, FormFieldMeta> {
  const meta: Record<string, FormFieldMeta> = {};
  for (const [name, field] of Object.entries(schema.shape)) {
    meta[name] = resolveMeta(field as z.ZodType, name);
  }
  return meta;
}
