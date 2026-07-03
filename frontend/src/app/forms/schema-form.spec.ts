import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { z } from 'zod';
import { SchemaForm } from './schema-form';
import { fieldsFromSchema } from './schema-form.util';
import type { FormFieldMeta } from './form-field-meta';

const testSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .meta({ label: 'Title', control: 'text', order: 1 } satisfies FormFieldMeta),
  bio: z.string().meta({ label: 'Bio', control: 'textarea', order: 2 } satisfies FormFieldMeta),
});

describe('fieldsFromSchema', () => {
  it('returns fields in meta order', () => {
    expect(fieldsFromSchema(testSchema).map((f) => f.name)).toEqual(['title', 'bio']);
  });
});

describe('SchemaForm (dynamic renderer)', () => {
  function render() {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(SchemaForm);
    fixture.componentRef.setInput('schema', testSchema);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a control per schema field, honouring the control kind', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelectorAll('input, textarea, select').length).toBe(2);
    expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
  });

  it('surfaces a zod failure on the matching field', () => {
    const fixture = render();
    fixture.componentInstance.onSubmit(); // empty title violates the schema
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('[data-error-for="title"]');
    expect(err).toBeTruthy();
    expect(err.textContent).toContain('Title is required');
  });

  it('emits the parsed value when the schema passes', () => {
    const fixture = render();
    let emitted: Record<string, unknown> | undefined;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));
    fixture.componentInstance.form().setValue({ title: 'Hello', bio: 'hi' });
    fixture.componentInstance.onSubmit();
    expect(emitted).toEqual({ title: 'Hello', bio: 'hi' });
  });
});
