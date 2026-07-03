import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { z } from 'zod';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import type { FormFieldMeta } from './form-field-meta';
import { applyZodIssues, clearZodIssues, fieldsFromSchema } from './schema-form.util';

function defaultFor(meta: FormFieldMeta): unknown {
  if (meta.control === 'checkbox') return false;
  if (meta.control === 'number') return null;
  return '';
}

/**
 * Dynamic, reactive-forms renderer for a zod schema known only at runtime: it
 * builds a FormGroup from the schema's fields, renders each by its meta.control
 * kind with spartan helm controls, and validates through the zod schema on submit,
 * folding issues back onto the fields. Use this when the schema is not known at
 * compile time (agent-emitted forms, admin/config UIs). For a form you author by
 * hand, prefer the typed signal-forms pattern in features/users/user-form.ts.
 *
 * @capability forms.dynamic-renderer
 * @intent Render any zod schema at runtime; the schema stays the source of truth for shape and validation.
 * @reuse Pass a zod object schema whose fields carry FormFieldMeta; listen to (submitted). Runtime schemas only; author-time forms use signal-forms.
 * @since 0.2.0
 */
@Component({
  selector: 'app-schema-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, HlmFieldImports, HlmInputImports, HlmButtonImports],
  template: `
    <form [formGroup]="form()" (ngSubmit)="onSubmit()">
      @for (field of fields(); track field.name) {
        <hlm-field>
          <label hlmFieldLabel [attr.for]="field.name">{{ field.meta.label }}</label>
          @switch (field.meta.control) {
            @case ('textarea') {
              <textarea hlmInput [id]="field.name" [formControlName]="field.name"
                        [attr.placeholder]="field.meta.placeholder ?? null"></textarea>
            }
            @case ('select') {
              <select hlmInput [id]="field.name" [formControlName]="field.name">
                @for (opt of field.meta.options ?? []; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
            }
            @case ('checkbox') {
              <input type="checkbox" [id]="field.name" [formControlName]="field.name" />
            }
            @default {
              <input hlmInput [type]="field.meta.control" [id]="field.name" [formControlName]="field.name"
                     [attr.placeholder]="field.meta.placeholder ?? null" />
            }
          }
          @if (control(field.name)?.errors?.['zod']; as message) {
            <hlm-field-error [attr.data-error-for]="field.name" forceShow>{{ message }}</hlm-field-error>
          }
        </hlm-field>
      }
      <button hlmBtn type="submit">{{ submitLabel() }}</button>
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

  protected control(name: string) {
    return this.form().get(name);
  }

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
