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
        <div class="flex items-center gap-4">
          <hlm-skeleton class="size-12 rounded-full" />
          <div class="flex flex-col gap-2">
            <hlm-skeleton class="h-4 w-[200px]" />
            <hlm-skeleton class="h-4 w-[150px]" />
          </div>
        </div>
      </app-usage>

      <app-usage title="Sizes" note="Height controls how prominent the placeholder reads." [code]="codeSizes">
        <div class="flex w-64 flex-col gap-2">
          <hlm-skeleton class="h-3 w-full" />
          <hlm-skeleton class="h-6 w-full" />
          <hlm-skeleton class="h-10 w-full" />
        </div>
      </app-usage>

      <app-usage title="Table rows" note="Composed into a grid of cells for a loading table." [code]="codeTable">
        <div class="flex w-72 flex-col gap-2">
          @for (row of tableRows; track $index) {
            <div class="flex gap-3">
              <hlm-skeleton class="h-4 flex-1" />
              <hlm-skeleton class="h-4 w-16" />
              <hlm-skeleton class="h-4 w-12" />
            </div>
          }
        </div>
      </app-usage>

      <app-usage
        title="Loading toggle"
        note="Driven by a real signal — the skeleton is swapped for actual content, never forced."
        [code]="codeToggle"
      >
        <div class="flex w-64 flex-col gap-3">
          @if (loading()) {
            <div class="flex flex-col gap-2">
              <hlm-skeleton class="h-4 w-3/4" />
              <hlm-skeleton class="h-4 w-1/2" />
            </div>
          } @else {
            <div class="flex flex-col gap-1">
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

  protected readonly codeShapes = `<hlm-skeleton class="size-12 rounded-full" />
<hlm-skeleton class="h-4 w-[200px]" />
<hlm-skeleton class="h-4 w-[150px]" />`;

  protected readonly codeSizes = `<hlm-skeleton class="h-3 w-full" />
<hlm-skeleton class="h-6 w-full" />
<hlm-skeleton class="h-10 w-full" />`;

  protected readonly codeTable = `@for (row of rows; track $index) {
  <div class="flex gap-3">
    <hlm-skeleton class="h-4 flex-1" />
    <hlm-skeleton class="h-4 w-16" />
    <hlm-skeleton class="h-4 w-12" />
  </div>
}`;

  protected readonly codeToggle = `loading = signal(true);

@if (loading()) {
  <hlm-skeleton class="h-4 w-3/4" />
  <hlm-skeleton class="h-4 w-1/2" />
} @else {
  <p>Quarterly report ready</p>
}`;
}
