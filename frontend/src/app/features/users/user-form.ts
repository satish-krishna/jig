import { Component, output } from '@angular/core';
import { SchemaForm } from '../../forms/schema-form';
import { userFormSchema, type UserFormModel } from './user-form.schema';

/**
 * The form that adds users. Renders entirely through SchemaForm: the schema
 * carries every field's shape, validation, and control kind, so this component
 * wires nothing per field and holds no form state of its own.
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
