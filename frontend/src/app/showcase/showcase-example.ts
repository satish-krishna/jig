import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One labelled cell in the component showcase: a component name and a live
 * instance of it. Deliberately dumb — it owns no spartan markup itself so the
 * examples stay the only thing worth reading on the page.
 */
@Component({
  selector: 'app-showcase-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="border-border flex flex-col gap-3 rounded-lg border p-4">
      <figcaption class="text-muted-foreground font-mono text-xs">{{ name() }}</figcaption>
      <div class="flex min-h-16 flex-wrap items-center gap-3">
        <ng-content />
      </div>
    </figure>
  `,
})
export class ShowcaseExample {
  readonly name = input.required<string>();
}
