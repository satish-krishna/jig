import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { z } from 'zod';
import { SelectControl } from './select.control';
import type { FieldSpec } from '../field-spec';

const spec: FieldSpec = {
  key: 'tier',
  kind: 'select',
  schema: z.enum(['free', 'pro', 'legacy']),
  meta: { label: 'Tier', optionMeta: { free: { label: 'Free tier' }, legacy: { disabled: true } } },
};

function render(control = new FormControl('')) {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(SelectControl);
  fixture.componentRef.setInput('field', spec);
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return fixture;
}

describe('SelectControl', () => {
  it('renders one option per enum value, with no options in the meta', () => {
    const options = render().nativeElement.querySelectorAll('option');
    expect(options.length).toBe(3);
    expect([...options].map((o: HTMLOptionElement) => o.value)).toEqual(['free', 'pro', 'legacy']);
  });

  it('uses optionMeta.label when present and the value itself when absent', () => {
    const options = [...render().nativeElement.querySelectorAll('option')] as HTMLOptionElement[];
    expect(options[0].textContent?.trim()).toBe('Free tier');
    expect(options[1].textContent?.trim()).toBe('pro');
  });

  it('renders a disabled option the user cannot select', () => {
    const options = [...render().nativeElement.querySelectorAll('option')] as HTMLOptionElement[];
    expect(options[2].disabled).toBe(true);
  });

  it('writes the picked value back to its control', () => {
    const control = new FormControl('');
    const fixture = render(control);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'pro';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(control.value).toBe('pro');
  });
});
