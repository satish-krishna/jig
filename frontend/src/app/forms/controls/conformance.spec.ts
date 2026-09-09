import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Component, Type } from '@angular/core';
import { FormControl } from '@angular/forms';
import { z } from 'zod';
import { DEFAULT_FORM_CONTROLS } from './index';
import type { FieldSpec } from '../field-spec';
import type { SchemaFormControl } from '../schema-form-control';

/**
 * The abstract base guarantees a control DECLARES its inputs. It guarantees
 * nothing about whether the control renders anything. Without this test, a
 * control that renders an empty <div> passes every other spec in the suite and
 * fails only in front of a user.
 */
interface ConformanceSample {
  readonly schema: z.ZodType;
  readonly value: unknown;
  /** Read this control's rendered state back out of the DOM. */
  readonly rendered: (root: HTMLElement) => unknown;
  /** Compare against this instead of `value` when the DOM cannot echo the value verbatim. */
  readonly expected?: unknown;
}

const SAMPLE: Record<string, ConformanceSample> = {
  text: {
    schema: z.string(),
    value: 'typed',
    rendered: (r) => (r.querySelector('input') as HTMLInputElement | null)?.value,
  },
  email: {
    schema: z.string(),
    value: 'a@b.io',
    rendered: (r) => (r.querySelector('input') as HTMLInputElement | null)?.value,
  },
  number: {
    schema: z.number(),
    value: 7,
    rendered: (r) => Number((r.querySelector('input') as HTMLInputElement | null)?.value),
  },
  textarea: {
    schema: z.string(),
    value: 'long',
    rendered: (r) => (r.querySelector('textarea') as HTMLTextAreaElement | null)?.value,
  },
  select: {
    schema: z.enum(['a', 'b']),
    value: 'b',
    rendered: (r) => (r.querySelector('select') as HTMLSelectElement | null)?.value,
  },
  radio: {
    schema: z.enum(['a', 'b']),
    value: 'b',
    // hlm-radio-group wraps brn-radio-group. Each brn-radio has a hidden input with
    // [checked]="_checked()" and [attr.value]="value()". The checked input's value
    // is the selected value.
    rendered: (r) => {
      const checked = r.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;
      return checked?.value ?? null;
    },
  },
  multiselect: {
    schema: z.array(z.enum(['a', 'b'])),
    value: ['a'],
    // hlm-combobox-multiple renders hlm-combobox-chip for each selected value.
    // Each chip is rendered via ng-content with the label, so we read the text content
    // of chips and reconstruct the values by finding matching options.
    rendered: (r) => {
      const chips = [...r.querySelectorAll('hlm-combobox-chip')] as HTMLElement[];
      // The chip text content is the label; for the test, we have a and b as both value and label.
      return chips.map((chip) => chip.textContent?.trim()).filter(Boolean) as string[];
    },
  },
  checkbox: {
    schema: z.boolean(),
    value: true,
    // hlm-checkbox delegates to brn-checkbox, whose inner element carries
    // role="checkbox" and [attr.aria-checked]="_ariaChecked()" — confirmed in
    // node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-checkbox.mjs,
    // where _ariaChecked() returns 'true' | 'false' | 'mixed'. There is no
    // native <input type="checkbox"> in this component's render output.
    rendered: (r) => r.querySelector('[role=checkbox]')?.getAttribute('aria-checked') === 'true',
  },
  date: {
    schema: z.date(),
    value: new Date('2026-01-01T12:00:00Z'),
    // The trigger renders a locale-formatted date, so asserting the exact
    // string would be locale-dependent. Asserting the year appears is
    // locale-proof and still DOM-derived: an unbound control shows only the
    // placeholder, which contains no year. Confirmed in
    // frontend/libs/ui/date-picker/src/lib/hlm-date-picker-trigger.ts: the
    // button element contains a span with _formattedDate() text when a date
    // is set, or ng-content (placeholder) when empty. The button has
    // data-placeholder attribute when no date is selected.
    rendered: (r) => {
      const button = r.querySelector('button') as HTMLButtonElement | null;
      if (!button) return false;
      // If data-placeholder is set, no date is selected
      if (button.hasAttribute('data-placeholder')) return false;
      // A date is selected; check if the year appears in the button text
      return button.textContent?.includes('2026') ?? false;
    },
    expected: true,
  },
};

// Kinds deliberately covered elsewhere rather than by this table.
// `group` and `array` are structural containers exercised end-to-end in
// schema-form.spec.ts and array.control.spec.ts, where a real schema and a
// real form exist to nest into.
const COVERED_ELSEWHERE = new Set(['group', 'array']);

describe('every registered control conforms', () => {
  for (const def of DEFAULT_FORM_CONTROLS) {
    const sample = SAMPLE[def.kind];
    if (!sample) {
      // Not sampled here. Either it is declared COVERED_ELSEWHERE, or the
      // trailing 'every kind ...' test below names it as uncovered — that test
      // is the single mechanism that enforces this, so this loop only skips.
      continue;
    }

    it(`${def.kind} renders an interactive element and reflects its control`, () => {
      const control = new FormControl(def.defaultValue?.(sample.schema) ?? null);
      const field: FieldSpec = {
        key: 'probe',
        kind: def.kind,
        schema: sample.schema,
        meta: { label: 'Probe' },
      };

      TestBed.resetTestingModule();
      const fixture = TestBed.createComponent(def.component as Type<SchemaFormControl>);
      fixture.componentRef.setInput('field', field);
      fixture.componentRef.setInput('control', control);
      fixture.detectChanges();

      const interactive = fixture.nativeElement.querySelector(
        'input, textarea, select, button, [role=checkbox], [role=radio], [role=combobox]',
      );
      expect(interactive, `${def.kind} rendered nothing interactive`).toBeTruthy();

      control.setValue(sample.value);
      fixture.detectChanges();
      const rendered = sample.rendered(fixture.nativeElement);
      const message = `${def.kind} rendered an element but did not reflect its control into the DOM — is [formControl] bound?`;
      const expected = sample.expected ?? sample.value;
      // Use toEqual for reference types (arrays); toBe for primitives.
      if ('multiselect' === def.kind) {
        expect(rendered, message).toEqual(expected);
      } else {
        expect(rendered, message).toBe(expected);
      }
    });
  }

  it('every kind in DEFAULT_FORM_CONTROLS is either sampled or listed as covered elsewhere', () => {
    const sampledKinds = new Set(Object.keys(SAMPLE));
    const coveredKinds = new Set([...sampledKinds, ...COVERED_ELSEWHERE]);
    const registeredKinds = new Set(DEFAULT_FORM_CONTROLS.map((d) => d.kind));

    const uncovered = [...registeredKinds].filter((k) => !coveredKinds.has(k));
    if (uncovered.length > 0) {
      throw new Error(`Uncovered control kinds: ${uncovered.join(', ')}. Add to SAMPLE or COVERED_ELSEWHERE.`);
    }
  });
});
