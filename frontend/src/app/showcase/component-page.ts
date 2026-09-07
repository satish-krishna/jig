import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideExternalLink } from '@ng-icons/lucide';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { COMPONENT_API } from './component-api.generated';
import { COMPONENTS, DOCS_URL, PATTERN_CATEGORY } from './component-registry';

/**
 * The frame every component page sits in. Supplies, in order: the heading, the
 * projected usages, the generated API table, and — for a vendored component —
 * the link to the upstream docs.
 *
 * A page provides only its usages; everything else is derived from the slug, so
 * the pages cannot drift into as many different layouts as there are pages.
 */
@Component({
  selector: 'app-component-page',
  imports: [NgIcon, HlmTableImports],
  providers: [provideIcons({ lucideExternalLink })],
  template: `
    <article class="grid max-w-4xl gap-2xl">
      <header class="grid gap-xs">
        <!-- one inline run: title beside its slug -->
        <div class="flex items-baseline gap-m">
          <h1 class="text-2xl font-semibold">{{ entry()?.name ?? slug() }}</h1>
          <code class="text-muted-foreground font-mono text-xs">{{ slug() }}</code>
        </div>
        @if (entry()?.blurb; as blurb) {
          <p class="text-muted-foreground text-sm">{{ blurb }}</p>
        }
      </header>

      <div class="grid gap-xl"><ng-content /></div>

      <section class="grid gap-m">
        <h2 class="text-lg font-medium">API</h2>
        @for (cls of api(); track cls.className) {
          <div class="border-border overflow-hidden rounded-lg border">
            <header class="border-border flex items-baseline gap-m border-b px-l py-s">
              <span class="text-sm font-medium">{{ cls.className }}</span>
              <code class="text-muted-foreground font-mono text-xs">{{ cls.selector }}</code>
            </header>
            @if (cls.members.length) {
              <table hlmTable class="text-left">
                <thead class="text-muted-foreground">
                  <tr>
                    <th class="px-l py-xs font-medium">Member</th>
                    <th class="px-l py-xs font-medium">Kind</th>
                    <th class="px-l py-xs font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of cls.members; track m.name + m.kind) {
                    <tr class="border-border border-t">
                      <td class="px-l py-xs font-mono">
                        {{ m.name }}@if (m.required) {<span class="text-destructive">*</span>}
                      </td>
                      <td class="text-muted-foreground px-l py-xs">{{ m.kind }}</td>
                      <td class="text-muted-foreground px-l py-xs font-mono">{{ m.type }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="text-muted-foreground px-l py-s text-xs">No inputs or outputs.</p>
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

      @if (docsUrl(); as href) {
        <footer class="border-border border-t pt-l">
          <a
            class="text-primary text-sm underline underline-offset-4"
            [href]="href"
            target="_blank"
            rel="noreferrer"
          >
            <!-- an icon, not a ↗ glyph: design.md sanctions exactly one glyph and
                 this is not it -->
            Full reference on spartan.ng
            <ng-icon name="lucideExternalLink" class="align-middle" />
          </a>
        </footer>
      }
    </article>
  `,
})
export class ComponentPage {
  readonly slug = input.required<string>();

  protected readonly entry = computed(() => COMPONENTS.find((c) => c.slug === this.slug()));
  protected readonly api = computed(() => COMPONENT_API[this.slug()] ?? []);
  /** Null for a pattern page: spartan has no reference for a component we wrote. */
  protected readonly docsUrl = computed(() =>
    this.entry()?.category === PATTERN_CATEGORY ? null : DOCS_URL(this.slug()),
  );
}
