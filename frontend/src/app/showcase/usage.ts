import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';

/**
 * One usage of a component: a title, a live instance, and the source that
 * produced it behind a copy button.
 *
 * The markup exists twice — once projected as a live example, once as the
 * `code` string. That is not DRY, and there is no way around it: Angular
 * templates are compiled away at build time, so a running component cannot
 * recover its own source. Every component docs site makes the same trade. The
 * mitigation is that each page is pinned by a test asserting the *rendered*
 * DOM, so a live example that stops working fails even if the string still
 * reads correctly.
 */
@Component({
  selector: 'app-usage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports],
  template: `
    <section class="border-border overflow-hidden rounded-lg border">
      <header class="border-border flex items-baseline gap-m border-b px-l py-m">
        <h3 class="text-sm font-medium">{{ title() }}</h3>
        @if (note(); as n) {
          <p class="text-muted-foreground text-xs">{{ n }}</p>
        }
        <!-- hlmBtn rather than a hand-rolled button: design.md forbids
             re-implementing a control spartan already provides, and a raw
             button here would need its colors overridden by class, which the
             styling rules also forbid. -->
        <button hlmBtn variant="ghost" size="xs" class="ml-auto" (click)="copy()">
          {{ copied() ? 'copied' : 'copy' }}
        </button>
      </header>

      <div class="flex flex-wrap items-center gap-l p-l" data-slot="usage-stage">
        <ng-content />
      </div>

      <pre
        class="border-border bg-muted/40 overflow-x-auto border-t px-l py-m font-mono text-xs"
      ><code>{{ code() }}</code></pre>
    </section>
  `,
})
export class Usage {
  readonly title = input.required<string>();
  readonly code = input.required<string>();
  /** Optional one-liner explaining what this usage is showing. */
  readonly note = input<string>();

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1200);
  }
}
