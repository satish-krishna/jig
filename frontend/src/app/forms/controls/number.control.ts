import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Single-line numeric input. `type` is STATIC here, not bound: Angular's
 * NumberValueAccessor matches only the static selector `input[type=number]`,
 * so a bound `[type]` (as TextControl uses to share one component across
 * kinds) falls through to DefaultValueAccessor and hands the control a
 * string — a plain z.number() field would then fail safeParse forever. A
 * static type keeps NumberValueAccessor in the mix so the control holds a
 * genuine number.
 *
 * @capability forms.control.number
 * @intent A bound `[type]="'number'"` looks equivalent to a static one but is not.
 * @reuse Registered as the `number` kind in controls/index.ts.
 */
@Component({
  selector: 'app-number-control',
  imports: [ReactiveFormsModule, HlmInputImports],
  template: `
    <input
      hlmInput
      type="number"
      [id]="controlId()"
      [formControl]="formControl"
      [attr.placeholder]="field().meta.placeholder ?? null"
    />
  `,
})
export class NumberControl extends SchemaFormControl {}
