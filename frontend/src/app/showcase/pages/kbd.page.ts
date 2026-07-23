import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Kbd usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmKbd` and `hlmKbdGroup` are plain attribute directives
 * on `kbd` elements — there is no host template and no projected slot, so a
 * kbd is just a `<kbd>` carrying the directive's classes.
 */
@Component({
  selector: 'app-kbd-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmKbdImports, HlmButtonImports],
  template: `
    <app-component-page slug="kbd">
      <app-usage title="Basic" note="Each key is its own kbd[hlmKbd]." [code]="codeBasic">
        <div class="flex flex-wrap items-center gap-2">
          <kbd hlmKbd>⌘</kbd>
          <kbd hlmKbd>⇧</kbd>
          <kbd hlmKbd>⌥</kbd>
          <kbd hlmKbd>⌃</kbd>
        </div>
      </app-usage>

      <app-usage
        title="Group"
        note="kbd[hlmKbdGroup] wraps the individual keys of a single shortcut."
        [code]="codeGroup"
      >
        <p class="text-muted-foreground text-sm">
          Use
          <kbd hlmKbdGroup>
            <kbd hlmKbd>Ctrl</kbd>
            <span>+</span>
            <kbd hlmKbd>K</kbd>
          </kbd>
          to open the command palette.
        </p>
      </app-usage>

      <app-usage title="With button" note="A kbd hint riding inside a button's own padding." [code]="codeButton">
        <div class="flex flex-wrap items-center gap-3">
          <button hlmBtn variant="outline" size="sm" class="pr-2">
            Accept
            <kbd hlmKbd>⏎</kbd>
          </button>
          <button hlmBtn variant="outline" size="sm" class="pr-2">
            Cancel
            <kbd hlmKbd>Esc</kbd>
          </button>
        </div>
      </app-usage>

      <app-usage
        title="Platform toggle"
        note="A real signal switches which modifier keys render — nothing here is hand-set."
        [code]="codeToggle"
      >
        <div class="flex flex-wrap items-center gap-3">
          <button hlmBtn variant="outline" size="sm" (click)="toggleMac()">
            {{ mac() ? 'Show Windows keys' : 'Show Mac keys' }}
          </button>
          <kbd hlmKbdGroup>
            @if (mac()) {
              <kbd hlmKbd>⌘</kbd>
              <kbd hlmKbd>K</kbd>
            } @else {
              <kbd hlmKbd>Ctrl</kbd>
              <kbd hlmKbd>K</kbd>
            }
          </kbd>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class KbdPage {
  protected readonly mac = signal(true);

  protected toggleMac(): void {
    this.mac.update((v) => !v);
  }

  protected readonly codeBasic = `<kbd hlmKbd>⌘</kbd>
<kbd hlmKbd>⇧</kbd>
<kbd hlmKbd>⌥</kbd>
<kbd hlmKbd>⌃</kbd>`;

  protected readonly codeGroup = `<kbd hlmKbdGroup>
  <kbd hlmKbd>Ctrl</kbd>
  <span>+</span>
  <kbd hlmKbd>K</kbd>
</kbd>`;

  protected readonly codeButton = `<button hlmBtn variant="outline" size="sm" class="pr-2">
  Accept
  <kbd hlmKbd>⏎</kbd>
</button>`;

  protected readonly codeToggle = `// mac is a real signal; the click handler flips it.
mac = signal(true);
toggleMac() { this.mac.update((v) => !v); }

<kbd hlmKbdGroup>
  @if (mac()) {
    <kbd hlmKbd>⌘</kbd>
    <kbd hlmKbd>K</kbd>
  } @else {
    <kbd hlmKbd>Ctrl</kbd>
    <kbd hlmKbd>K</kbd>
  }
</kbd>`;
}
