import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { z } from 'zod';
import { NumberControl } from './number.control';
import type { FieldSpec } from '../field-spec';

const spec: FieldSpec = {
  key: 'age',
  kind: 'number',
  schema: z.number(),
  meta: { label: 'Age' },
};

function render(control = new FormControl<number | null>(null)) {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(NumberControl);
  fixture.componentRef.setInput('field', spec);
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return { fixture, control };
}

describe('NumberControl', () => {
  it('renders a static type="number" input, not a bound one', () => {
    const input = render().fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('number');
  });

  it('round-trips a plain z.number() field as a genuine number, so safeParse succeeds', () => {
    // Plain z.number() (uncoerced) is the failing case this control exists to
    // fix: NumberValueAccessor only binds to the STATIC selector
    // input[type=number]. TextControl bound [type]="field().kind", which
    // Angular does not match against that selector, so DefaultValueAccessor
    // won for every kind including 'number' and handed the control a string
    // forever — a form that renders correctly and can never submit.
    const { fixture, control } = render();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = '42';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(control.value).toBe(42);
    expect(typeof control.value).toBe('number');

    const schema = z.object({ age: z.number() });
    const result = schema.safeParse({ age: control.value });
    expect(result.success).toBe(true);
  });
});
