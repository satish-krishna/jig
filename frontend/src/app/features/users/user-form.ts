import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormField, form, submit, validateStandardSchema } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { formMeta } from '../../forms/zod-meta';
import { userFormSchema, type UserFormModel } from './user-form.schema';

/**
 * Create/edit user form, built on Angular signal-forms with spartan helm controls.
 * The zod schema stays the single source of truth: validation flows through
 * validateStandardSchema (zod is a Standard Schema, so Angular validates it
 * natively) and the field labels come from the schema's `.meta()`. Copy this shape
 * for a new feature form; only the schema and the field bindings change.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, HlmFieldImports, HlmInputImports, HlmButtonImports],
  template: `
    <form (submit)="onSubmit($event)" class="user-form">
      <hlm-field>
        <label hlmFieldLabel for="name">{{ meta['name'].label }}</label>
        <input hlmInput id="name" [formField]="form.name" [attr.placeholder]="meta['name'].placeholder ?? null" />
        <!-- No touched() guard: hlm-field-error already gates itself on the field's
             error state, and only registers its id with the control's
             aria-describedby while showing. Guarding it here would hide it from
             assistive tech as well as from sight. -->
        @for (error of form.name().errors(); track error.kind) {
          <hlm-field-error data-error-for="name">{{ error.message }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field>
        <label hlmFieldLabel for="email">{{ meta['email'].label }}</label>
        <input hlmInput id="email" [formField]="form.email" [attr.placeholder]="meta['email'].placeholder ?? null" />
        @for (error of form.email().errors(); track error.kind) {
          <hlm-field-error data-error-for="email">{{ error.message }}</hlm-field-error>
        }
      </hlm-field>

      <button hlmBtn type="submit">Add user</button>
    </form>
  `,
})
export class UserForm {
  readonly saved = output<UserFormModel>();

  protected readonly model = signal<UserFormModel>({ name: '', email: '' });
  protected readonly form = form(this.model, (path) => validateStandardSchema(path, userFormSchema));
  protected readonly meta = formMeta(userFormSchema);

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.form.name().markAsTouched();
    this.form.email().markAsTouched();
    await submit(this.form, async () => {
      this.saved.emit(this.model());
    });
  }
}
