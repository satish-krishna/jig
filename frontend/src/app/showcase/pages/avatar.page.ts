import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Avatar usages.
 *
 * CRITICAL anatomy note confirmed from the vendored source (`hlm-avatar.ts`):
 * `HlmAvatar`'s template is
 *   `@if (_image()?.canShow()) { <ng-content select="[hlmAvatarImage]" /> } @else { <ng-content select="[hlmAvatarFallback]" /> }`
 * — two NAMED projection slots gated on whether an image child exists and can
 * render. An `<hlm-avatar>` with neither child projects nothing and renders
 * empty. Every usage below projects a `span[hlmAvatarFallback]` (initials);
 * there are no image assets vendored into this template repo, so the image
 * slot is exercised structurally rather than with a real `<img>` — the
 * fallback path is what every example here actually renders.
 */
@Component({
  selector: 'app-avatar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmAvatarImports, HlmButtonImports],
  template: `
    <app-component-page slug="avatar">
      <app-usage
        title="Basic"
        note="No image is projected, so the fallback slot renders — hlm-avatar always needs one or the other."
        [code]="codeBasic"
      >
        <hlm-avatar>
          <span hlmAvatarFallback>RG</span>
        </hlm-avatar>
      </app-usage>

      <app-usage title="Sizes" note="sm, default and lg — the fallback text scales with the group." [code]="codeSizes">
        <div class="flex flex-wrap items-center gap-3">
          <hlm-avatar size="sm">
            <span hlmAvatarFallback>SM</span>
          </hlm-avatar>
          <hlm-avatar>
            <span hlmAvatarFallback>MD</span>
          </hlm-avatar>
          <hlm-avatar size="lg">
            <span hlmAvatarFallback>LG</span>
          </hlm-avatar>
        </div>
      </app-usage>

      <app-usage
        title="Status badge"
        note="Toggling status flips a real signal; the badge color class is bound to it, never hand-set."
        [code]="codeStatus"
      >
        <div class="flex flex-wrap items-center gap-3">
          <hlm-avatar>
            <span hlmAvatarFallback>RG</span>
            <hlm-avatar-badge [class]="online() ? 'bg-foreground' : 'bg-muted-foreground'" />
          </hlm-avatar>
          <button hlmBtn variant="outline" size="sm" (click)="toggleOnline()">
            {{ online() ? 'Go offline' : 'Go online' }}
          </button>
        </div>
      </app-usage>

      <app-usage
        title="Group with overflow count"
        note="hlm-avatar-group overlaps the ring; hlm-avatar-group-count is the +N overflow indicator."
        [code]="codeGroup"
      >
        <hlm-avatar-group>
          <hlm-avatar>
            <span hlmAvatarFallback>AB</span>
          </hlm-avatar>
          <hlm-avatar>
            <span hlmAvatarFallback>CD</span>
          </hlm-avatar>
          <hlm-avatar>
            <span hlmAvatarFallback>EF</span>
          </hlm-avatar>
          <hlm-avatar-group-count>+3</hlm-avatar-group-count>
        </hlm-avatar-group>
      </app-usage>
    </app-component-page>
  `,
})
export class AvatarPage {
  protected readonly online = signal(true);

  protected toggleOnline(): void {
    this.online.update((v) => !v);
  }

  protected readonly codeBasic = `<hlm-avatar>
  <span hlmAvatarFallback>RG</span>
</hlm-avatar>`;

  protected readonly codeSizes = `<hlm-avatar size="sm"><span hlmAvatarFallback>SM</span></hlm-avatar>
<hlm-avatar><span hlmAvatarFallback>MD</span></hlm-avatar>
<hlm-avatar size="lg"><span hlmAvatarFallback>LG</span></hlm-avatar>`;

  protected readonly codeStatus = `// online is a real signal; the badge color is bound to it.
online = signal(true);
toggleOnline() { this.online.update((v) => !v); }

<hlm-avatar>
  <span hlmAvatarFallback>RG</span>
  <hlm-avatar-badge [class]="online() ? 'bg-foreground' : 'bg-muted-foreground'" />
</hlm-avatar>`;

  protected readonly codeGroup = `<hlm-avatar-group>
  <hlm-avatar><span hlmAvatarFallback>AB</span></hlm-avatar>
  <hlm-avatar><span hlmAvatarFallback>CD</span></hlm-avatar>
  <hlm-avatar><span hlmAvatarFallback>EF</span></hlm-avatar>
  <hlm-avatar-group-count>+3</hlm-avatar-group-count>
</hlm-avatar-group>`;
}
