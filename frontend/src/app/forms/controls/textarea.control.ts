import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Multi-line input. Reachable only by an explicit meta.control override — no
 * zod type means "this string is long".
 *
 * @capability forms.control.textarea
 * @intent Override-only kinds carry no matches() predicate.
 * @reuse Set control: 'textarea' on the field's meta.
 */
@Component({
  selector: 'app-textarea-control',
  imports: [ReactiveFormsModule, HlmTextareaImports],
  template: `
    <textarea
      hlmTextarea
      [id]="field().key"
      [formControl]="formControl"
      [attr.placeholder]="field().meta.placeholder ?? null"
    ></textarea>
  `,
})
export class TextareaControl extends SchemaFormControl {}
