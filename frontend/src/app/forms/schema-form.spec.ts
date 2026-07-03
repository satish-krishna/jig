import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SchemaForm } from './schema-form';
import { fieldsFromSchema } from './schema-form.util';
import { userFormSchema } from '../features/users/user-form.schema';

describe('fieldsFromSchema', () => {
  it('extracts fields in meta order with their control kinds', () => {
    const fields = fieldsFromSchema(userFormSchema);
    expect(fields.map((f) => f.name)).toEqual(['name', 'email']);
    expect(fields[0].meta.control).toBe('text');
    expect(fields[1].meta.control).toBe('email');
  });
});

describe('SchemaForm', () => {
  function render() {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(SchemaForm);
    fixture.componentRef.setInput('schema', userFormSchema);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one control per schema field', () => {
    const fixture = render();
    const inputs = fixture.nativeElement.querySelectorAll('input');
    expect(inputs.length).toBe(2);
  });

  it('a safeParse failure surfaces on the matching field', () => {
    const fixture = render();

    fixture.componentInstance.onSubmit(); // empty form fails both rules
    fixture.detectChanges();

    const nameError = fixture.nativeElement.querySelector('[data-error-for="name"]');
    expect(nameError).toBeTruthy();
    expect(nameError.textContent).toContain('Name is required');
  });

  it('emits the parsed value when the form is valid', () => {
    const fixture = render();
    let emitted: Record<string, unknown> | undefined;
    fixture.componentInstance.submitted.subscribe((v) => (emitted = v));

    fixture.componentInstance.form().setValue({ name: 'Ada', email: 'ada@x.io' });
    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual({ name: 'Ada', email: 'ada@x.io' });
  });
});
