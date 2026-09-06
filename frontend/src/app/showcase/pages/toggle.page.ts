import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideBookmark } from '@ng-icons/lucide';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmToggleImports } from '@spartan-ng/helm/toggle';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Toggle usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmToggle` is an attribute directive on a native
 * `button[hlmToggle]`, host-directing `BrnToggle` for its `state` model — no
 * projected slot, the button's own content is the visible part.
 */
@Component({
  selector: 'app-toggle-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmToggleImports, HlmFieldImports, NgIcon],
  providers: [provideIcons({ lucideBookmark, lucideBell })],
  template: `
    <app-component-page slug="toggle">
      <app-usage
        title="Variants"
        note="default stays transparent until pressed; outline adds a resting border."
        [code]="codeVariants"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmToggle aria-label="Toggle italic">Italic</button>
          <button hlmToggle variant="outline" aria-label="Toggle bold">Bold</button>
        </div>
      </app-usage>

      <app-usage title="Sizes" note="sm, default and lg, all outline." [code]="codeSizes">
        <div class="flex flex-wrap items-center gap-s">
          <button hlmToggle variant="outline" size="sm" aria-label="Toggle small">Small</button>
          <button hlmToggle variant="outline" aria-label="Toggle default">Default</button>
          <button hlmToggle variant="outline" size="lg" aria-label="Toggle large">Large</button>
        </div>
      </app-usage>

      <app-usage
        title="Pressed and disabled"
        note="Bookmark is driven by a real two-way [(state)] binding, not a hand-set aria-pressed."
        [code]="codeStates"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmToggle variant="outline" aria-label="Toggle bookmark" [(state)]="bookmarkState">
            <ng-icon name="lucideBookmark" />
            Bookmark
          </button>
          <button hlmToggle aria-label="Toggle disabled" disabled>Disabled</button>
        </div>
      </app-usage>

      <app-usage
        title="In a field"
        note="Paired with hlmField the same way a checkbox is — the label's for points at the toggle's id."
        [code]="codeField"
      >
        <div hlmField orientation="horizontal" class="max-w-sm">
          <button
            hlmToggle
            variant="outline"
            size="sm"
            id="toggle-notif"
            aria-label="Toggle notifications"
            [(state)]="notifState"
          >
            <ng-icon name="lucideBell" />
          </button>
          <div hlmFieldContent>
            <label hlmFieldLabel for="toggle-notif">Notifications</label>
            <p hlmFieldDescription>Get an in-app ping when a task finishes.</p>
          </div>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class TogglePage {
  /** Real toggle state via BrnToggle's own `state` model — never hand-set. */
  protected readonly bookmarkState = signal<'on' | 'off'>('off');
  protected readonly notifState = signal<'on' | 'off'>('off');

  protected readonly codeVariants = `<button hlmToggle aria-label="Toggle italic">Italic</button>
<button hlmToggle variant="outline" aria-label="Toggle bold">Bold</button>`;

  protected readonly codeSizes = `<button hlmToggle variant="outline" size="sm" aria-label="Toggle small">Small</button>
<button hlmToggle variant="outline" aria-label="Toggle default">Default</button>
<button hlmToggle variant="outline" size="lg" aria-label="Toggle large">Large</button>`;

  protected readonly codeStates = `bookmarkState = signal<'on' | 'off'>('off');

<button hlmToggle variant="outline" aria-label="Toggle bookmark" [(state)]="bookmarkState">
  <ng-icon name="lucideBookmark" />
  Bookmark
</button>
<button hlmToggle aria-label="Toggle disabled" disabled>Disabled</button>`;

  protected readonly codeField = `<div hlmField orientation="horizontal">
  <button hlmToggle variant="outline" size="sm" id="toggle-notif" aria-label="Toggle notifications" [(state)]="notifState">
    <ng-icon name="lucideBell" />
  </button>
  <div hlmFieldContent>
    <label hlmFieldLabel for="toggle-notif">Notifications</label>
    <p hlmFieldDescription>Get an in-app ping when a task finishes.</p>
  </div>
</div>`;
}
