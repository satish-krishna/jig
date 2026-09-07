import { Component, signal } from '@angular/core';
import { HlmAspectRatioImports } from '@spartan-ng/helm/aspect-ratio';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Aspect ratio usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmAspectRatio` is a plain attribute directive whose
 * `ratio` input (aliased to the directive name) sets a `--ratio` CSS custom
 * property — there is no host template and no projected slot, so it is just
 * a `<div>` constrained to `aspect-(--ratio)` around whatever content it
 * wraps. No image assets are vendored into this template repo, so a labeled
 * gradient block stands in for the media every example constrains.
 */
@Component({
  selector: 'app-aspect-ratio-page',
  imports: [ComponentPage, Usage, HlmAspectRatioImports, HlmButtonImports],
  template: `
    <app-component-page slug="aspect-ratio">
      <app-usage title="16:9" note="The common widescreen ratio for video or hero media." [code]="codeWidescreen">
        <div [hlmAspectRatio]="16 / 9" class="bg-muted w-full max-w-sm overflow-hidden rounded-lg">
          <div class="text-muted-foreground flex h-full w-full items-center justify-center text-sm">16 / 9</div>
        </div>
      </app-usage>

      <app-usage title="1:1" note="A square crop, useful for thumbnails and avatars." [code]="codeSquare">
        <div [hlmAspectRatio]="1 / 1" class="bg-muted w-full max-w-48 overflow-hidden rounded-lg">
          <div class="text-muted-foreground flex h-full w-full items-center justify-center text-sm">1 / 1</div>
        </div>
      </app-usage>

      <app-usage title="9:16" note="A portrait ratio, the mirror of 16:9." [code]="codePortrait">
        <div [hlmAspectRatio]="9 / 16" class="bg-muted w-full max-w-40 overflow-hidden rounded-lg">
          <div class="text-muted-foreground flex h-full w-full items-center justify-center text-sm">9 / 16</div>
        </div>
      </app-usage>

      <app-usage
        title="Dynamic ratio"
        note="The ratio input is bound to a real signal; the button cycles it, nothing here is hand-set."
        [code]="codeDynamic"
      >
        <div class="flex w-full max-w-sm flex-col items-center gap-m">
          <div [hlmAspectRatio]="ratio()" class="bg-muted w-full overflow-hidden rounded-lg">
            <div class="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
              {{ label() }}
            </div>
          </div>
          <button hlmBtn variant="outline" size="sm" (click)="cycle()">Next ratio</button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class AspectRatioPage {
  private readonly presets = [
    { ratio: 16 / 9, label: '16 / 9' },
    { ratio: 4 / 3, label: '4 / 3' },
    { ratio: 1 / 1, label: '1 / 1' },
  ];

  private readonly index = signal(0);

  protected readonly ratio = () => this.presets[this.index()].ratio;
  protected readonly label = () => this.presets[this.index()].label;

  protected cycle(): void {
    this.index.update((i) => (i + 1) % this.presets.length);
  }

  protected readonly codeWidescreen = `<div [hlmAspectRatio]="16 / 9">
  <img src="..." alt="..." class="rounded-lg object-cover" />
</div>`;

  protected readonly codeSquare = `<div [hlmAspectRatio]="1 / 1">
  <img src="..." alt="..." class="rounded-lg object-cover" />
</div>`;

  protected readonly codePortrait = `<div [hlmAspectRatio]="9 / 16">
  <img src="..." alt="..." class="rounded-lg object-cover" />
</div>`;

  protected readonly codeDynamic = `// index picks a preset ratio from a real signal.
private readonly index = signal(0);
ratio = () => presets[this.index()].ratio;
cycle() { this.index.update((i) => (i + 1) % presets.length); }

<div [hlmAspectRatio]="ratio()">...</div>
<button hlmBtn variant="outline" size="sm" (click)="cycle()">Next ratio</button>`;
}
