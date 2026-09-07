import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideGitBranch, lucidePlus } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Button usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmBtn` is a plain attribute directive on a native
 * `button[hlmBtn]` or `a[hlmBtn]` — there is no host component and no
 * projected slot, so every example below is just the native element with the
 * directive's classes attached.
 */
@Component({
  selector: 'app-button-page',
  imports: [ComponentPage, Usage, HlmButtonImports, HlmSpinnerImports, NgIcon],
  providers: [provideIcons({ lucidePlus, lucideGitBranch, lucideArrowRight })],
  template: `
    <app-component-page slug="button">
      <app-usage
        title="Variants"
        note="Six semantic variants; the same classes apply whether the host is a button or an anchor."
        [code]="codeVariants"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmBtn>Default</button>
          <button hlmBtn variant="outline">Outline</button>
          <button hlmBtn variant="secondary">Secondary</button>
          <button hlmBtn variant="ghost">Ghost</button>
          <button hlmBtn variant="destructive">Destructive</button>
          <button hlmBtn variant="link">Link</button>
        </div>
      </app-usage>

      <app-usage
        title="Sizes"
        note="Text sizes pair with a matching square icon size for icon-only buttons."
        [code]="codeSizes"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmBtn variant="outline" size="sm">Small</button>
          <button hlmBtn variant="outline">Default</button>
          <button hlmBtn variant="outline" size="lg">Large</button>
          <button hlmBtn variant="outline" size="icon" aria-label="Add">
            <ng-icon name="lucidePlus" />
          </button>
        </div>
      </app-usage>

      <app-usage
        title="States"
        note="Disabled is a static attribute; the loading state is a real signal flipped by the click handler."
        [code]="codeStates"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmBtn variant="outline" disabled>Disabled</button>
          <button hlmBtn variant="secondary" [disabled]="saving()" (click)="save()">
            @if (saving()) {
              <hlm-spinner data-icon="inline-start" />
            }
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </app-usage>

      <app-usage
        title="With icons"
        note="The data-icon attribute, inline-start or inline-end, tells the button's own padding utilities which side the icon sits on."
        [code]="codeIcons"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmBtn variant="outline">
            <ng-icon data-icon="inline-start" name="lucideGitBranch" />
            New branch
          </button>
          <button hlmBtn variant="outline">
            Continue
            <ng-icon data-icon="inline-end" name="lucideArrowRight" />
          </button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class ButtonPage {
  protected readonly saving = signal(false);

  /** Real interactive state: clicking flips the signal, driving both the
   *  disabled attribute and the spinner — nothing here is hand-set. */
  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 1200);
  }

  protected readonly codeVariants = `<button hlmBtn>Default</button>
<button hlmBtn variant="outline">Outline</button>
<button hlmBtn variant="secondary">Secondary</button>
<button hlmBtn variant="ghost">Ghost</button>
<button hlmBtn variant="destructive">Destructive</button>
<button hlmBtn variant="link">Link</button>`;

  protected readonly codeSizes = `<button hlmBtn variant="outline" size="sm">Small</button>
<button hlmBtn variant="outline">Default</button>
<button hlmBtn variant="outline" size="lg">Large</button>
<button hlmBtn variant="outline" size="icon" aria-label="Add">
  <ng-icon name="lucidePlus" />
</button>`;

  protected readonly codeStates = `// saving is a real signal, flipped by the click handler.
saving = signal(false);
save() {
  this.saving.set(true);
  setTimeout(() => this.saving.set(false), 1200);
}

<button hlmBtn variant="outline" disabled>Disabled</button>
<button hlmBtn variant="secondary" [disabled]="saving()" (click)="save()">
  @if (saving()) {
    <hlm-spinner data-icon="inline-start" />
  }
  {{ saving() ? 'Saving…' : 'Save' }}
</button>`;

  protected readonly codeIcons = `<button hlmBtn variant="outline">
  <ng-icon data-icon="inline-start" name="lucideGitBranch" />
  New branch
</button>
<button hlmBtn variant="outline">
  Continue
  <ng-icon data-icon="inline-end" name="lucideArrowRight" />
</button>`;
}
