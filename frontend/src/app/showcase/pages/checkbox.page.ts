import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Checkbox usages. Anatomy confirmed against the spartan MCP docs: the control
 * is self-closing and the label is a SIBLING tied to it by `inputId` — never
 * content inside the component.
 */
@Component({
  selector: 'app-checkbox-page',
  imports: [
    ReactiveFormsModule,
    ComponentPage,
    Usage,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmLabelImports,
  ],
  template: `
    <app-component-page slug="checkbox">
      <app-usage
        title="Default"
        note="The label is a sibling, paired by inputId — not projected content."
        [code]="codeDefault"
      >
        <div class="flex items-center gap-m">
          <hlm-checkbox inputId="cb-terms" />
          <label hlmLabel for="cb-terms">Accept terms and conditions</label>
        </div>
      </app-usage>

      <app-usage title="States" note="Checked, indeterminate and disabled." [code]="codeStates">
        <div class="flex items-center gap-m">
          <hlm-checkbox inputId="cb-on" [checked]="true" />
          <label hlmLabel for="cb-on">Checked</label>
        </div>
        <div class="flex items-center gap-m">
          <hlm-checkbox inputId="cb-mixed" [(indeterminate)]="mixed" />
          <label hlmLabel for="cb-mixed">Indeterminate</label>
        </div>
        <div class="flex items-center gap-m">
          <hlm-checkbox inputId="cb-off" disabled />
          <label hlmLabel for="cb-off">Disabled</label>
        </div>
      </app-usage>

      <app-usage
        title="In a field"
        note="hlmField orientation=horizontal gives the label and description their layout."
        [code]="codeField"
      >
        <div hlmField orientation="horizontal" class="max-w-sm">
          <hlm-checkbox inputId="cb-news" />
          <div hlmFieldContent>
            <label hlmFieldLabel for="cb-news">Product updates</label>
            <p hlmFieldDescription>At most one email a month. Unsubscribe any time.</p>
          </div>
        </div>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — tick it and the error clears on its own."
        [code]="codeValidated"
      >
        <div hlmField class="max-w-sm">
          <div class="flex items-center gap-m">
            <hlm-checkbox inputId="cb-required" [formControl]="accepted" />
            <label hlmFieldLabel for="cb-required">I accept the terms</label>
          </div>
          <hlm-field-error>You must accept the terms to continue.</hlm-field-error>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class CheckboxPage {
  protected readonly mixed = signal(true);

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly accepted = new FormControl(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });

  constructor() {
    this.accepted.markAsTouched();
  }

  protected readonly codeDefault = `<div class="flex items-center gap-m">
  <hlm-checkbox inputId="cb-terms" />
  <label hlmLabel for="cb-terms">Accept terms and conditions</label>
</div>`;

  protected readonly codeStates = `<hlm-checkbox inputId="cb-on" [checked]="true" />
<hlm-checkbox inputId="cb-mixed" [(indeterminate)]="mixed" />
<hlm-checkbox inputId="cb-off" disabled />`;

  protected readonly codeField = `<div hlmField orientation="horizontal">
  <hlm-checkbox inputId="cb-news" />
  <div hlmFieldContent>
    <label hlmFieldLabel for="cb-news">Product updates</label>
    <p hlmFieldDescription>At most one email a month.</p>
  </div>
</div>`;

  protected readonly codeValidated = `// hlm-checkbox is a ControlValueAccessor, so it binds directly.
accepted = new FormControl(false, { validators: [Validators.requiredTrue] });

<div hlmField>
  <div class="flex items-center gap-m">
    <hlm-checkbox inputId="cb-required" [formControl]="accepted" />
    <label hlmFieldLabel for="cb-required">I accept the terms</label>
  </div>
  <hlm-field-error>You must accept the terms to continue.</hlm-field-error>
</div>`;
}
