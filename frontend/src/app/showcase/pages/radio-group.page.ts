import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Radio group usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/radio-group: hlm-radio has a named projection slot,
 * `<ng-content select="[target],[indicator],hlm-radio-indicator" indicator />`
 * — a bare <hlm-radio> with no projected `<hlm-radio-indicator indicator />`
 * mounts and renders nothing to click. The label is always a sibling tied by
 * inputId, never content inside hlm-radio.
 */
@Component({
  selector: 'app-radio-group-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmRadioGroupImports, HlmLabelImports, HlmFieldImports],
  template: `
    <app-component-page slug="radio-group">
      <app-usage
        title="Default"
        note="A plain value/valueChange binding — no ngModel or formControl needed."
        [code]="codeDefault"
      >
        <hlm-radio-group [value]="spacing()" (valueChange)="spacing.set($event)">
          <div class="flex items-center gap-3">
            <hlm-radio value="default" inputId="rg-default">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-default">Default</label>
          </div>
          <div class="flex items-center gap-3">
            <hlm-radio value="comfortable" inputId="rg-comfortable">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-comfortable">Comfortable</label>
          </div>
          <div class="flex items-center gap-3">
            <hlm-radio value="compact" inputId="rg-compact">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-compact">Compact</label>
          </div>
        </hlm-radio-group>
      </app-usage>

      <app-usage title="Disabled option" note="A single radio can be disabled inside an enabled group." [code]="codeDisabled">
        <hlm-radio-group value="comfortable">
          <div class="flex items-center gap-3">
            <hlm-radio value="default" inputId="rg-d-default" disabled>
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-d-default">Default (disabled)</label>
          </div>
          <div class="flex items-center gap-3">
            <hlm-radio value="comfortable" inputId="rg-d-comfortable">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-d-comfortable">Comfortable</label>
          </div>
        </hlm-radio-group>
      </app-usage>

      <app-usage title="Horizontal layout" note="The group's own class overrides the default vertical grid." [code]="codeHorizontal">
        <hlm-radio-group value="monthly" class="flex flex-row gap-6">
          <div class="flex items-center gap-3">
            <hlm-radio value="monthly" inputId="rg-h-monthly">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-h-monthly">Monthly</label>
          </div>
          <div class="flex items-center gap-3">
            <hlm-radio value="yearly" inputId="rg-h-yearly">
              <hlm-radio-indicator indicator />
            </hlm-radio>
            <label hlmLabel for="rg-h-yearly">Yearly</label>
          </div>
        </hlm-radio-group>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a plan and the error clears."
        [code]="codeValidated"
      >
        <div hlmField class="max-w-sm">
          <hlm-radio-group [formControl]="plan">
            <div class="flex items-center gap-3">
              <hlm-radio value="free" inputId="rg-v-free">
                <hlm-radio-indicator indicator />
              </hlm-radio>
              <label hlmLabel for="rg-v-free">Free</label>
            </div>
            <div class="flex items-center gap-3">
              <hlm-radio value="pro" inputId="rg-v-pro">
                <hlm-radio-indicator indicator />
              </hlm-radio>
              <label hlmLabel for="rg-v-pro">Pro</label>
            </div>
          </hlm-radio-group>
          <hlm-field-error>Please choose a plan.</hlm-field-error>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class RadioGroupPage {
  protected readonly spacing = signal('comfortable');

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly plan = new FormControl<string | null>(null, { validators: [Validators.required] });

  constructor() {
    this.plan.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-radio-group [value]="spacing()" (valueChange)="spacing.set($event)">
  <div class="flex items-center gap-3">
    <hlm-radio value="default" inputId="rg-default">
      <hlm-radio-indicator indicator />
    </hlm-radio>
    <label hlmLabel for="rg-default">Default</label>
  </div>
  <!-- ...comfortable, compact -->
</hlm-radio-group>`;

  protected readonly codeDisabled = `<hlm-radio-group value="comfortable">
  <div class="flex items-center gap-3">
    <hlm-radio value="default" inputId="d-default" disabled>
      <hlm-radio-indicator indicator />
    </hlm-radio>
    <label hlmLabel for="d-default">Default (disabled)</label>
  </div>
</hlm-radio-group>`;

  protected readonly codeHorizontal = `<hlm-radio-group value="monthly" class="flex flex-row gap-6">
  <div class="flex items-center gap-3">
    <hlm-radio value="monthly" inputId="h-monthly">
      <hlm-radio-indicator indicator />
    </hlm-radio>
    <label hlmLabel for="h-monthly">Monthly</label>
  </div>
</hlm-radio-group>`;

  protected readonly codeValidated = `plan = new FormControl<string | null>(null, { validators: [Validators.required] });

<div hlmField>
  <hlm-radio-group [formControl]="plan">
    <div class="flex items-center gap-3">
      <hlm-radio value="free" inputId="free">
        <hlm-radio-indicator indicator />
      </hlm-radio>
      <label hlmLabel for="free">Free</label>
    </div>
  </hlm-radio-group>
  <hlm-field-error>Please choose a plan.</hlm-field-error>
</div>`;
}
