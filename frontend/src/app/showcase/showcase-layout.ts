import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { groupedByCategory } from './component-registry';

/**
 * Two-pane frame for the showcase: a sticky, category-grouped component index
 * on the left and the routed page on the right.
 *
 * It owns its own scroll regions rather than riding the app shell's, so the
 * component index stays put while a long component page scrolls — the same
 * contract the shell gives header, sidebar and footer.
 *
 * @capability ui.component-showcase
 * @intent Browse every vendored spartan component, one page each, with verified usages.
 * @reuse Route to /showcase. Add a component page under showcase/pages and register it in component-registry.ts.
 */
@Component({
  selector: 'app-showcase-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmInputImports],
  host: { class: 'block h-full' },
  template: `
    <div class="grid h-full grid-cols-[13rem_1fr] overflow-hidden">
      <nav class="border-border flex min-h-0 flex-col gap-s overflow-y-auto border-r pr-l">
        <input
          hlmInput
          class="h-8 shrink-0"
          type="search"
          placeholder="Filter components"
          aria-label="Filter components"
          [value]="filter()"
          (input)="onFilter($event)"
        />

        @for (group of groups(); track group.category) {
          <div class="flex flex-col gap-xs">
            <span class="text-muted-foreground px-s pt-s text-xs font-medium">
              {{ group.category }}
            </span>
            @for (c of group.items; track c.slug) {
              <!-- .hlm-nav__item is the app's one nav-row style, already global
                   from the shell. A third hand-rolled variant here would be the
                   duplicate control design.md forbids. -->
              <a
                class="hlm-nav__item"
                [routerLink]="['/showcase', c.slug]"
                routerLinkActive
                #rla="routerLinkActive"
                [attr.data-active]="rla.isActive"
                >{{ c.name }}</a
              >
            }
          </div>
        } @empty {
          <p class="text-muted-foreground px-s py-l text-sm">No component matches that.</p>
        }
      </nav>

      <div class="min-h-0 overflow-y-auto pl-xl">
        <router-outlet />
      </div>
    </div>
  `,
})
export class ShowcaseLayout {
  protected readonly filter = signal('');
  protected readonly groups = computed(() => groupedByCategory(this.filter()));

  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }
}
