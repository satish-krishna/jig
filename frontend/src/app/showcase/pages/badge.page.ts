import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBadgeCheck, lucideBell } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Badge usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmBadge`/`hlm-badge` is a plain attribute directive with
 * a `variant` input driven by `cva` — there is no host template and no
 * projected slot, so a badge is just a `<span>` (or `<a>`) carrying the
 * directive's classes.
 */
@Component({
  selector: 'app-badge-page',
  imports: [ComponentPage, Usage, HlmBadgeImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideBadgeCheck, lucideBell })],
  template: `
    <app-component-page slug="badge">
      <app-usage title="Variants" note="Six semantic variants, all on the same span[hlmBadge]." [code]="codeVariants">
        <div class="flex flex-wrap items-center gap-s">
          <span hlmBadge>Default</span>
          <span hlmBadge variant="secondary">Secondary</span>
          <span hlmBadge variant="destructive">Destructive</span>
          <span hlmBadge variant="outline">Outline</span>
          <span hlmBadge variant="ghost">Ghost</span>
          <span hlmBadge variant="link">Link</span>
        </div>
      </app-usage>

      <app-usage
        title="With icons"
        note="data-icon=inline-start|inline-end tells the badge's own padding utilities which side the icon sits on."
        [code]="codeIcons"
      >
        <div class="flex flex-wrap items-center gap-s">
          <span hlmBadge variant="secondary">
            <ng-icon data-icon="inline-start" name="lucideBadgeCheck" />
            Verified
          </span>
        </div>
      </app-usage>

      <app-usage
        title="Interactive count"
        note="The number is a real signal; clicking the button increments it, nothing here is hand-typed."
        [code]="codeInteractive"
      >
        <div class="flex flex-wrap items-center gap-m">
          <button hlmBtn variant="outline" size="sm" (click)="bump()">Simulate event</button>
          <span hlmBadge variant="destructive">{{ count() }}</span>
        </div>
      </app-usage>

      <app-usage
        title="In context"
        note="A badge anchored to the corner of an icon button — the common notification-count pattern."
        [code]="codeContext"
      >
        <button hlmBtn variant="outline" size="icon" class="relative" (click)="bump()" aria-label="Notifications">
          <ng-icon name="lucideBell" />
          @if (count() > 0) {
            <span hlmBadge variant="destructive" class="absolute -top-2 -right-2 h-4 min-w-4">
              {{ count() }}
            </span>
          }
        </button>
      </app-usage>
    </app-component-page>
  `,
})
export class BadgePage {
  protected readonly count = signal(0);

  protected bump(): void {
    this.count.update((n) => n + 1);
  }

  protected readonly codeVariants = `<span hlmBadge>Default</span>
<span hlmBadge variant="secondary">Secondary</span>
<span hlmBadge variant="destructive">Destructive</span>
<span hlmBadge variant="outline">Outline</span>
<span hlmBadge variant="ghost">Ghost</span>
<span hlmBadge variant="link">Link</span>`;

  protected readonly codeIcons = `<span hlmBadge variant="secondary">
  <ng-icon data-icon="inline-start" name="lucideBadgeCheck" />
  Verified
</span>`;

  protected readonly codeInteractive = `// count is a real signal, bumped by the button click handler.
count = signal(0);
bump() { this.count.update((n) => n + 1); }

<button hlmBtn variant="outline" size="sm" (click)="bump()">Simulate event</button>
<span hlmBadge variant="destructive">{{ count() }}</span>`;

  protected readonly codeContext = `<button hlmBtn variant="outline" size="icon" class="relative" aria-label="Notifications">
  <ng-icon name="lucideBell" />
  @if (count() > 0) {
    <span hlmBadge variant="destructive" class="absolute -top-2 -right-2 h-4 min-w-4 px-xs">
      {{ count() }}
    </span>
  }
</button>`;
}
