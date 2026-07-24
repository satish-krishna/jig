import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Field usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/field: hlm-field is the state-carrying wrapper (it reads
 * the descendant control's NgControl through BrnField), hlm-field-label /
 * hlm-field-content / hlm-field-description are layout slots, and
 * fieldset[hlmFieldSet] + legend[hlmFieldLegend] group several fields.
 */
@Component({
  selector: 'app-field-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ComponentPage,
    Usage,
    HlmFieldImports,
    HlmInputImports,
    HlmCheckboxImports,
  ],
  template: `
    <app-component-page slug="field">
      <app-usage
        title="Vertical (default)"
        note="Label, control and description stacked — the default orientation."
        [code]="codeVertical"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="field-email">Email</label>
          <input hlmInput id="field-email" type="email" placeholder="you@example.com" />
          <hlm-field-description>We'll never share your email.</hlm-field-description>
        </hlm-field>
      </app-usage>

      <app-usage
        title="Horizontal"
        note="orientation=horizontal puts the control beside its label and description."
        [code]="codeHorizontal"
      >
        <hlm-field orientation="horizontal" class="max-w-sm">
          <hlm-checkbox inputId="field-news" />
          <div hlmFieldContent>
            <label hlmFieldLabel for="field-news">Product updates</label>
            <p hlmFieldDescription>At most one email a month.</p>
          </div>
        </hlm-field>
      </app-usage>

      <app-usage
        title="Grouped with a fieldset"
        note="fieldset[hlmFieldSet] + legend[hlmFieldLegend] group a hlm-field-group of fields under one legend."
        [code]="codeFieldset"
      >
        <fieldset hlmFieldSet class="max-w-sm">
          <legend hlmFieldLegend>Contact</legend>
          <hlm-field-group>
            <hlm-field>
              <label hlmFieldLabel for="field-first">First name</label>
              <input hlmInput id="field-first" placeholder="Ada" />
            </hlm-field>
            <hlm-field>
              <label hlmFieldLabel for="field-last">Last name</label>
              <input hlmInput id="field-last" placeholder="Lovelace" />
            </hlm-field>
          </hlm-field-group>
        </fieldset>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the error clears once a valid email is typed."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="field-required-email">Work email</label>
          <input hlmInput id="field-required-email" type="email" [formControl]="email" />
          <hlm-field-error>Enter a valid email address.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class FieldPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly email = new FormControl('not-an-email', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  constructor() {
    this.email.markAsTouched();
  }

  protected readonly codeVertical = `<hlm-field class="max-w-sm">
  <label hlmFieldLabel for="field-email">Email</label>
  <input hlmInput id="field-email" type="email" placeholder="you@example.com" />
  <hlm-field-description>We'll never share your email.</hlm-field-description>
</hlm-field>`;

  protected readonly codeHorizontal = `<hlm-field orientation="horizontal">
  <hlm-checkbox inputId="field-news" />
  <div hlmFieldContent>
    <label hlmFieldLabel for="field-news">Product updates</label>
    <p hlmFieldDescription>At most one email a month.</p>
  </div>
</hlm-field>`;

  protected readonly codeFieldset = `<fieldset hlmFieldSet>
  <legend hlmFieldLegend>Contact</legend>
  <hlm-field-group>
    <hlm-field>
      <label hlmFieldLabel for="first">First name</label>
      <input hlmInput id="first" placeholder="Ada" />
    </hlm-field>
    <hlm-field>
      <label hlmFieldLabel for="last">Last name</label>
      <input hlmInput id="last" placeholder="Lovelace" />
    </hlm-field>
  </hlm-field-group>
</fieldset>`;

  protected readonly codeValidated = `email = new FormControl('', { validators: [Validators.required, Validators.email] });

<hlm-field>
  <label hlmFieldLabel for="work-email">Work email</label>
  <input hlmInput id="work-email" type="email" [formControl]="email" />
  <hlm-field-error>Enter a valid email address.</hlm-field-error>
</hlm-field>`;
}
