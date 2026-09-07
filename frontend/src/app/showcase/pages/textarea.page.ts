import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Textarea usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/textarea: `[hlmTextarea]` hosts BrnTextarea (id/forceInvalid)
 * plus BrnFieldControlDescribedBy, same shape as HlmInput.
 */
@Component({
  selector: 'app-textarea-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmTextareaImports, HlmFieldImports],
  template: `
    <app-component-page slug="textarea">
      <app-usage title="Default" note="A bare hlmTextarea, no field wrapper needed." [code]="codeDefault">
        <textarea hlmTextarea placeholder="Type your message here." class="max-w-sm"></textarea>
      </app-usage>

      <app-usage title="Disabled" note="Disabled state, unchanged in shape from the default." [code]="codeDisabled">
        <textarea hlmTextarea placeholder="Type your message here." class="max-w-sm" disabled></textarea>
      </app-usage>

      <app-usage title="In a field" note="hlm-field supplies the label and description layout." [code]="codeField">
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="textarea-message">Message</label>
          <textarea hlmTextarea id="textarea-message" placeholder="Type your message here."></textarea>
          <hlm-field-description>Enter your message below.</hlm-field-description>
        </hlm-field>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the error clears once text is entered."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="textarea-bio">Bio</label>
          <textarea hlmTextarea id="textarea-bio" [formControl]="bio"></textarea>
          <hlm-field-error>Tell us a little about yourself.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class TextareaPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly bio = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor() {
    this.bio.markAsTouched();
  }

  protected readonly codeDefault = `<textarea hlmTextarea placeholder="Type your message here."></textarea>`;

  protected readonly codeDisabled = `<textarea hlmTextarea placeholder="Type your message here." disabled></textarea>`;

  protected readonly codeField = `<hlm-field>
  <label hlmFieldLabel for="message">Message</label>
  <textarea hlmTextarea id="message" placeholder="Type your message here."></textarea>
  <hlm-field-description>Enter your message below.</hlm-field-description>
</hlm-field>`;

  protected readonly codeValidated = `bio = new FormControl('', { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="bio">Bio</label>
  <textarea hlmTextarea id="bio" [formControl]="bio"></textarea>
  <hlm-field-error>Tell us a little about yourself.</hlm-field-error>
</hlm-field>`;
}
