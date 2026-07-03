import type { FormGroup } from '@angular/forms';
import type { z } from 'zod';
import type { FormFieldMeta } from './form-field-meta';

/** One rendered field: its control name plus the presentation meta from the schema. */
export interface FieldSpec {
  name: string;
  meta: FormFieldMeta;
}

/** Read the fields and their meta off a zod object schema, ordered by meta.order. */
export function fieldsFromSchema(schema: z.ZodObject<z.ZodRawShape>): FieldSpec[] {
  return Object.entries(schema.shape)
    .map(([name, field]) => ({ name, meta: (field as z.ZodType).meta() as unknown as FormFieldMeta }))
    .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));
}

/** Fold a zod issue tree back onto the matching controls so the view can show it. */
export function applyZodIssues(form: FormGroup, error: z.ZodError): void {
  for (const issue of error.issues) {
    const control = form.get(String(issue.path[0]));
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), zod: issue.message });
    }
  }
}

/** Remove any prior zod errors before re-validating, leaving other errors intact. */
export function clearZodIssues(form: FormGroup): void {
  for (const control of Object.values(form.controls)) {
    if (control.errors?.['zod']) {
      const { zod, ...rest } = control.errors;
      control.setErrors(Object.keys(rest).length ? rest : null);
    }
  }
}
