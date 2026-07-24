import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Input usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/input: `[hlmInput]` hosts BrnInput (id/forceInvalid) plus
 * BrnFieldControlDescribedBy, so it self-registers aria-describedby with an
 * ancestor hlm-field — no manual wiring needed.
 */
@Component({
  selector: 'app-input-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmInputImports, HlmFieldImports],
  template: `
    <app-component-page slug="input">
      <app-usage title="Default" note="A bare hlmInput, no field wrapper needed." [code]="codeDefault">
        <input hlmInput placeholder="Enter text" class="max-w-sm" />
      </app-usage>

      <app-usage title="Types and states" note="Password, disabled, and file variants." [code]="codeStates">
        <div class="flex max-w-sm flex-col gap-3">
          <input hlmInput type="password" placeholder="sk-..." />
          <input hlmInput placeholder="Disabled" disabled />
          <input hlmInput type="file" />
        </div>
      </app-usage>

      <app-usage title="In a field" note="hlm-field supplies the label and description layout." [code]="codeField">
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="input-username">Username</label>
          <input hlmInput id="input-username" placeholder="Enter your username" />
          <hlm-field-description>Choose a unique username for your account.</hlm-field-description>
        </hlm-field>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the error clears once a valid email is typed."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="input-email">Email</label>
          <input hlmInput id="input-email" type="email" [formControl]="email" />
          <hlm-field-error>Enter a valid email address.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class InputPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly email = new FormControl('not-an-email', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  constructor() {
    this.email.markAsTouched();
  }

  protected readonly codeDefault = `<input hlmInput placeholder="Enter text" />`;

  protected readonly codeStates = `<input hlmInput type="password" placeholder="sk-..." />
<input hlmInput placeholder="Disabled" disabled />
<input hlmInput type="file" />`;

  protected readonly codeField = `<hlm-field>
  <label hlmFieldLabel for="username">Username</label>
  <input hlmInput id="username" placeholder="Enter your username" />
  <hlm-field-description>Choose a unique username for your account.</hlm-field-description>
</hlm-field>`;

  protected readonly codeValidated = `email = new FormControl('', { validators: [Validators.required, Validators.email] });

<hlm-field>
  <label hlmFieldLabel for="email">Email</label>
  <input hlmInput id="email" type="email" [formControl]="email" />
  <hlm-field-error>Enter a valid email address.</hlm-field-error>
</hlm-field>`;
}
