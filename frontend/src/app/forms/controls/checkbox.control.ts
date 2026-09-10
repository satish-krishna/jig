import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Boolean control. hlm-checkbox implements ControlValueAccessor, so
 * [formControl] binds directly.
 *
 * @capability forms.control.checkbox
 * @intent z.boolean() infers a checkbox with no meta required.
 * @reuse Registered in controls/index.ts; override with control: 'switch' once one exists.
 */
@Component({
  selector: 'app-checkbox-control',
  imports: [ReactiveFormsModule, HlmCheckboxImports],
  template: `<hlm-checkbox [inputId]="controlId()" [formControl]="formControl" />`,
})
export class CheckboxControl extends SchemaFormControl {}
