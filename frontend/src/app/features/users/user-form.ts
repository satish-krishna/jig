import { Component, output } from '@angular/core';
import { SchemaForm } from '../../forms/schema-form';
import { userFormSchema, type UserFormModel } from './user-form.schema';

/**
 * The user create/edit form. Renders entirely through SchemaForm: the schema
 * carries every field's shape, validation, and control kind, so this component
 * wires nothing per field and holds no form state of its own.
 *
 * This is the shape `npm run slice` emits for a generated feature, and the shape to
 * copy for a new one: `emitForm` in `tools/slice/emit-frontend.ts` produces this file
 * exactly, but for the paragraph you are reading (exemplar prose a generated slice does
 * not inherit) and the "Add user" submit label, which is domain copy the spec cannot
 * carry — ADR 0015 names that difference.
 *
 * It used to bind an `hlm-field` block per field through signal-forms, which is why a
 * `UserFormViewModel` existed to hold the form state `no-state-outside-view-model` would
 * not let a component own. With no state left there is nothing for a ViewModel to hold,
 * and adding a field is now an edit to the schema alone.
 */
@Component({
  selector: 'app-user-form',
  imports: [SchemaForm],
  template: `<app-schema-form [schema]="userFormSchema" submitLabel="Add user" (submitted)="onSubmitted($event)" />`,
})
export class UserForm {
  protected readonly userFormSchema = userFormSchema;
  readonly saved = output<UserFormModel>();

  // SchemaForm.submitted is output<Record<string, unknown>> because it renders a
  // schema it only knows about at runtime; Angular templates have no `as`, so the
  // narrowing to this form's own model has to happen here rather than inline in the
  // binding above. It only ever emits after safeParse against userFormSchema (the
  // very schema passed to it above), so the payload is this model by construction.
  protected onSubmitted(value: Record<string, unknown>): void {
    this.saved.emit(value as UserFormModel);
  }
}
