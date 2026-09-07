import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmScrollAreaImports } from '@spartan-ng/helm/scroll-area';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Scroll area usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `HlmScrollArea` is a directive on `ng-scrollbar[hlm]` — the
 * actual scrollable element is ngx-scrollbar's own `<ng-scrollbar>` component,
 * which projects its content directly (no `scrollViewport` marker needed for
 * the plain, non-external-viewport form used here). Every example needs a
 * bounded container plus content that overflows it, or there is nothing to
 * scroll and the scrollbar never appears.
 */
@Component({
  selector: 'app-scroll-area-page',
  imports: [ComponentPage, Usage, HlmScrollAreaImports, HlmSeparatorImports, NgScrollbarModule, NgIcon],
  providers: [provideIcons({ lucideCheck })],
  template: `
    <app-component-page slug="scroll-area">
      <app-usage
        title="Vertical list (default)"
        note="A fixed-height ng-scrollbar with content taller than the box — vertical scrolling is the default orientation."
        [code]="codeVertical"
      >
        <ng-scrollbar hlm class="h-56 w-48 border">
          <div class="p-l">
            <h4 class="mb-l text-sm leading-none font-medium">Tags</h4>
            @for (tag of tags; track tag) {
              <div class="text-sm">
                {{ tag }}
                <div hlmSeparator class="my-s"></div>
              </div>
            }
          </div>
        </ng-scrollbar>
      </app-usage>

      <app-usage
        title="Horizontal gallery"
        note="whitespace-nowrap on the container keeps the row from wrapping, so it overflows sideways instead."
        [code]="codeHorizontal"
      >
        <ng-scrollbar hlm class="w-80 border whitespace-nowrap">
          <div class="flex w-max gap-m p-l">
            @for (swatch of swatches; track swatch.label) {
              <div
                class="flex size-20 shrink-0 flex-col items-center justify-center gap-xs rounded-md text-xs font-medium"
                [style.background]="swatch.color"
              >
                {{ swatch.label }}
              </div>
            }
          </div>
        </ng-scrollbar>
      </app-usage>

      <app-usage
        title="Compact appearance"
        note="appearance='compact' overlays the scrollbar instead of reserving track space for it."
        [code]="codeCompact"
      >
        <ng-scrollbar hlm class="h-32 w-64 border" appearance="compact">
          <p class="p-l text-sm">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium architecto, asperiores beatae
            consequuntur dolor ducimus et exercitationem facilis fugiat magni nisi officiis quibusdam rem repellat
            reprehenderit totam veritatis voluptatibus.
          </p>
        </ng-scrollbar>
      </app-usage>

      <app-usage
        title="Composition: selectable list"
        note="Clicking a row updates a real signal that drives the checkmark — nothing here is hand-set."
        [code]="codeComposition"
      >
        <ng-scrollbar hlm class="h-56 w-64 border">
          <div class="grid p-s">
            @for (member of members; track member; let i = $index) {
              <button
                type="button"
                class="hover:bg-muted flex items-center justify-between rounded-md px-m py-s text-left text-sm"
                (click)="selected.set(i)"
              >
                {{ member }}
                @if (selected() === i) {
                  <ng-icon name="lucideCheck" class="text-primary" />
                }
              </button>
            }
          </div>
        </ng-scrollbar>
      </app-usage>
    </app-component-page>
  `,
})
export class ScrollAreaPage {
  protected readonly tags = Array.from({ length: 30 }, (_, i) => `v1.2.0-beta.${30 - i}`);

  protected readonly swatches = [
    { label: 'Rose', color: 'oklch(0.7 0.19 15)' },
    { label: 'Amber', color: 'oklch(0.8 0.17 80)' },
    { label: 'Teal', color: 'oklch(0.7 0.12 190)' },
    { label: 'Indigo', color: 'oklch(0.55 0.2 280)' },
    { label: 'Lime', color: 'oklch(0.85 0.2 130)' },
  ];

  protected readonly members = [
    'Olivia Martin',
    'Jackson Lee',
    'Isabella Nguyen',
    'William Kim',
    'Sofia Davis',
    'Liam Johnson',
  ];

  /** Which row is selected — a real signal driving the checkmark, never a hand-set attribute. */
  protected readonly selected = signal(0);

  protected readonly codeVertical = `<ng-scrollbar hlm class="h-56 w-48 border">
  <div class="p-l">
    <h4 class="mb-l text-sm font-medium">Tags</h4>
    @for (tag of tags; track tag) {
      <div class="text-sm">
        {{ tag }}
        <div hlmSeparator class="my-s"></div>
      </div>
    }
  </div>
</ng-scrollbar>`;

  protected readonly codeHorizontal = `<ng-scrollbar hlm class="w-80 border whitespace-nowrap">
  <div class="flex w-max gap-m p-l">
    @for (swatch of swatches; track swatch.label) {
      <div class="size-20 shrink-0 rounded-md" [style.background]="swatch.color">{{ swatch.label }}</div>
    }
  </div>
</ng-scrollbar>`;

  protected readonly codeCompact = `<ng-scrollbar hlm class="h-32 w-64 border" appearance="compact">
  <p class="p-l text-sm">Lorem ipsum dolor sit amet…</p>
</ng-scrollbar>`;

  protected readonly codeComposition = `selected = signal(0);

<ng-scrollbar hlm class="h-56 w-64 border">
  <div class="grid p-s">
    @for (member of members; track member; let i = $index) {
      <button (click)="selected.set(i)">
        {{ member }}
        @if (selected() === i) {
          <ng-icon name="lucideCheck" />
        }
      </button>
    }
  </div>
</ng-scrollbar>`;
}
