import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Single-line input. Serves text and email: the kind IS the input type,
 * which is why one component covers both registered kinds. Number is NOT
 * routed here — a bound `[type]` never activates Angular's
 * NumberValueAccessor (it selects on the static attribute `input[type=number]`),
 * so a numeric input needs a static `type="number"`, which is NumberControl's
 * whole reason to exist.
 *
 * @capability forms.control.text
 * @intent One component per input shape, not per zod type.
 * @reuse Registered as two definitions in controls/index.ts.
 */
@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule, HlmInputImports],
  template: `
    <input
      hlmInput
      [type]="field().kind"
      [id]="controlId()"
      [formControl]="formControl"
      [attr.placeholder]="field().meta.placeholder ?? null"
    />
  `,
})
export class TextControl extends SchemaFormControl {}
