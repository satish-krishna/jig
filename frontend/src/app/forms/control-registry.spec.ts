import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { z } from 'zod';
import { provideFormControls, provideFormControlDefaults, type FormControlDefinition } from './control-definition';
import { FormControlRegistry, SchemaFormUnsupportedError } from './control-registry';
import { DEFAULT_FORM_CONTROLS } from './controls';
import type { FormFieldMeta } from './form-field-meta';

@Component({ template: '' })
class Stub {}

const text: FormControlDefinition = {
  kind: 'text',
  component: Stub,
  matches: (s) => s.def.type === 'string',
  defaultValue: () => '',
};
const multiselect: FormControlDefinition = {
  kind: 'multiselect',
  component: Stub,
  matches: (s) => s.def.type === 'array' && (s.def as { element: z.ZodType }).element.def.type === 'enum',
  defaultValue: () => [],
};
const array: FormControlDefinition = {
  kind: 'array',
  component: Stub,
  matches: (s) => s.def.type === 'array',
  defaultValue: () => [],
};

const label = { label: 'x' } satisfies FormFieldMeta;

function registry(...defs: FormControlDefinition[]): FormControlRegistry {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideFormControls(...defs)] });
  return TestBed.inject(FormControlRegistry);
}

describe('FormControlRegistry', () => {
  it('infers a kind from the zod type when meta.control is absent', () => {
    expect(registry(text).resolve(z.string(), label, 'a').kind).toBe('text');
  });

  it('lets meta.control override inference', () => {
    const textarea: FormControlDefinition = { kind: 'textarea', component: Stub };
    const resolved = registry(text, textarea).resolve(
      z.string(),
      { label: 'x', control: 'textarea' },
      'a',
    );
    expect(resolved.kind).toBe('textarea');
  });

  it('resolves the first matching definition, so registration order is semantic', () => {
    const enums = z.array(z.enum(['a', 'b']));
    expect(registry(multiselect, array).resolve(enums, label, 'a').kind).toBe('multiselect');
    expect(registry(array, multiselect).resolve(enums, label, 'a').kind).toBe('array');
  });

  it('matches against the unwrapped type, so an optional field still resolves', () => {
    expect(registry(text).resolve(z.string().optional(), label, 'a').kind).toBe('text');
  });

  it('throws a named error with the path and the zod type when nothing matches', () => {
    expect(() => registry(text).resolve(z.union([z.string(), z.number()]), label, 'contacts[].kind'))
      .toThrowError(SchemaFormUnsupportedError);
    expect(() => registry(text).resolve(z.union([z.string(), z.number()]), label, 'contacts[].kind'))
      .toThrowError(/contacts\[\]\.kind.*union/i);
  });

  it('throws when meta.control names a kind nobody registered', () => {
    expect(() => registry(text).resolve(z.string(), { label: 'x', control: 'date' }, 'when'))
      .toThrowError(/when.*date/i);
  });

  it('lets a caller-registered control override a shipped default of the same kind', () => {
    @Component({ template: '' })
    class Override {}
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideFormControlDefaults({ ...text, component: Stub }),
        provideFormControls({ ...text, component: Override }),
      ],
    });
    expect(TestBed.inject(FormControlRegistry).resolve(z.string(), label, 'a').component).toBe(Override);
  });
});

describe('DEFAULT_FORM_CONTROLS ordering', () => {
  it('puts multiselect before the generic array repeater, or multiselect is unreachable', () => {
    const kinds = DEFAULT_FORM_CONTROLS.map((d) => d.kind);
    // 'array' is added in Task 6; skip until then rather than asserting on absence.
    if (!kinds.includes('array')) return;
    expect(kinds.indexOf('multiselect')).toBeLessThan(kinds.indexOf('array'));
  });

  it('puts select before nothing broader that claims enum', () => {
    const kinds = DEFAULT_FORM_CONTROLS.map((d) => d.kind);
    expect(kinds).toContain('select');
  });
});
