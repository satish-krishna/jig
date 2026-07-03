import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { z } from 'zod';
import type { FormFieldMeta } from './form-field-meta';
import { applyZodIssues, clearZodIssues, fieldsFromSchema } from './schema-form.util';

function defaultFor(meta: FormFieldMeta): unknown {
  if (meta.control === 'checkbox') return false;
  if (meta.control === 'number') return null;
  return '';
}

/**
 * The one place a zod field plus its meta becomes a control. Builds a reactive
 * form from the schema, renders each field by its control kind, and validates
 * through `schema.safeParse` once, folding zod issues back onto the controls.
 * Adding a control kind means extending the @switch here, never in a feature.
 *
 * To adopt spartan-ng later, replace the control templates inside the @switch;
 * nothing outside this component knows what a control looks like (see ADR 0006).
 *
 * @capability forms.schema-renderer
 * @intent Build every form from one zod schema; never hand-wire FormControls in a feature.
 * @reuse Pass a zod object schema whose fields carry FormFieldMeta; listen to (submitted).
 * @since 0.1.0
 */
@Component({
  selector: 'app-schema-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <form [formGroup]="form()" (ngSubmit)="onSubmit()">
      @for (field of fields(); track field.name) {
        <div class="field">
          <label [attr.for]="field.name">{{ field.meta.label }}</label>
          @switch (field.meta.control) {
            @case ('textarea') {
              <textarea [id]="field.name" [formControlName]="field.name"
                        [attr.placeholder]="field.meta.placeholder ?? null"></textarea>
            }
            @case ('select') {
              <select [id]="field.name" [formControlName]="field.name">
                @for (opt of field.meta.options ?? []; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @case ('checkbox') {
              <input type="checkbox" [id]="field.name" [formControlName]="field.name" />
            }
            @default {
              <input [type]="field.meta.control" [id]="field.name" [formControlName]="field.name"
                     [attr.placeholder]="field.meta.placeholder ?? null" />
            }
          }
          @if (form().get(field.name)?.errors?.['zod']; as message) {
            <p class="error" [attr.data-error-for]="field.name">{{ message }}</p>
          }
        </div>
      }
      <button type="submit">{{ submitLabel() }}</button>
    </form>
  `,
})
export class SchemaForm {
  readonly schema = input.required<z.ZodObject<z.ZodRawShape>>();
  readonly submitLabel = input('Save');
  readonly submitted = output<Record<string, unknown>>();

  readonly fields = computed(() => fieldsFromSchema(this.schema()));

  readonly form = computed(() => {
    const controls: Record<string, FormControl> = {};
    for (const field of this.fields()) {
      controls[field.name] = new FormControl(defaultFor(field.meta));
    }
    return new FormGroup(controls);
  });

  onSubmit(): void {
    const form = this.form();
    clearZodIssues(form);
    const result = this.schema().safeParse(form.getRawValue());
    if (result.success) {
      this.submitted.emit(result.data as Record<string, unknown>);
    } else {
      applyZodIssues(form, result.error);
    }
  }
}
