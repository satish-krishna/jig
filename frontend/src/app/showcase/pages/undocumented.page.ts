import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentPage } from '../component-page';
import { COMPONENTS } from '../component-registry';

/**
 * The showcase's catch-all route.
 *
 * Every vendored component now has a real page, so in practice this only fires
 * for a slug that is not a component at all — a stale bookmark or a typo. It
 * renders a genuine not-found rather than an empty heading over an empty API
 * table, which is what it used to do when the slug resolved to nothing.
 */
@Component({
  selector: 'app-undocumented-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, RouterLink],
  template: `
    @if (known()) {
      <app-component-page [slug]="known()!">
        <div class="border-border grid gap-1 rounded-lg border border-dashed px-4 py-6">
          <p class="text-sm font-medium">Usages not written yet.</p>
          <p class="text-muted-foreground text-sm">
            The API below is generated from the vendored source and is accurate. Until worked
            examples land, follow the upstream reference rather than guessing at the composition.
          </p>
        </div>
      </app-component-page>
    } @else {
      <div class="grid max-w-xl gap-3" data-testid="showcase-not-found">
        <h1 class="text-2xl font-semibold">No such component</h1>
        <p class="text-muted-foreground text-sm">
          <code class="font-mono">{{ requested() || '(none)' }}</code> is not one of the
          {{ total }} components vendored into <code class="font-mono">libs/ui</code>.
        </p>
        <a class="text-primary text-sm underline underline-offset-4" [routerLink]="['/showcase']">
          Back to the component index
        </a>
      </div>
    }
  `,
})
export class UndocumentedPage {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly total = COMPONENTS.length;

  /** What the URL asked for, whether or not it exists. */
  protected readonly requested = computed(() => this.params()?.get('slug') ?? '');

  /** The slug only when it names a real component; null is the not-found case. */
  protected readonly known = computed(() => {
    const slug = this.requested();
    return COMPONENTS.some((c) => c.slug === slug) ? slug : null;
  });
}
