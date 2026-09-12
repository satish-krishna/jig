import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { z } from 'zod';
import { provideFormControls, type FormControlDefinition } from './control-definition';
import { SchemaFormBuilder } from './schema-form-builder';
import type { FormFieldMeta } from './form-field-meta';

@Component({ template: '' })
class Stub {}

const defs: FormControlDefinition[] = [
  { kind: 'multiselect', component: Stub, defaultValue: () => [],
    matches: (s) => s.def.type === 'array' && (s.def as { element: z.ZodType }).element.def.type === 'enum' },
  { kind: 'array', component: Stub, defaultValue: () => [], matches: (s) => s.def.type === 'array' },
  { kind: 'group', component: Stub, matches: (s) => s.def.type === 'object' },
  { kind: 'checkbox', component: Stub, defaultValue: () => false, matches: (s) => s.def.type === 'boolean' },
  { kind: 'number', component: Stub, defaultValue: () => null, matches: (s) => s.def.type === 'number' },
  { kind: 'text', component: Stub, defaultValue: () => '', matches: (s) => s.def.type === 'string' },
];

function builder(): SchemaFormBuilder {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideFormControls(...defs)] });
  return TestBed.inject(SchemaFormBuilder);
}

const m = (label: string, extra: Partial<FormFieldMeta> = {}) => ({ label, ...extra }) as FormFieldMeta;

describe('SchemaFormBuilder.fieldsFromSchema', () => {
  it('returns children in meta order', () => {
    const schema = z.object({
      b: z.string().meta(m('B', { order: 2 })),
      a: z.string().meta(m('A', { order: 1 })),
    });
    expect(builder().fieldsFromSchema(schema).children?.map((c) => c.key)).toEqual(['a', 'b']);
  });

  it('nests an object field as a group with its own children', () => {
    const schema = z.object({
      address: z.object({ city: z.string().meta(m('City')) }).meta(m('Address')),
    });
    const address = builder().fieldsFromSchema(schema).children?.[0];
    expect(address?.kind).toBe('group');
    expect(address?.children?.map((c) => c.key)).toEqual(['city']);
  });

  it('honors an explicit meta.control override on an object field instead of defaulting to group', () => {
    const schema = z.object({
      address: z.object({ city: z.string().meta(m('City')) }).meta(m('Address', { control: 'text' })),
    });
    const address = builder().fieldsFromSchema(schema).children?.[0];
    expect(address?.kind).toBe('text');
  });

  it('gives an array a single child: the item template, not an instance', () => {
    const schema = z.object({
      contacts: z.array(z.object({ email: z.string().meta(m('Email')) })).meta(m('Contacts')),
    });
    const contacts = builder().fieldsFromSchema(schema).children?.[0];
    expect(contacts?.kind).toBe('array');
    expect(contacts?.children).toHaveLength(1);
    expect(contacts?.children?.[0].kind).toBe('group');
  });

  it('accepts a bare non-root node, which a future union control needs at runtime', () => {
    const spec = builder().fieldsFromSchema(z.string().meta(m('Loose')), 'loose', 'variant.loose');
    expect(spec.kind).toBe('text');
    expect(spec.key).toBe('loose');
  });

  it('names the dotted path when a nested field is unsupported', () => {
    const schema = z.object({
      contacts: z.array(z.object({ kind: z.union([z.string(), z.number()]).meta(m('Kind')) })).meta(m('Contacts')),
    });
    expect(() => builder().fieldsFromSchema(schema)).toThrowError(/contacts\[\]\.kind/);
  });
});

describe('SchemaFormBuilder.buildControl', () => {
  it('builds a FormGroup of FormControls for a flat schema', () => {
    const schema = z.object({
      name: z.string().meta(m('Name')),
      agreed: z.boolean().meta(m('Agreed')),
    });
    const b = builder();
    const control = b.buildControl(b.fieldsFromSchema(schema)) as FormGroup;
    expect(control).toBeInstanceOf(FormGroup);
    expect(control.get('name')).toBeInstanceOf(FormControl);
    expect(control.getRawValue()).toEqual({ name: '', agreed: false });
  });

  it('builds a nested FormGroup for a nested object', () => {
    const schema = z.object({
      address: z.object({ city: z.string().meta(m('City')) }).meta(m('Address')),
    });
    const b = builder();
    const control = b.buildControl(b.fieldsFromSchema(schema)) as FormGroup;
    expect(control.get(['address', 'city'])).toBeInstanceOf(FormControl);
  });

  it('builds an empty FormArray for an array with no minimum', () => {
    const schema = z.object({
      contacts: z.array(z.object({ email: z.string().meta(m('Email')) })).meta(m('Contacts')),
    });
    const b = builder();
    const control = b.buildControl(b.fieldsFromSchema(schema)) as FormGroup;
    const array = control.get('contacts') as FormArray;
    expect(array).toBeInstanceOf(FormArray);
    expect(array.length).toBe(0);
  });

  it('seeds n rows when the array declares a minimum, so it is not invalid before use', () => {
    const schema = z.object({
      contacts: z.array(z.object({ email: z.string().meta(m('Email')) })).min(2).meta(m('Contacts')),
    });
    const b = builder();
    const control = b.buildControl(b.fieldsFromSchema(schema)) as FormGroup;
    expect((control.get('contacts') as FormArray).length).toBe(2);
  });

  it('mints one row from the item template, which is what ArrayControl calls on Add', () => {
    const schema = z.object({
      contacts: z.array(z.object({ email: z.string().meta(m('Email')) })).meta(m('Contacts')),
    });
    const b = builder();
    const itemSpec = b.fieldsFromSchema(schema).children![0].children![0];
    const row = b.buildControl(itemSpec) as FormGroup;
    expect(row.get('email')).toBeInstanceOf(FormControl);
  });
});
