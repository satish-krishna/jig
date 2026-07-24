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

  it('drives the field into spartan-invalid so the control renders as invalid', () => {
    const fixture = render();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    // data-matches-spartan-invalid is what the generated helm classes key off for
    // the destructive ring and border; without it the control looks untouched
    // while the error text below it says otherwise.
    const field = fixture.nativeElement.querySelector('hlm-field');
    expect(field.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('links the control to its error message for assistive tech', () => {
    const fixture = render();
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#title');
    const error = fixture.nativeElement.querySelector('[data-error-for="title"]');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('stacks its fields through the spartan field group, not flush against each other', () => {
    // The form had no layout at all until the showcase became its first
    // consumer: hlm-field lays out one field internally and says nothing about
    // the gap BETWEEN fields, so every row sat flush. hlmFieldGroup is spartan's
    // own answer to that, which is why this is an attribute and not a class.
    const form = render().nativeElement.querySelector('form');

    expect(form.getAttribute('data-slot')).toBe('field-group');
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
