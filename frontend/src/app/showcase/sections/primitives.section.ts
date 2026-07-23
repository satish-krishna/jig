import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideInbox, lucideTrash } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmAspectRatioImports } from '@spartan-ng/helm/aspect-ratio';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmItemImports } from '@spartan-ng/helm/item';
import { HlmKbdImports } from '@spartan-ng/helm/kbd';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { ShowcaseExample } from '../showcase-example';

/**
 * Static presentation primitives: things that render state rather than collect it.
 */
@Component({
  selector: 'app-showcase-primitives',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideCheck, lucideInbox, lucideTrash })],
  imports: [
    NgIcon,
    ShowcaseExample,
    HlmAlertImports,
    HlmAspectRatioImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmEmptyImports,
    HlmItemImports,
    HlmKbdImports,
    HlmProgressImports,
    HlmSeparatorImports,
    HlmSkeletonImports,
    HlmSpinnerImports,
    HlmTypographyImports,
  ],
  template: `
    <app-showcase-example name="button">
      <div class="flex flex-wrap items-center gap-2">
        <button hlmBtn>Default</button>
        <button hlmBtn variant="secondary">Secondary</button>
        <button hlmBtn variant="outline">Outline</button>
        <button hlmBtn variant="ghost">Ghost</button>
        <button hlmBtn variant="destructive">Destructive</button>
        <button hlmBtn variant="link">Link</button>
        <button hlmBtn size="icon" variant="ghost" aria-label="Delete">
          <ng-icon name="lucideTrash" />
        </button>
      </div>
    </app-showcase-example>

    <app-showcase-example name="button-group">
      <div hlmButtonGroup>
        <button hlmBtn variant="outline">Day</button>
        <button hlmBtn variant="outline">Week</button>
        <button hlmBtn variant="outline">Month</button>
      </div>
    </app-showcase-example>

    <app-showcase-example name="badge">
      <div class="flex items-center gap-2">
        <span hlmBadge>Default</span>
        <span hlmBadge variant="secondary">Secondary</span>
        <span hlmBadge variant="outline">Outline</span>
        <span hlmBadge variant="destructive">Destructive</span>
      </div>
    </app-showcase-example>

    <app-showcase-example name="avatar">
      <hlm-avatar>
        <span hlmAvatarFallback>AL</span>
      </hlm-avatar>
    </app-showcase-example>

    <app-showcase-example name="kbd">
      <kbd hlmKbdGroup>
        <kbd hlmKbd>Ctrl</kbd>
        <kbd hlmKbd>K</kbd>
      </kbd>
    </app-showcase-example>

    <app-showcase-example name="separator">
      <div class="flex flex-col gap-2">
        <span>Above</span>
        <hlm-separator />
        <span>Below</span>
      </div>
    </app-showcase-example>

    <app-showcase-example name="skeleton">
      <div class="flex flex-col gap-2">
        <div hlmSkeleton class="h-4 w-48"></div>
        <div hlmSkeleton class="h-4 w-32"></div>
      </div>
    </app-showcase-example>

    <app-showcase-example name="spinner">
      <hlm-spinner />
    </app-showcase-example>

    <app-showcase-example name="progress">
      <hlm-progress class="w-64" [value]="64" />
    </app-showcase-example>

    <app-showcase-example name="alert">
      <div hlmAlert>
        <ng-icon name="lucideCheck" />
        <h4 hlmAlertTitle>Saved</h4>
        <p hlmAlertDescription>Your changes are on the server.</p>
      </div>
    </app-showcase-example>

    <app-showcase-example name="empty">
      <div hlmEmpty>
        <div hlmEmptyHeader>
          <div hlmEmptyMedia><ng-icon name="lucideInbox" /></div>
          <h4 hlmEmptyTitle>Nothing here yet</h4>
          <p hlmEmptyDescription>Records you create will show up in this list.</p>
        </div>
      </div>
    </app-showcase-example>

    <app-showcase-example name="item">
      <div hlmItem>
        <div hlmItemContent>
          <div hlmItemTitle>Ada Lovelace</div>
          <div hlmItemDescription>ada&#64;example.io</div>
        </div>
        <div hlmItemActions>
          <button hlmBtn size="sm" variant="outline">Open</button>
        </div>
      </div>
    </app-showcase-example>

    <app-showcase-example name="aspect-ratio">
      <!-- the ratio input is aliased to the selector itself, so it binds as [hlmAspectRatio] -->
      <div [hlmAspectRatio]="16 / 9" class="bg-muted w-64 rounded-lg"></div>
    </app-showcase-example>

    <app-showcase-example name="typography">
      <div>
        <h3 hlmH3>Heading</h3>
        <p hlmP>Body copy with <code hlmCode>inline code</code> in it.</p>
        <p hlmMuted>Muted supporting text.</p>
      </div>
    </app-showcase-example>
  `,
})
export class ShowcasePrimitives {}
