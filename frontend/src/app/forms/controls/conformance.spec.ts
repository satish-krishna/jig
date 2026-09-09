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
const SAMPLE: Record<string, { schema: z.ZodType; value: unknown }> = {
  text: { schema: z.string(), value: 'typed' },
  email: { schema: z.string(), value: 'a@b.io' },
  number: { schema: z.number(), value: 7 },
  textarea: { schema: z.string(), value: 'long' },
  checkbox: { schema: z.boolean(), value: true },
};

describe('every registered control conforms', () => {
  for (const def of DEFAULT_FORM_CONTROLS) {
    const sample = SAMPLE[def.kind];
    if (!sample) continue; // group and array are covered by schema-form.spec.ts

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
      expect(control.value).toBe(sample.value);
    });
  }
});
