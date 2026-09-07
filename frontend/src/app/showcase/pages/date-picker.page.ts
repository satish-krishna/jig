import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Date picker usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/date-picker: content lives behind hlm-popover's own
 * portal (BrnPopover under the hood) and is not in the DOM until the trigger
 * opens it. hlm-date-picker-trigger's button carries `brnFieldControlDescribedBy`
 * directly in its own template, so it wires aria-describedby the same way
 * input.page's control does. No global DateAdapter is provided app-wide (no
 * `provideNativeDateAdapter()` in app.config), so this page provides one
 * itself — required for hlm-calendar's internal `injectDateAdapter()` to
 * resolve.
 *
 * MCP-vs-source disagreement: the docs' input-example passes a
 * `[formatInputDate]` input to hlm-date-picker-input, but that input does not
 * exist on the vendored HlmDatePickerInput (frontend/libs/ui/date-picker) —
 * only `inputValue`/`parseDate` do. Not used here.
 */
@Component({
  selector: 'app-date-picker-page',
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmDatePickerImports, HlmFieldImports],
  template: `
    <app-component-page slug="date-picker">
      <app-usage title="Default" note="A button trigger, constrained between min and max." [code]="codeDefault">
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="date-default">Date of birth</label>
          <hlm-date-picker [min]="minDate" [max]="maxDate" [autoCloseOnSelect]="true">
            <hlm-date-picker-trigger buttonId="date-default">Pick a date</hlm-date-picker-trigger>
          </hlm-date-picker>
        </hlm-field>
      </app-usage>

      <app-usage title="Text input" note="hlm-date-picker-input accepts typed dates as well as picked ones." [code]="codeInput">
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="date-input">Date of birth</label>
          <hlm-date-picker [max]="maxDate">
            <hlm-date-picker-input inputId="date-input" placeholder="Type or pick a date" />
          </hlm-date-picker>
        </hlm-field>
      </app-usage>

      <app-usage title="Dropdown navigation" note="captionLayout=dropdown swaps the header for month/year selects." [code]="codeDropdown">
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="date-dropdown">Date of birth</label>
          <hlm-date-picker captionLayout="dropdown" [min]="minDate" [max]="maxDate">
            <hlm-date-picker-trigger buttonId="date-dropdown">Pick a date</hlm-date-picker-trigger>
          </hlm-date-picker>
        </hlm-field>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a date and the error clears."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="date-validated">Date of birth</label>
          <hlm-date-picker [max]="maxDate" [formControl]="birthday" [autoCloseOnSelect]="true">
            <hlm-date-picker-trigger buttonId="date-validated">Pick a date</hlm-date-picker-trigger>
          </hlm-date-picker>
          <hlm-field-error>Please select a date.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class DatePickerPage {
  protected readonly minDate = new Date(2023, 0, 1);
  protected readonly maxDate = new Date(2030, 11, 31);

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly birthday = new FormControl<Date | null>(null, { validators: [Validators.required] });

  constructor() {
    this.birthday.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-field>
  <label hlmFieldLabel for="date">Date of birth</label>
  <hlm-date-picker [min]="minDate" [max]="maxDate" [autoCloseOnSelect]="true">
    <hlm-date-picker-trigger buttonId="date">Pick a date</hlm-date-picker-trigger>
  </hlm-date-picker>
</hlm-field>`;

  protected readonly codeInput = `<hlm-date-picker [max]="maxDate">
  <hlm-date-picker-input inputId="date-input" placeholder="Type or pick a date" />
</hlm-date-picker>`;

  protected readonly codeDropdown = `<hlm-date-picker captionLayout="dropdown" [min]="minDate" [max]="maxDate">
  <hlm-date-picker-trigger buttonId="date">Pick a date</hlm-date-picker-trigger>
</hlm-date-picker>`;

  protected readonly codeValidated = `birthday = new FormControl<Date | null>(null, { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="date">Date of birth</label>
  <hlm-date-picker [max]="maxDate" [formControl]="birthday" [autoCloseOnSelect]="true">
    <hlm-date-picker-trigger buttonId="date">Pick a date</hlm-date-picker-trigger>
  </hlm-date-picker>
  <hlm-field-error>Please select a date.</hlm-field-error>
</hlm-field>`;
}
