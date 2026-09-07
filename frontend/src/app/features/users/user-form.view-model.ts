import { Injectable, signal } from '@angular/core';
import { form, submit, validateStandardSchema } from '@angular/forms/signals';
import { userFormSchema, type UserFormModel } from './user-form.schema';

/**
 * ViewModel for the create/edit user form. Owns the model signal and the
 * signal-form built on it, plus the submit workflow: mark the fields touched
 * so validation messages show, then run Angular's own submit() gate.
 *
 * It has no idea an `output()` exists — that stays on the component, which is
 * the only place `output()` works. `submit()` here resolves to the validated
 * model on success, or null when validation blocked it, so the component can
 * decide whether to emit without knowing anything about form internals.
 *
 * Copy frontend/src/app/features/users/user-list.view-model.ts for the general
 * shape; this one has no repository because saving is the parent view's job.
 */
@Injectable()
export class UserFormViewModel {
  readonly model = signal<UserFormModel>({ name: '', email: '' });
  readonly form = form(this.model, (path) => validateStandardSchema(path, userFormSchema));

  async submit(): Promise<UserFormModel | null> {
    this.form.name().markAsTouched();
    this.form.email().markAsTouched();

    let result: UserFormModel | null = null;
    await submit(this.form, async () => {
      result = this.model();
    });
    return result;
  }
}
