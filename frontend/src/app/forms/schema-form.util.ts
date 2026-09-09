import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import type { z } from 'zod';

/**
 * Fold a zod issue tree back onto the matching controls. Angular's get()
 * accepts Array<string | number> and walks FormGroup and FormArray alike, and
 * zod hands back issue.path in exactly that shape — so a nested or indexed
 * issue needs no special handling.
 */
export function applyZodIssues(form: FormGroup, error: z.ZodError): void {
  for (const issue of error.issues) {
    const path = issue.path.filter((p): p is string | number => typeof p !== 'symbol');
    const control = path.length ? form.get(path) : form;
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), zod: issue.message });
    }
  }
}

/** Remove any prior zod errors from the whole tree, leaving other errors intact. */
export function clearZodIssues(control: AbstractControl): void {
  if (control.errors?.['zod']) {
    const { zod, ...rest } = control.errors;
    control.setErrors(Object.keys(rest).length ? rest : null);
  }
  if (control instanceof FormGroup) {
    for (const child of Object.values(control.controls)) clearZodIssues(child);
  } else if (control instanceof FormArray) {
    for (const child of control.controls) clearZodIssues(child);
  }
}
