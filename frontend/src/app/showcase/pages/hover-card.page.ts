import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmHoverCardImports } from '@spartan-ng/helm/hover-card';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Hover card usages. Anatomy confirmed against the spartan MCP docs: content
 * sits behind `*hlmHoverCardPortal` and is not in the DOM until the trigger
 * opens it — but unlike click-driven overlays, opening is hover/focus-and-delay
 * driven (`showDelay`/`hideDelay` on `hlmHoverCardTrigger`), so tests focus the
 * trigger element (a real `focus` event) and wait out the real delay rather
 * than clicking.
 */
@Component({
  selector: 'app-hover-card-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmHoverCardImports, HlmButtonImports, HlmAvatarImports, NgIcon],
  providers: [provideIcons({ lucideCalendar })],
  template: `
    <app-component-page slug="hover-card">
      <app-usage title="Profile preview" note="Focus or hover the link to preview the profile." [code]="codeDefault">
        <hlm-hover-card>
          <button hlmBtn variant="link" hlmHoverCardTrigger [showDelay]="0" [hideDelay]="0" [animationDelay]="0">&#64;analogjs</button>
          <hlm-hover-card-content *hlmHoverCardPortal class="w-72">
            <div class="flex justify-between gap-4">
              <hlm-avatar size="sm">
                <span hlmAvatarFallback>AN</span>
              </hlm-avatar>
              <div class="grid gap-1">
                <h4 class="text-sm font-semibold">&#64;analogjs</h4>
                <p class="text-sm">The Angular meta-framework.</p>
                <div class="flex items-center pt-1">
                  <ng-icon name="lucideCalendar" class="mr-2 opacity-70" />
                  <span class="text-muted-foreground text-xs">Joined December 2021</span>
                </div>
              </div>
            </div>
          </hlm-hover-card-content>
        </hlm-hover-card>
      </app-usage>

      <app-usage title="Sides" note="align controls which edge the card opens from." [code]="codeSides">
        <div class="flex gap-6">
          @for (a of aligns; track a) {
            <hlm-hover-card>
              <button
                hlmBtn
                variant="outline"
                hlmHoverCardTrigger
                [align]="a"
                [showDelay]="0"
                [hideDelay]="0"
                [animationDelay]="0"
              >
                {{ a }}
              </button>
              <hlm-hover-card-content *hlmHoverCardPortal class="w-40">Aligned to {{ a }}</hlm-hover-card-content>
            </hlm-hover-card>
          }
        </div>
      </app-usage>

      <app-usage
        title="Follow"
        [note]="following() ? 'Following.' : 'Not following.'"
        [code]="codeInteractive"
      >
        <hlm-hover-card>
          <button hlmBtn variant="link" hlmHoverCardTrigger [showDelay]="0" [hideDelay]="0" [animationDelay]="0">
            &#64;spartan
          </button>
          <hlm-hover-card-content *hlmHoverCardPortal class="w-64">
            <div class="grid gap-2">
              <h4 class="text-sm font-semibold">&#64;spartan</h4>
              <p class="text-sm">Angular component libraries.</p>
              <button hlmBtn [variant]="following() ? 'outline' : 'default'" size="sm" (click)="toggleFollow()">
                {{ following() ? 'Following' : 'Follow' }}
              </button>
            </div>
          </hlm-hover-card-content>
        </hlm-hover-card>
      </app-usage>

      <app-usage
        title="Custom delay"
        note="showDelay/hideDelay tuned per trigger — this one opens and closes instantly."
        [code]="codeDelay"
      >
        <hlm-hover-card>
          <button hlmBtn variant="outline" hlmHoverCardTrigger [showDelay]="0" [hideDelay]="0" [animationDelay]="0">
            Instant
          </button>
          <hlm-hover-card-content *hlmHoverCardPortal class="w-56">No delay on open or close.</hlm-hover-card-content>
        </hlm-hover-card>
      </app-usage>
    </app-component-page>
  `,
})
export class HoverCardPage {
  // Unlike popover's `align` (start/center/end relative to the trigger),
  // hover-card's `align` names the side the card opens toward — 'bottom' is
  // its own default, so POSITION_MAP has no entry for 'start'/'center'/'end'.
  protected readonly aligns = ['top', 'bottom', 'left', 'right'] as const;

  protected readonly following = signal(false);
  protected toggleFollow(): void {
    this.following.update((f) => !f);
  }

  protected readonly codeDefault = `<hlm-hover-card>
  <button hlmBtn variant="link" hlmHoverCardTrigger [showDelay]="0" [hideDelay]="0" [animationDelay]="0">&#64;analogjs</button>
  <hlm-hover-card-content *hlmHoverCardPortal class="w-72">
    <div class="flex justify-between gap-4">
      <hlm-avatar size="sm"><span hlmAvatarFallback>AN</span></hlm-avatar>
      <div class="grid gap-1">
        <h4 class="text-sm font-semibold">&#64;analogjs</h4>
        <p class="text-sm">The Angular meta-framework.</p>
      </div>
    </div>
  </hlm-hover-card-content>
</hlm-hover-card>`;

  protected readonly codeSides = `@for (a of ['top', 'bottom', 'left', 'right']; track a) {
  <hlm-hover-card>
    <button hlmBtn variant="outline" hlmHoverCardTrigger [align]="a">{{ a }}</button> <!-- top | bottom | left | right -->
    <hlm-hover-card-content *hlmHoverCardPortal class="w-40">Aligned to {{ a }}</hlm-hover-card-content>
  </hlm-hover-card>
}`;

  protected readonly codeInteractive = `following = signal(false);
toggleFollow() { this.following.update(f => !f); }

<hlm-hover-card-content *hlmHoverCardPortal>
  <button hlmBtn [variant]="following() ? 'outline' : 'default'" size="sm" (click)="toggleFollow()">
    {{ following() ? 'Following' : 'Follow' }}
  </button>
</hlm-hover-card-content>`;

  protected readonly codeDelay = `<hlm-hover-card>
  <button hlmBtn variant="outline" hlmHoverCardTrigger [showDelay]="0" [hideDelay]="0">Instant</button>
  <hlm-hover-card-content *hlmHoverCardPortal class="w-56">No delay on open or close.</hlm-hover-card-content>
</hlm-hover-card>`;
}
