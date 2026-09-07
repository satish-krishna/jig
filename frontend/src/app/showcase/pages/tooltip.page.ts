import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Tooltip usages. Unlike the other overlays here, `hlmTooltip` has no
 * `*hlmTooltipPortal` structural directive to project into — it is a single
 * attribute directive that builds its own CDK overlay imperatively and
 * projects the given string or `ng-template` straight in, so nothing needs
 * naming here. It still renders nothing until hovered/focused (real
 * `showDelay`/`hideDelay`), so every usage zeroes both for fast, deterministic
 * tests, and tests use `focus()`/`blur()` (not mouseenter) since that is the
 * one trigger path that also works for the disabled-button pattern below.
 */
@Component({
  selector: 'app-tooltip-page',
  imports: [ComponentPage, Usage, HlmTooltipImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucidePlus })],
  template: `
    <app-component-page slug="tooltip">
      <app-usage title="Default" note="A plain string tooltip." [code]="codeDefault">
        <button [hlmTooltip]="'Add to library'" [showDelay]="0" [hideDelay]="0" hlmBtn variant="outline">
          Default
        </button>
      </app-usage>

      <app-usage title="Positions" note="position places the tooltip on a given side of the trigger." [code]="codePositions">
        <div class="grid grid-cols-2 items-center justify-items-center gap-s">
          <button
            type="button"
            hlmBtn
            variant="outline"
            hlmTooltip="Tooltip content"
            position="top"
            [showDelay]="0"
            [hideDelay]="0"
            class="col-span-2"
          >
            Top
          </button>
          <button
            type="button"
            hlmBtn
            variant="outline"
            hlmTooltip="Tooltip content"
            position="left"
            [showDelay]="0"
            [hideDelay]="0"
          >
            Left
          </button>
          <button
            type="button"
            hlmBtn
            variant="outline"
            hlmTooltip="Tooltip content"
            position="right"
            [showDelay]="0"
            [hideDelay]="0"
          >
            Right
          </button>
          <button
            type="button"
            hlmBtn
            variant="outline"
            hlmTooltip="Tooltip content"
            position="bottom"
            [showDelay]="0"
            [hideDelay]="0"
            class="col-span-2"
          >
            Bottom
          </button>
        </div>
      </app-usage>

      <app-usage title="Rich content" note="An ng-template lets the tooltip carry an icon, not just text." [code]="codeTemplate">
        <button [hlmTooltip]="richTooltip" [showDelay]="0" [hideDelay]="0" hlmBtn variant="outline">Rich</button>
        <ng-template #richTooltip>
          <span class="flex items-center">
            Add to library
            <ng-icon class="ml-s text-sm" name="lucidePlus" />
          </span>
        </ng-template>
      </app-usage>

      <app-usage
        title="Disabled button"
        [note]="tooltipDisabled() ? 'Tooltip disabled.' : 'Tooltip enabled.'"
        [code]="codeDisabled"
      >
        <div class="flex items-center gap-m">
          <div hlmTooltip="Re-enable the field above first" [showDelay]="0" [hideDelay]="0" [tooltipDisabled]="!disabled()">
            <button hlmBtn variant="outline" [disabled]="disabled()">Disabled target</button>
          </div>
          <button hlmBtn variant="ghost" size="sm" (click)="toggleDisabled()">
            {{ disabled() ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class TooltipPage {
  protected readonly disabled = signal(true);
  protected readonly tooltipDisabled = () => !this.disabled();

  protected toggleDisabled(): void {
    this.disabled.update((d) => !d);
  }

  protected readonly codeDefault = `<button [hlmTooltip]="'Add to library'" hlmBtn variant="outline">Default</button>`;

  protected readonly codePositions = `<button hlmBtn variant="outline" hlmTooltip="Tooltip content" position="top">Top</button>
<button hlmBtn variant="outline" hlmTooltip="Tooltip content" position="left">Left</button>
<button hlmBtn variant="outline" hlmTooltip="Tooltip content" position="right">Right</button>
<button hlmBtn variant="outline" hlmTooltip="Tooltip content" position="bottom">Bottom</button>`;

  protected readonly codeTemplate = `<button [hlmTooltip]="richTooltip" hlmBtn variant="outline">Rich</button>
<ng-template #richTooltip>
  <span class="flex items-center">
    Add to library
    <ng-icon class="ml-s text-sm" name="lucidePlus" />
  </span>
</ng-template>`;

  protected readonly codeDisabled = `// A disabled native <button> fires no events at all, tooltip included —
// wrap it so the tooltip lives on an element that always receives them.
<div hlmTooltip="Re-enable the field above first" [tooltipDisabled]="!disabled()">
  <button hlmBtn variant="outline" [disabled]="disabled()">Disabled target</button>
</div>`;
}
