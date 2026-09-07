import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Alert usages. HlmAlert, HlmAlertTitle, HlmAlertDescription and HlmAlertAction
 * are all Directives with no template of their own — confirmed against both the
 * MCP docs and the vendored source — so children render as plain DOM, never a
 * named ng-content slot that could silently swallow them.
 */
@Component({
  selector: 'app-alert-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmAlertImports, HlmButtonImports, HlmInputImports, NgIcon],
  providers: [provideIcons({ lucideX })],
  template: `
    <app-component-page slug="alert">
      <app-usage title="Variants" note="Default and destructive." [code]="codeVariants">
        <div class="flex w-full max-w-md flex-col gap-m">
          <hlm-alert>
            <h4 hlmAlertTitle>Payment successful</h4>
            <p hlmAlertDescription>A receipt has been sent to your email address.</p>
          </hlm-alert>
          <hlm-alert variant="destructive">
            <h4 hlmAlertTitle>Payment failed</h4>
            <p hlmAlertDescription>Check your payment method and try again.</p>
          </hlm-alert>
        </div>
      </app-usage>

      <app-usage
        title="With action"
        note="hlmAlertAction positions a button in the corner of the alert."
        [code]="codeAction"
      >
        <hlm-alert class="max-w-md">
          <h4 hlmAlertTitle>Dark mode is now available</h4>
          <p hlmAlertDescription>Enable it under your profile settings to get started.</p>
          <div hlmAlertAction>
            <button hlmBtn size="xs">Enable</button>
          </div>
        </hlm-alert>
      </app-usage>

      <app-usage
        title="Dismissible"
        note="A real signal drives visibility — this is not a cosmetic toggle."
        [code]="codeDismissible"
      >
        @if (dismissed()) {
          <button hlmBtn variant="outline" size="sm" (click)="dismissed.set(false)">Show alert again</button>
        } @else {
          <hlm-alert class="max-w-md">
            <h4 hlmAlertTitle>New feature available</h4>
            <p hlmAlertDescription>We've added dark mode support. Enable it in account settings.</p>
            <div hlmAlertAction>
              <button hlmBtn variant="ghost" size="icon-xs" aria-label="Dismiss" (click)="dismissed.set(true)">
                <ng-icon name="lucideX" />
              </button>
            </div>
          </hlm-alert>
        }
      </app-usage>

      <app-usage
        title="Form validation"
        note="Driven by a real FormControl — submit an empty field to see it appear."
        [code]="codeValidation"
      >
        <div class="flex max-w-md flex-col gap-m">
          <input
            hlmInput
            placeholder="you@example.com"
            [formControl]="email"
          />
          @if (email.invalid && email.touched) {
            <hlm-alert variant="destructive">
              <h4 hlmAlertTitle>Enter a valid email</h4>
              <p hlmAlertDescription>We need a valid address to send the receipt to.</p>
            </hlm-alert>
          }
          <button hlmBtn type="button" size="sm" class="self-start" (click)="submit()">Submit</button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class AlertPage {
  protected readonly dismissed = signal(false);

  /** Pre-touched-on-submit only — invalid on load without nagging until the user acts. */
  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected submit(): void {
    this.email.markAsTouched();
  }

  protected readonly codeVariants = `<hlm-alert>
  <h4 hlmAlertTitle>Payment successful</h4>
  <p hlmAlertDescription>A receipt has been sent to your email address.</p>
</hlm-alert>
<hlm-alert variant="destructive">
  <h4 hlmAlertTitle>Payment failed</h4>
  <p hlmAlertDescription>Check your payment method and try again.</p>
</hlm-alert>`;

  protected readonly codeAction = `<hlm-alert>
  <h4 hlmAlertTitle>Dark mode is now available</h4>
  <p hlmAlertDescription>Enable it under your profile settings to get started.</p>
  <div hlmAlertAction>
    <button hlmBtn size="xs">Enable</button>
  </div>
</hlm-alert>`;

  protected readonly codeDismissible = `dismissed = signal(false);

@if (!dismissed()) {
  <hlm-alert>
    <h4 hlmAlertTitle>New feature available</h4>
    <p hlmAlertDescription>We've added dark mode support.</p>
    <div hlmAlertAction>
      <button hlmBtn variant="ghost" size="icon-xs" (click)="dismissed.set(true)">
        <ng-icon name="lucideX" />
      </button>
    </div>
  </hlm-alert>
}`;

  protected readonly codeValidation = `email = new FormControl('', { validators: [Validators.required, Validators.email] });

<input [formControl]="email" />
@if (email.invalid && email.touched) {
  <hlm-alert variant="destructive">
    <h4 hlmAlertTitle>Enter a valid email</h4>
    <p hlmAlertDescription>We need a valid address to send the receipt to.</p>
  </hlm-alert>
}
<button hlmBtn (click)="email.markAsTouched()">Submit</button>`;
}
