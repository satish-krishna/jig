import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Switch usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/switch: hlm-switch renders its own thumb internally
 * (`<brn-switch-thumb hlm />` lives in its own template) — unlike hlm-radio it
 * needs no projected content, so a bare `<hlm-switch inputId="…" />` plus a
 * sibling label tied by `for` is the complete anatomy.
 */
@Component({
  selector: 'app-switch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmSwitchImports, HlmLabelImports, HlmFieldImports],
  template: `
    <app-component-page slug="switch">
      <app-usage title="Default" note="The label wraps the switch — no for/id needed here." [code]="codeDefault">
        <label class="flex items-center" hlmLabel>
          <hlm-switch class="mr-s" />
          Airplane mode
        </label>
      </app-usage>

      <app-usage title="Sizes" note="sm and the default size, side by side." [code]="codeSizes">
        <div class="flex items-center gap-xl">
          <label class="flex items-center" hlmLabel>
            <hlm-switch class="me-s" size="sm" />
            Small
          </label>
          <label class="flex items-center" hlmLabel>
            <hlm-switch class="me-s" size="default" />
            Default
          </label>
        </div>
      </app-usage>

      <app-usage title="Checked and disabled" note="Independent checked and disabled states." [code]="codeStates">
        <div class="flex items-center gap-xl">
          <label class="flex items-center" hlmLabel>
            <hlm-switch class="me-s" [checked]="true" />
            Checked
          </label>
          <label class="flex items-center" hlmLabel>
            <hlm-switch class="me-s" disabled />
            Disabled
          </label>
        </div>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — toggle it on and the error clears. Note: HlmSwitch forces aria-describedby to null on its own host and never wires BrnFieldControlDescribedBy, so unlike checkbox this one's aria-describedby is not auto-linked to the error — a library gap, not a hand-set attribute here."
        [code]="codeValidated"
      >
        <div hlmField class="max-w-sm">
          <div class="flex items-center gap-m">
            <hlm-switch inputId="switch-required" [formControl]="accepted" />
            <label hlmFieldLabel for="switch-required">I agree to the terms</label>
          </div>
          <hlm-field-error>You must agree to the terms to continue.</hlm-field-error>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SwitchPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly accepted = new FormControl(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });

  constructor() {
    this.accepted.markAsTouched();
  }

  protected readonly codeDefault = `<label class="flex items-center" hlmLabel>
  <hlm-switch class="mr-s" />
  Airplane mode
</label>`;

  protected readonly codeSizes = `<hlm-switch size="sm" />
<hlm-switch size="default" />`;

  protected readonly codeStates = `<hlm-switch [checked]="true" />
<hlm-switch disabled />`;

  protected readonly codeValidated = `// hlm-switch is a ControlValueAccessor, so it binds directly.
accepted = new FormControl(false, { validators: [Validators.requiredTrue] });

<div hlmField>
  <hlm-switch inputId="terms" [formControl]="accepted" />
  <label hlmFieldLabel for="terms">I agree to the terms</label>
  <hlm-field-error>You must agree to the terms to continue.</hlm-field-error>
</div>`;
}
