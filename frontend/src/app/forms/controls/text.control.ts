import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Single-line input. Serves text, email and number: the kind IS the input type,
 * which is why one component covers three registered kinds.
 *
 * @capability forms.control.text
 * @intent One component per input shape, not per zod type.
 * @reuse Registered as three definitions in controls/index.ts.
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
