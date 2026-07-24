import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Skeleton usages. HlmSkeleton is a Directive with no template of its own —
 * confirmed against the MCP docs and the vendored source — so there is no
 * projection slot to worry about: it is always self-closing.
 */
@Component({
  selector: 'app-skeleton-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmSkeletonImports, HlmButtonImports],
  template: `
    <app-component-page slug="skeleton">
      <app-usage title="Shapes" note="Circle and rectangle placeholders." [code]="codeShapes">
        <!-- avatar beside a stack of lines: two dimensions, so one grid rather
             than a flex row wrapping a flex column -->
        <div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
          <hlm-skeleton class="row-span-2 size-12 rounded-full" />
          <hlm-skeleton class="h-4 w-48" />
          <hlm-skeleton class="h-4 w-36" />
        </div>
      </app-usage>

      <app-usage title="Sizes" note="Height controls how prominent the placeholder reads." [code]="codeSizes">
        <div class="grid w-64 gap-2">
          <hlm-skeleton class="h-3 w-full" />
          <hlm-skeleton class="h-6 w-full" />
          <hlm-skeleton class="h-10 w-full" />
        </div>
      </app-usage>

      <app-usage title="Table rows" note="Composed into a grid of cells for a loading table." [code]="codeTable">
        <div class="grid w-72 grid-cols-[1fr_4rem_3rem] gap-3">
          @for (row of tableRows; track $index) {
            <hlm-skeleton class="h-4" />
            <hlm-skeleton class="h-4" />
            <hlm-skeleton class="h-4" />
          }
        </div>
      </app-usage>

      <app-usage
        title="Loading toggle"
        note="Driven by a real signal — the skeleton is swapped for actual content, never forced."
        [code]="codeToggle"
      >
        <div class="grid w-64 gap-3">
          @if (loading()) {
            <div class="grid gap-2">
              <hlm-skeleton class="h-4 w-3/4" />
              <hlm-skeleton class="h-4 w-1/2" />
            </div>
          } @else {
            <div class="grid gap-1">
              <p class="text-sm font-medium">Quarterly report ready</p>
              <p class="text-muted-foreground text-xs">Generated just now.</p>
            </div>
          }
          <button hlmBtn variant="outline" size="sm" class="self-start" (click)="loading.set(!loading())">
            {{ loading() ? 'Finish loading' : 'Reset to loading' }}
          </button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SkeletonPage {
  protected readonly loading = signal(true);
  protected readonly tableRows = Array.from({ length: 3 });

  // The wrapper is part of this example: row-span-2 is what puts the circle
  // beside both lines, so a copy without it does not reproduce what is shown.
  protected readonly codeShapes = `<div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
  <hlm-skeleton class="row-span-2 size-12 rounded-full" />
  <hlm-skeleton class="h-4 w-48" />
  <hlm-skeleton class="h-4 w-36" />
</div>`;

  protected readonly codeSizes = `<hlm-skeleton class="h-3 w-full" />
<hlm-skeleton class="h-6 w-full" />
<hlm-skeleton class="h-10 w-full" />`;

  protected readonly codeTable = `<div class="grid grid-cols-[1fr_4rem_3rem] gap-3">
  @for (row of rows; track $index) {
    <hlm-skeleton class="h-4" />
    <hlm-skeleton class="h-4" />
    <hlm-skeleton class="h-4" />
  }
</div>`;

  protected readonly codeToggle = `loading = signal(true);

@if (loading()) {
  <hlm-skeleton class="h-4 w-3/4" />
  <hlm-skeleton class="h-4 w-1/2" />
} @else {
  <p>Quarterly report ready</p>
}`;
}
