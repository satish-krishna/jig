import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { z } from 'zod';
import { RadioControl } from './radio.control';
import type { FieldSpec } from '../field-spec';

const spec: FieldSpec = {
  key: 'billing',
  kind: 'radio',
  schema: z.enum(['monthly', 'yearly']),
  meta: { label: 'Billing', control: 'radio' },
};

function render(control = new FormControl('')) {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(RadioControl);
  fixture.componentRef.setInput('field', spec);
  fixture.componentRef.setInput('control', control);
  fixture.detectChanges();
  return fixture;
}

describe('RadioControl', () => {
  it('renders one radio per enum value', () => {
    expect(render().nativeElement.querySelectorAll('hlm-radio').length).toBe(2);
  });

  it('projects an indicator into every radio, without which nothing is clickable', () => {
    // hlm-radio's template is <ng-content select="[target],[indicator],hlm-radio-indicator" indicator />.
    // A bare <hlm-radio> mounts and renders no control at all.
    const indicators = render().nativeElement.querySelectorAll('hlm-radio-indicator');
    expect(indicators.length).toBe(2);
  });

  it('ties each label to its radio by inputId rather than nesting it', () => {
    const el = render().nativeElement;
    const label = el.querySelector('label[for="billing-monthly"]');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('monthly');
  });
});
