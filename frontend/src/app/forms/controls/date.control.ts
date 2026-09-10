import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { SchemaFormControl } from '../schema-form-control';

/**
 * Date picker. It provides its own DateAdapter because app.config.ts has no
 * provideNativeDateAdapter() and hlm-calendar's internal injectDateAdapter()
 * cannot resolve without one. Providing it here means registering this control
 * never requires editing app config — which is the point of the registry.
 *
 * @capability forms.control.date
 * @intent z.date() infers a picker; the control carries its own adapter dependency.
 * @reuse Registered in controls/index.ts. Nothing else needs changing to use it.
 */
@Component({
  selector: 'app-date-control',
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, HlmDatePickerImports],
  template: `
    <hlm-date-picker [formControl]="formControl" [autoCloseOnSelect]="true">
      <hlm-date-picker-trigger [buttonId]="controlId()">
        {{ field().meta.placeholder ?? 'Pick a date' }}
      </hlm-date-picker-trigger>
    </hlm-date-picker>
  `,
})
export class DateControl extends SchemaFormControl {}
