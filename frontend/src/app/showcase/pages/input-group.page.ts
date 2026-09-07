import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Input group usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/input-group: `hlmInputGroupInput` hosts HlmInput itself, so
 * the same BrnFieldControl + BrnFieldControlDescribedBy wiring input.page
 * relies on carries straight through — a hlm-field-error still earns its
 * aria-describedby correctly even though the control now sits inside an
 * addon wrapper.
 */
@Component({
  selector: 'app-input-group-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmInputGroupImports, HlmFieldImports, NgIcon],
  providers: [provideIcons({ lucideSearch })],
  template: `
    <app-component-page slug="input-group">
      <app-usage title="Default" note="An icon addon and a trailing result count." [code]="codeDefault">
        <hlm-input-group class="max-w-sm">
          <input hlmInputGroupInput placeholder="Search..." />
          <hlm-input-group-addon>
            <ng-icon name="lucideSearch" />
          </hlm-input-group-addon>
          <hlm-input-group-addon align="inline-end">12 results</hlm-input-group-addon>
        </hlm-input-group>
      </app-usage>

      <app-usage title="Text addons" note="hlm-input-group-text renders a plain-text prefix or suffix." [code]="codeText">
        <div class="flex max-w-sm flex-col gap-m">
          <hlm-input-group>
            <hlm-input-group-addon>
              <hlm-input-group-text>$</hlm-input-group-text>
            </hlm-input-group-addon>
            <input hlmInputGroupInput placeholder="0.00" />
            <hlm-input-group-addon align="inline-end">
              <hlm-input-group-text>USD</hlm-input-group-text>
            </hlm-input-group-addon>
          </hlm-input-group>
          <hlm-input-group>
            <hlm-input-group-addon>
              <hlm-input-group-text>https://</hlm-input-group-text>
            </hlm-input-group-addon>
            <input hlmInputGroupInput placeholder="example.com" />
          </hlm-input-group>
        </div>
      </app-usage>

      <app-usage title="Textarea with a footer addon" note="hlmInputGroupTextarea plus a block-end addon." [code]="codeTextarea">
        <hlm-input-group class="max-w-sm">
          <textarea hlmInputGroupTextarea placeholder="Enter your message"></textarea>
          <hlm-input-group-addon align="block-end">
            <hlm-input-group-text class="text-xs">120 characters left</hlm-input-group-text>
          </hlm-input-group-addon>
        </hlm-input-group>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the error clears once a URL is typed."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="input-group-url">Website URL</label>
          <hlm-input-group>
            <input hlmInputGroupInput id="input-group-url" placeholder="example.com" [formControl]="url" />
            <hlm-input-group-addon>
              <hlm-input-group-text>https://</hlm-input-group-text>
            </hlm-input-group-addon>
          </hlm-input-group>
          <hlm-field-error>Enter your website URL.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class InputGroupPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly url = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor() {
    this.url.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-input-group>
  <input hlmInputGroupInput placeholder="Search..." />
  <hlm-input-group-addon>
    <ng-icon name="lucideSearch" />
  </hlm-input-group-addon>
  <hlm-input-group-addon align="inline-end">12 results</hlm-input-group-addon>
</hlm-input-group>`;

  protected readonly codeText = `<hlm-input-group>
  <hlm-input-group-addon>
    <hlm-input-group-text>$</hlm-input-group-text>
  </hlm-input-group-addon>
  <input hlmInputGroupInput placeholder="0.00" />
  <hlm-input-group-addon align="inline-end">
    <hlm-input-group-text>USD</hlm-input-group-text>
  </hlm-input-group-addon>
</hlm-input-group>`;

  protected readonly codeTextarea = `<hlm-input-group>
  <textarea hlmInputGroupTextarea placeholder="Enter your message"></textarea>
  <hlm-input-group-addon align="block-end">
    <hlm-input-group-text>120 characters left</hlm-input-group-text>
  </hlm-input-group-addon>
</hlm-input-group>`;

  protected readonly codeValidated = `url = new FormControl('', { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="url">Website URL</label>
  <hlm-input-group>
    <input hlmInputGroupInput id="url" [formControl]="url" />
    <hlm-input-group-addon>
      <hlm-input-group-text>https://</hlm-input-group-text>
    </hlm-input-group-addon>
  </hlm-input-group>
  <hlm-field-error>Enter your website URL.</hlm-field-error>
</hlm-field>`;
}
