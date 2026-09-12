import { Component, computed, inject, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { z } from 'zod';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { FieldHost } from './controls/field-host';
import { SchemaFormBuilder } from './schema-form-builder';
import { applyZodIssues, clearZodIssues } from './schema-form.util';

/**
 * Dynamic renderer for a zod schema known only at runtime. It builds a control
 * tree from the schema, renders each field through the control registered for
 * its zod type, and validates through the schema on submit, folding issues back
 * onto the matching controls by path.
 *
 * This component knows NOTHING about control kinds. Adding one is a new file
 * plus one entry in controls/index.ts — see ADR on the control registry.
 *
 * For a form you author by hand, prefer signal-forms (features/users/user-form.ts).
 *
 * @capability forms.dynamic-renderer
 * @intent Render any zod schema at runtime; the schema stays the source of truth.
 * @reuse Pass a zod object schema whose fields carry FormFieldMeta; listen to (submitted).
 */
@Component({
  selector: 'app-schema-form',
  imports: [ReactiveFormsModule, FieldHost, HlmFieldImports, HlmButtonImports],
  template: `
    <form [formGroup]="form()" (ngSubmit)="onSubmit()">
      <div hlmFieldGroup data-schema-grid class="grid grid-cols-4 gap-m">
        @for (field of fields(); track field.key) {
          <app-field-host [field]="field" [control]="form().get(field.key)!" />
        }
      </div>
      <button hlmBtn type="submit">{{ submitLabel() }}</button>
    </form>
  `,
  styleUrl: './schema-form.css',
})
export class SchemaForm {
  private readonly builder = inject(SchemaFormBuilder);

  readonly schema = input.required<z.ZodObject<z.ZodRawShape>>();
  readonly submitLabel = input('Save');
  readonly submitted = output<Record<string, unknown>>();

  protected readonly rootSpec = computed(() => this.builder.fieldsFromSchema(this.schema()));
  protected readonly fields = computed(() => this.rootSpec().children ?? []);

  // Rebuilt only when `schema` changes. A schema swap therefore RESETS the form,
  // discarding user input including added array rows. Preserving state across two
  // schema versions is a diffing subsystem and nothing here swaps a schema mid-edit.
  readonly form = computed(() => this.builder.buildControl(this.rootSpec()) as FormGroup);

  onSubmit(): void {
    const form = this.form();
    clearZodIssues(form);
    const result = this.schema().safeParse(form.getRawValue());
    if (result.success) {
      this.submitted.emit(result.data as Record<string, unknown>);
    } else {
      applyZodIssues(form, result.error);
      // The spartan ErrorStateMatcher only reports a control invalid once it is
      // touched, and that flag drives data-matches-spartan-invalid — the attribute
      // the generated helm classes key off for the destructive ring.
      form.markAllAsTouched();
    }
  }
}
