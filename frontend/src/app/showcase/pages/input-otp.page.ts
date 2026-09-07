import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnInputOtpImports } from '@spartan-ng/brain/input-otp';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Input OTP usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/input-otp: `[hlmInputOtp]` decorates the brain
 * `<brn-input-otp>` element, `hlm-input-otp-group` clusters
 * `hlm-input-otp-slot`s (each `index` required), and `hlm-input-otp-separator`
 * sits between groups.
 */
@Component({
  selector: 'app-input-otp-page',
  imports: [
    ReactiveFormsModule,
    ComponentPage,
    Usage,
    BrnInputOtpImports,
    HlmInputOtpImports,
    HlmFieldImports,
    HlmButtonImports,
  ],
  template: `
    <app-component-page slug="input-otp">
      <app-usage title="Default" note="Two groups of three, split by a separator." [code]="codeDefault">
        <brn-input-otp hlmInputOtp maxLength="6">
          <hlm-input-otp-group>
            <hlm-input-otp-slot index="0" />
            <hlm-input-otp-slot index="1" />
            <hlm-input-otp-slot index="2" />
          </hlm-input-otp-group>
          <hlm-input-otp-separator />
          <hlm-input-otp-group>
            <hlm-input-otp-slot index="3" />
            <hlm-input-otp-slot index="4" />
            <hlm-input-otp-slot index="5" />
          </hlm-input-otp-group>
        </brn-input-otp>
      </app-usage>

      <app-usage title="Disabled, pre-filled" note="disabled plus a starting value." [code]="codeDisabled">
        <brn-input-otp hlmInputOtp value="123456" disabled maxLength="6">
          <hlm-input-otp-group>
            <hlm-input-otp-slot index="0" />
            <hlm-input-otp-slot index="1" />
            <hlm-input-otp-slot index="2" />
          </hlm-input-otp-group>
          <hlm-input-otp-separator />
          <hlm-input-otp-group>
            <hlm-input-otp-slot index="3" />
            <hlm-input-otp-slot index="4" />
            <hlm-input-otp-slot index="5" />
          </hlm-input-otp-group>
        </brn-input-otp>
      </app-usage>

      <app-usage title="Controlled value" note="A plain value/valueChange binding, no form involved." [code]="codeControlled">
        <div class="flex flex-col gap-s">
          <brn-input-otp hlmInputOtp [value]="code()" (valueChange)="code.set($event)" maxLength="4">
            <hlm-input-otp-group>
              <hlm-input-otp-slot index="0" />
              <hlm-input-otp-slot index="1" />
              <hlm-input-otp-slot index="2" />
              <hlm-input-otp-slot index="3" />
            </hlm-input-otp-group>
          </brn-input-otp>
          <p class="text-muted-foreground text-xs">Current value: {{ code() || '(empty)' }}</p>
        </div>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — the button enables once all 6 digits are entered. Note: BrnInputOtp has no BrnFieldControl at all, so it cannot register with an ancestor hlm-field — hlm-field-error would silently never display here, so this usage disables the submit button off real control validity instead, the same shape spartan's own form example uses."
        [code]="codeValidated"
      >
        <div class="flex flex-col gap-m">
          <brn-input-otp hlmInputOtp maxLength="6" [formControl]="otp">
            <hlm-input-otp-group>
              <hlm-input-otp-slot index="0" />
              <hlm-input-otp-slot index="1" />
              <hlm-input-otp-slot index="2" />
            </hlm-input-otp-group>
            <hlm-input-otp-separator />
            <hlm-input-otp-group>
              <hlm-input-otp-slot index="3" />
              <hlm-input-otp-slot index="4" />
              <hlm-input-otp-slot index="5" />
            </hlm-input-otp-group>
          </brn-input-otp>
          @if (otp.invalid && otp.touched) {
            <p class="text-destructive text-sm">Enter all 6 digits.</p>
          }
          <button hlmBtn type="button" [disabled]="otp.invalid">Verify</button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class InputOtpPage {
  protected readonly code = signal('');

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly otp = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
  });

  constructor() {
    this.otp.markAsTouched();
  }

  protected readonly codeDefault = `<brn-input-otp hlmInputOtp maxLength="6">
  <hlm-input-otp-group>
    <hlm-input-otp-slot index="0" />
    <hlm-input-otp-slot index="1" />
    <hlm-input-otp-slot index="2" />
  </hlm-input-otp-group>
  <hlm-input-otp-separator />
  <hlm-input-otp-group>
    <hlm-input-otp-slot index="3" />
    <hlm-input-otp-slot index="4" />
    <hlm-input-otp-slot index="5" />
  </hlm-input-otp-group>
</brn-input-otp>`;

  protected readonly codeDisabled = `<brn-input-otp hlmInputOtp value="123456" disabled maxLength="6">…</brn-input-otp>`;

  protected readonly codeControlled = `code = signal('');

<brn-input-otp hlmInputOtp [value]="code()" (valueChange)="code.set($event)" maxLength="4">…</brn-input-otp>`;

  protected readonly codeValidated = `otp = new FormControl('', {
  validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
});

<brn-input-otp hlmInputOtp maxLength="6" [formControl]="otp">…</brn-input-otp>
@if (otp.invalid && otp.touched) {
  <p class="text-destructive text-sm">Enter all 6 digits.</p>
}
<button hlmBtn [disabled]="otp.invalid">Verify</button>`;
}
