import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Spinner usages. HlmSpinner's own template is `<ng-icon [name]="icon()" />`
 * with no ng-content at all — confirmed against the MCP docs and the vendored
 * source — so it is always self-closing; content placed inside it would never
 * render.
 */
@Component({
  selector: 'app-spinner-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmSpinnerImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideLoader, lucideX })],
  template: `
    <app-component-page slug="spinner">
      <app-usage title="Sizes" note="Text size controls the spinner's size." [code]="codeSizes">
        <div class="flex items-center gap-6">
          <hlm-spinner class="text-sm" />
          <hlm-spinner class="text-xl" />
          <hlm-spinner class="text-3xl" />
        </div>
      </app-usage>

      <app-usage
        title="Custom icon"
        note="Any registered ng-icon name can replace the default loader."
        [code]="codeCustomIcon"
      >
        <hlm-spinner icon="lucideLoader" class="text-xl" />
      </app-usage>

      <app-usage
        title="Submitting"
        note="A real signal drives the disabled button and the cancel action."
        [code]="codeSubmitting"
      >
        <div class="flex items-center gap-2">
          <button hlmBtn size="sm" [disabled]="submitting()" (click)="submit()">
            @if (submitting()) {
              <hlm-spinner />
              Submitting…
            } @else {
              Submit
            }
          </button>
          @if (submitting()) {
            <button hlmBtn variant="ghost" size="icon-xs" aria-label="Cancel" (click)="cancel()">
              <ng-icon name="lucideX" />
            </button>
          }
        </div>
      </app-usage>

      <app-usage title="Status row" note="Composed alongside text in a bordered row." [code]="codeStatusRow">
        <div class="border-border grid w-72 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2">
          <hlm-spinner />
          <div class="flex flex-col">
            <span class="text-sm font-medium">Processing payment...</span>
            <span class="text-muted-foreground text-xs">Do not close this window.</span>
          </div>
          <span class="text-sm tabular-nums">$100.00</span>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SpinnerPage {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  protected submit(): void {
    this.submitting.set(true);
    this.timeoutId = setTimeout(() => this.submitting.set(false), 2000);
    this.destroyRef.onDestroy(() => clearTimeout(this.timeoutId));
  }

  protected cancel(): void {
    clearTimeout(this.timeoutId);
    this.submitting.set(false);
  }

  protected readonly codeSizes = `<hlm-spinner class="text-sm" />
<hlm-spinner class="text-xl" />
<hlm-spinner class="text-3xl" />`;

  protected readonly codeCustomIcon = `// providers: [provideIcons({ lucideLoader })]
<hlm-spinner icon="lucideLoader" />`;

  protected readonly codeSubmitting = `submitting = signal(false);

<button [disabled]="submitting()" (click)="submit()">
  @if (submitting()) {
    <hlm-spinner />
    Submitting…
  } @else {
    Submit
  }
</button>`;

  protected readonly codeStatusRow = `<div class="flex items-center gap-3 rounded-lg border px-3 py-2">
  <hlm-spinner />
  <span>Processing payment...</span>
  <span>$100.00</span>
</div>`;
}
