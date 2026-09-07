import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Button group usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmButtonGroup` is an attribute/element directive on a
 * plain `div` (or `hlm-button-group`) — it only supplies the row layout and
 * the joined-corner classes, so its children are ordinary `hlmBtn` buttons,
 * `hlmButtonGroupText`, `hlmButtonGroupSeparator` and even a plain `hlmInput`.
 * No projected slot to trip over.
 */
@Component({
  selector: 'app-button-group-page',
  imports: [ComponentPage, Usage, HlmButtonImports, HlmButtonGroupImports, HlmInputImports, NgIcon],
  providers: [provideIcons({ lucideCopy })],
  template: `
    <app-component-page slug="button-group">
      <app-usage
        title="Orientation"
        note="Horizontal is the default; vertical stacks the same buttons top to bottom."
        [code]="codeOrientation"
      >
        <div class="flex flex-wrap items-start gap-xl">
          <div hlmButtonGroup>
            <button hlmBtn variant="outline">One</button>
            <button hlmBtn variant="outline">Two</button>
            <button hlmBtn variant="outline">Three</button>
          </div>
          <div hlmButtonGroup orientation="vertical">
            <button hlmBtn variant="outline">One</button>
            <button hlmBtn variant="outline">Two</button>
            <button hlmBtn variant="outline">Three</button>
          </div>
        </div>
      </app-usage>

      <app-usage title="Sizes" note="Match every button in a group to the same size." [code]="codeSizes">
        <div class="flex flex-col items-start gap-m">
          <div hlmButtonGroup>
            <button hlmBtn variant="outline" size="sm">Small</button>
            <button hlmBtn variant="outline" size="sm">Button</button>
            <button hlmBtn variant="outline" size="sm">Group</button>
          </div>
          <div hlmButtonGroup>
            <button hlmBtn variant="outline" size="lg">Large</button>
            <button hlmBtn variant="outline" size="lg">Button</button>
            <button hlmBtn variant="outline" size="lg">Group</button>
          </div>
        </div>
      </app-usage>

      <app-usage
        title="States"
        note="Locking is real signal state — the Lock button disables every action in the group below it."
        [code]="codeStates"
      >
        <div class="flex flex-col items-start gap-m">
          <button hlmBtn variant="ghost" size="sm" (click)="locked.set(!locked())">
            {{ locked() ? 'Unlock' : 'Lock' }}
          </button>
          <div hlmButtonGroup>
            <button hlmBtn variant="outline" [disabled]="locked()">Copy</button>
            <button hlmBtn variant="outline" [disabled]="locked()">Paste</button>
            <button hlmBtn variant="outline" [disabled]="locked()">Delete</button>
          </div>
        </div>
      </app-usage>

      <app-usage
        title="Composed with text and an input"
        note="hlmButtonGroupText and a plain hlmInput slot into the same row as a button."
        [code]="codeComposed"
      >
        <div hlmButtonGroup class="max-w-xs">
          <span hlmButtonGroupText>https://</span>
          <input hlmInput placeholder="Website url" class="z-10" />
          <button hlmBtn variant="outline" size="icon" aria-label="Copy link">
            <ng-icon name="lucideCopy" />
          </button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class ButtonGroupPage {
  /** Real interactive state: locking disables every button in the group below
   *  — none of them carry a hand-set disabled attribute. */
  protected readonly locked = signal(false);

  protected readonly codeOrientation = `<div hlmButtonGroup>
  <button hlmBtn variant="outline">One</button>
  <button hlmBtn variant="outline">Two</button>
  <button hlmBtn variant="outline">Three</button>
</div>
<div hlmButtonGroup orientation="vertical">
  <button hlmBtn variant="outline">One</button>
  <button hlmBtn variant="outline">Two</button>
  <button hlmBtn variant="outline">Three</button>
</div>`;

  protected readonly codeSizes = `<div hlmButtonGroup>
  <button hlmBtn variant="outline" size="sm">Small</button>
  <button hlmBtn variant="outline" size="sm">Button</button>
  <button hlmBtn variant="outline" size="sm">Group</button>
</div>`;

  protected readonly codeStates = `// locked is a real signal shared by every button in the group.
locked = signal(false);

<button hlmBtn variant="ghost" size="sm" (click)="locked.set(!locked())">
  {{ locked() ? 'Unlock' : 'Lock' }}
</button>
<div hlmButtonGroup>
  <button hlmBtn variant="outline" [disabled]="locked()">Copy</button>
  <button hlmBtn variant="outline" [disabled]="locked()">Paste</button>
  <button hlmBtn variant="outline" [disabled]="locked()">Delete</button>
</div>`;

  protected readonly codeComposed = `<div hlmButtonGroup>
  <span hlmButtonGroupText>https://</span>
  <input hlmInput placeholder="Website url" />
  <button hlmBtn variant="outline" size="icon" aria-label="Copy link">
    <ng-icon name="lucideCopy" />
  </button>
</div>`;
}
