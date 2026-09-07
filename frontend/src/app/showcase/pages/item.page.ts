import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBadgeCheck, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Item usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmItem` and every part (`hlm-item-media`,
 * `hlm-item-content`, `hlm-item-title`, `hlmItemDescription`,
 * `hlm-item-actions`) are plain attribute directives with no host template —
 * there is no projected slot, so an item is just nested elements carrying the
 * directives' classes. The documented composition tree is
 * `hlm-item-group > hlm-item > (hlm-item-media, hlm-item-content > (hlm-item-title, hlm-item-description), hlm-item-actions)`.
 */
@Component({
  selector: 'app-item-page',
  imports: [ComponentPage, Usage, HlmItemImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideBadgeCheck, lucideX })],
  template: `
    <app-component-page slug="item">
      <app-usage
        title="Basic"
        note="Media, content (title + description) and actions are the whole anatomy."
        [code]="codeBasic"
      >
        <hlm-item variant="outline" class="w-full max-w-md">
          <hlm-item-media variant="icon">
            <ng-icon name="lucideBadgeCheck" />
          </hlm-item-media>
          <hlm-item-content>
            <hlm-item-title>Your profile has been verified</hlm-item-title>
            <p hlmItemDescription>This usually takes a few minutes to reflect everywhere.</p>
          </hlm-item-content>
          <hlm-item-actions>
            <button hlmBtn variant="outline" size="sm">View</button>
          </hlm-item-actions>
        </hlm-item>
      </app-usage>

      <app-usage
        title="Variants"
        note="default, outline and muted — the border and background shift, layout stays identical."
        [code]="codeVariants"
      >
        <div class="flex w-full max-w-md flex-col gap-m">
          <hlm-item variant="default">
            <hlm-item-content>
              <hlm-item-title>Default</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
          <hlm-item variant="outline">
            <hlm-item-content>
              <hlm-item-title>Outline</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
          <hlm-item variant="muted">
            <hlm-item-content>
              <hlm-item-title>Muted</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
        </div>
      </app-usage>

      <app-usage title="Sizes" note="default, sm and xs tighten the padding and gap together." [code]="codeSizes">
        <div class="flex w-full max-w-md flex-col gap-m">
          <hlm-item variant="outline" size="default">
            <hlm-item-content>
              <hlm-item-title>Default size</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
          <hlm-item variant="outline" size="sm">
            <hlm-item-content>
              <hlm-item-title>Small size</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
          <hlm-item variant="outline" size="xs">
            <hlm-item-content>
              <hlm-item-title>Extra-small size</hlm-item-title>
            </hlm-item-content>
          </hlm-item>
        </div>
      </app-usage>

      <app-usage
        title="Removable group"
        note="hlm-item-group holds a real signal-backed list; each dismiss button mutates it directly."
        [code]="codeGroup"
      >
        <hlm-item-group class="w-full max-w-md">
          @for (invite of invites(); track invite.id) {
            <hlm-item variant="outline" size="sm">
              <hlm-item-content>
                <hlm-item-title>{{ invite.email }}</hlm-item-title>
                <p hlmItemDescription>Pending invitation</p>
              </hlm-item-content>
              <hlm-item-actions>
                <button hlmBtn variant="ghost" size="icon-sm" (click)="dismiss(invite.id)">
                  <ng-icon name="lucideX" />
                  <span class="sr-only">Dismiss</span>
                </button>
              </hlm-item-actions>
            </hlm-item>
          } @empty {
            <p class="text-muted-foreground text-sm">No pending invitations.</p>
          }
        </hlm-item-group>
      </app-usage>
    </app-component-page>
  `,
})
export class ItemPage {
  protected readonly invites = signal([
    { id: 1, email: 'ada@example.com' },
    { id: 2, email: 'grace@example.com' },
  ]);

  protected dismiss(id: number): void {
    this.invites.update((list) => list.filter((i) => i.id !== id));
  }

  protected readonly codeBasic = `<hlm-item variant="outline">
  <hlm-item-media variant="icon">
    <ng-icon name="lucideBadgeCheck" />
  </hlm-item-media>
  <hlm-item-content>
    <hlm-item-title>Your profile has been verified</hlm-item-title>
    <p hlmItemDescription>This usually takes a few minutes to reflect everywhere.</p>
  </hlm-item-content>
  <hlm-item-actions>
    <button hlmBtn variant="outline" size="sm">View</button>
  </hlm-item-actions>
</hlm-item>`;

  protected readonly codeVariants = `<hlm-item variant="default">...</hlm-item>
<hlm-item variant="outline">...</hlm-item>
<hlm-item variant="muted">...</hlm-item>`;

  protected readonly codeSizes = `<hlm-item variant="outline" size="default">...</hlm-item>
<hlm-item variant="outline" size="sm">...</hlm-item>
<hlm-item variant="outline" size="xs">...</hlm-item>`;

  protected readonly codeGroup = `// invites is a real signal; dismissing mutates it.
invites = signal([...]);
dismiss(id: number) { this.invites.update((list) => list.filter((i) => i.id !== id)); }

<hlm-item-group>
  @for (invite of invites(); track invite.id) {
    <hlm-item variant="outline" size="sm">
      <hlm-item-content>
        <hlm-item-title>{{ invite.email }}</hlm-item-title>
      </hlm-item-content>
      <hlm-item-actions>
        <button hlmBtn variant="ghost" size="icon-sm" (click)="dismiss(invite.id)">
          <ng-icon name="lucideX" />
        </button>
      </hlm-item-actions>
    </hlm-item>
  }
</hlm-item-group>`;
}
