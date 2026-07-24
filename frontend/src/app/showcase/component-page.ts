import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideExternalLink } from '@ng-icons/lucide';
import { COMPONENT_API } from './component-api.generated';
import { COMPONENTS, DOCS_URL } from './component-registry';

/**
 * The frame every component page sits in. Supplies, in order: the heading, the
 * projected usages, the generated API table, and the link to the upstream docs.
 *
 * A page provides only its usages; everything else is derived from the slug, so
 * 56 pages cannot drift into 56 different layouts.
 */
@Component({
  selector: 'app-component-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideExternalLink })],
  template: `
    <article class="grid max-w-4xl gap-8">
      <header class="grid gap-1">
        <!-- one inline run: title beside its slug -->
        <div class="flex items-baseline gap-3">
          <h1 class="text-2xl font-semibold">{{ entry()?.name ?? slug() }}</h1>
          <code class="text-muted-foreground font-mono text-xs">{{ slug() }}</code>
        </div>
        @if (entry()?.blurb; as blurb) {
          <p class="text-muted-foreground text-sm">{{ blurb }}</p>
        }
      </header>

      <div class="grid gap-6"><ng-content /></div>

      <section class="grid gap-3">
        <h2 class="text-lg font-medium">API</h2>
        @for (cls of api(); track cls.className) {
          <div class="border-border overflow-hidden rounded-lg border">
            <header class="border-border flex items-baseline gap-3 border-b px-4 py-2">
              <span class="text-sm font-medium">{{ cls.className }}</span>
              <code class="text-muted-foreground font-mono text-xs">{{ cls.selector }}</code>
            </header>
            @if (cls.members.length) {
              <table class="w-full text-left text-xs">
                <thead class="text-muted-foreground">
                  <tr>
                    <th class="px-4 py-1.5 font-medium">Member</th>
                    <th class="px-4 py-1.5 font-medium">Kind</th>
                    <th class="px-4 py-1.5 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of cls.members; track m.name + m.kind) {
                    <tr class="border-border border-t">
                      <td class="px-4 py-1.5 font-mono">
                        {{ m.name }}@if (m.required) {<span class="text-destructive">*</span>}
                      </td>
                      <td class="text-muted-foreground px-4 py-1.5">{{ m.kind }}</td>
                      <td class="text-muted-foreground px-4 py-1.5 font-mono">{{ m.type }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="text-muted-foreground px-4 py-2 text-xs">No inputs or outputs.</p>
            }
          </div>
        } @empty {
          <p class="text-muted-foreground text-sm">No API generated for this component.</p>
        }
        <p class="text-muted-foreground text-xs">
          Generated from <code class="font-mono">frontend/libs/ui</code> by
          <code class="font-mono">npm run showcase:api</code> — never hand-edited.
        </p>
      </section>

      <footer class="border-border border-t pt-4">
        <a
          class="text-primary text-sm underline underline-offset-4"
          [href]="docsUrl()"
          target="_blank"
          rel="noreferrer"
        >
          <!-- an icon, not a ↗ glyph: design.md sanctions exactly one glyph and
               this is not it -->
          Full reference on spartan.ng
          <ng-icon name="lucideExternalLink" class="align-middle" />
        </a>
      </footer>
    </article>
  `,
})
export class ComponentPage {
  readonly slug = input.required<string>();

  protected readonly entry = computed(() => COMPONENTS.find((c) => c.slug === this.slug()));
  protected readonly api = computed(() => COMPONENT_API[this.slug()] ?? []);
  protected readonly docsUrl = computed(() => DOCS_URL(this.slug()));
}
