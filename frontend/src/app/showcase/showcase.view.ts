import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShowcaseDataDisplay } from './sections/data-display.section';
import { ShowcaseForms } from './sections/forms.section';
import { ShowcaseOverlays } from './sections/overlays.section';
import { ShowcasePrimitives } from './sections/primitives.section';

/**
 * Live catalog of the spartan/ui components vendored into libs/ui: one minimal,
 * correct example each. Copy from here rather than from memory — every example
 * is compiled by the same build as the app, so it cannot drift from the real
 * selectors the way a markdown snippet can.
 *
 * @capability ui.component-showcase
 * @intent Show the working anatomy of each vendored spartan component in one place.
 * @reuse Route to /showcase and copy the markup. Add an example when you first use a component that has none.
 */
@Component({
  selector: 'app-showcase',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShowcasePrimitives, ShowcaseForms, ShowcaseOverlays, ShowcaseDataDisplay],
  template: `
    <div class="flex flex-col gap-10 p-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold">Component showcase</h1>
        <p class="text-muted-foreground text-sm">
          Every component in <code class="font-mono">frontend/libs/ui</code>, with the smallest
          correct usage. These compile with the app, so they cannot drift the way a snippet in a
          markdown file can.
        </p>
      </header>

      @for (section of sections; track section.title) {
        <section class="flex flex-col gap-4">
          <h2 class="text-lg font-medium">{{ section.title }}</h2>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @switch (section.key) {
              @case ('primitives') {
                <app-showcase-primitives />
              }
              @case ('forms') {
                <app-showcase-forms />
              }
              @case ('overlays') {
                <app-showcase-overlays />
              }
              @case ('containers') {
                <app-showcase-data-display />
              }
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class ShowcaseView {
  protected readonly sections = [
    { key: 'primitives', title: 'Primitives' },
    { key: 'forms', title: 'Forms' },
    { key: 'overlays', title: 'Overlays' },
    { key: 'containers', title: 'Containers & navigation' },
  ] as const;
}
