import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Label usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/label: `[hlmLabel]` hosts BrnLabel (id/for) and is always a
 * sibling of its control, tied by `for` — never wrapped around it.
 */
@Component({
  selector: 'app-label-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmLabelImports, HlmInputImports, HlmFieldImports],
  template: `
    <app-component-page slug="label">
      <app-usage title="Default" note="A sibling of the input, paired by for/id." [code]="codeDefault">
        <div class="flex flex-col gap-xs">
          <label hlmLabel for="label-name">Name</label>
          <input hlmInput id="label-name" placeholder="Ada Lovelace" />
        </div>
      </app-usage>

      <app-usage
        title="Disabled"
        note="peer-disabled:opacity-50 dims the label when the input carries class=peer and is disabled."
        [code]="codeDisabled"
      >
        <div class="flex flex-col gap-xs">
          <input hlmInput id="label-disabled" class="peer" placeholder="Unavailable" disabled />
          <label hlmLabel for="label-disabled">Disabled field</label>
        </div>
      </app-usage>

      <app-usage title="Wrapping a control" note="A label can wrap its control instead of using for/id." [code]="codeWrapping">
        <label hlmLabel class="flex items-center gap-s">
          <input hlmInput placeholder="Search" class="max-w-40" />
          Search term
        </label>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the error clears once text is entered."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-sm">
          <label hlmFieldLabel for="label-required">Full name</label>
          <input hlmInput id="label-required" [formControl]="name" />
          <hlm-field-error>Your name is required.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class LabelPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly name = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor() {
    this.name.markAsTouched();
  }

  protected readonly codeDefault = `<div class="flex flex-col gap-xs">
  <label hlmLabel for="label-name">Name</label>
  <input hlmInput id="label-name" placeholder="Ada Lovelace" />
</div>`;

  protected readonly codeDisabled = `<input hlmInput id="label-disabled" class="peer" disabled />
<label hlmLabel for="label-disabled">Disabled field</label>`;

  protected readonly codeWrapping = `<label hlmLabel class="flex items-center gap-s">
  <input hlmInput placeholder="Search" />
  Search term
</label>`;

  protected readonly codeValidated = `name = new FormControl('', { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="full-name">Full name</label>
  <input hlmInput id="full-name" [formControl]="name" />
  <hlm-field-error>Your name is required.</hlm-field-error>
</hlm-field>`;
}
