import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { formMeta, resolveMeta, unwrap } from './zod-meta';
import type { FormFieldMeta } from './form-field-meta';

describe('unwrap', () => {
  it('strips optional, nullable and default down to the inner type', () => {
    expect(unwrap(z.string().optional()).def.type).toBe('string');
    expect(unwrap(z.string().nullable()).def.type).toBe('string');
    expect(unwrap(z.string().default('x')).def.type).toBe('string');
    expect(unwrap(z.string().optional().nullable()).def.type).toBe('string');
  });

  it('leaves an unwrapped type alone', () => {
    expect(unwrap(z.number()).def.type).toBe('number');
  });
});

describe('resolveMeta', () => {
  it('reads meta written on the outermost schema', () => {
    const schema = z.string().optional().meta({ label: 'C' } satisfies FormFieldMeta);
    expect(resolveMeta(schema, 'c').label).toBe('C');
  });

  it('recovers meta written before a wrapper, which zod otherwise discards', () => {
    // z.string().meta({...}).optional() binds meta to the INNER instance, so
    // the outer ZodOptional reports undefined. Without this recovery the
    // renderer dereferences undefined and dies with no usable message.
    const schema = z.string().meta({ label: 'B' } satisfies FormFieldMeta).optional();
    expect(schema.meta()).toBeUndefined();
    expect(resolveMeta(schema, 'b').label).toBe('B');
  });

  it('lets the outermost meta win when both levels carry one', () => {
    const schema = z
      .string()
      .meta({ label: 'inner', span: 1 } satisfies FormFieldMeta)
      .optional()
      .meta({ label: 'outer' } satisfies FormFieldMeta);
    const meta = resolveMeta(schema, 'x');
    expect(meta.label).toBe('outer');
    expect(meta.span).toBe(1); // inner keys survive where outer is silent
  });

  it('throws a named error when no level carries a label', () => {
    expect(() => resolveMeta(z.string(), 'nickname')).toThrowError(
      /nickname.*label/i,
    );
  });

  it('allows a missing label where the caller says none is required', () => {
    // The root object and an array's item template render no label of their own.
    expect(resolveMeta(z.object({}), '<root>', { requireLabel: false }).label).toBe('');
  });
});

describe('formMeta', () => {
  it('returns one resolved meta per field of an object schema', () => {
    const schema = z.object({
      title: z.string().meta({ label: 'Title' } satisfies FormFieldMeta),
      bio: z.string().meta({ label: 'Bio' } satisfies FormFieldMeta).optional(),
    });
    expect(Object.keys(formMeta(schema))).toEqual(['title', 'bio']);
    expect(formMeta(schema)['bio'].label).toBe('Bio');
  });
});
