import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCarouselImports } from '@spartan-ng/helm/carousel';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Carousel usages. TRAP confirmed against both the spartan MCP docs and the
 * vendored source: `hlm-carousel`'s template projects with a NAMED slot —
 * `<ng-content select="[hlmCarouselContent],hlm-carousel-content" />` — so
 * every example below must nest `hlm-carousel-content` (holding one or more
 * `hlm-carousel-item`) directly inside `hlm-carousel`, or nothing renders.
 */
@Component({
  selector: 'app-carousel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmCarouselImports, HlmCardImports],
  template: `
    <app-component-page slug="carousel">
      <app-usage
        title="Default"
        note="hlm-carousel-content projects into the named slot; hlm-carousel-item is one slide."
        [code]="codeDefault"
      >
        <hlm-carousel class="w-full max-w-48">
          <hlm-carousel-content>
            @for (item of slides; track item) {
              <hlm-carousel-item>
                <div class="p-1">
                  <section hlmCard>
                    <p hlmCardContent class="flex aspect-square items-center justify-center p-6">
                      <span class="text-4xl font-semibold">{{ item }}</span>
                    </p>
                  </section>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlm-carousel-previous></button>
          <button hlm-carousel-next></button>
        </hlm-carousel>
      </app-usage>

      <app-usage
        title="Vertical orientation"
        note="orientation='vertical' also flips the previous/next buttons to stack above and below."
        [code]="codeVertical"
      >
        <hlm-carousel class="w-full max-w-48" orientation="vertical">
          <hlm-carousel-content class="h-56">
            @for (item of slides; track item) {
              <hlm-carousel-item>
                <div class="p-1">
                  <section hlmCard>
                    <p hlmCardContent class="flex items-center justify-center p-6">
                      <span class="text-3xl font-semibold">{{ item }}</span>
                    </p>
                  </section>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlm-carousel-previous></button>
          <button hlm-carousel-next></button>
        </hlm-carousel>
      </app-usage>

      <app-usage
        title="Multiple per view, with slide count"
        note="hlm-carousel-slide-display reads the carousel's own currentSlide/slideCount signals — no separate state to keep in sync."
        [code]="codeSlideCount"
      >
        <hlm-carousel class="w-full max-w-xs">
          <hlm-carousel-content>
            @for (item of slides; track item) {
              <hlm-carousel-item class="basis-1/2">
                <div class="p-1">
                  <section hlmCard>
                    <p hlmCardContent class="flex aspect-square items-center justify-center p-6">
                      <span class="text-2xl font-semibold">{{ item }}</span>
                    </p>
                  </section>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlm-carousel-previous></button>
          <button hlm-carousel-next></button>
          <hlm-carousel-slide-display class="mt-1 flex justify-end" />
        </hlm-carousel>
      </app-usage>

      <app-usage
        title="Composition: testimonials"
        note="Each slide is a full card composition rather than a bare number."
        [code]="codeComposition"
      >
        <hlm-carousel class="w-full max-w-xs">
          <hlm-carousel-content>
            @for (t of testimonials; track t.name) {
              <hlm-carousel-item>
                <div class="p-1">
                  <section hlmCard>
                    <div hlmCardContent class="flex flex-col gap-2 p-4">
                      <p class="text-sm">&ldquo;{{ t.quote }}&rdquo;</p>
                      <p class="text-muted-foreground text-xs font-medium">{{ t.name }}</p>
                    </div>
                  </section>
                </div>
              </hlm-carousel-item>
            }
          </hlm-carousel-content>
          <button hlm-carousel-previous></button>
          <button hlm-carousel-next></button>
        </hlm-carousel>
      </app-usage>
    </app-component-page>
  `,
})
export class CarouselPage {
  protected readonly slides = Array.from({ length: 5 }, (_, i) => i + 1);

  protected readonly testimonials = [
    { name: 'Olivia Martin', quote: 'Set up in an afternoon, and it just keeps working.' },
    { name: 'Jackson Lee', quote: 'The catalog means we never rebuild the same thing twice.' },
    { name: 'Isabella Nguyen', quote: 'Gates catch what review misses.' },
  ];

  protected readonly codeDefault = `<hlm-carousel class="w-full max-w-48">
  <hlm-carousel-content>
    @for (item of slides; track item) {
      <hlm-carousel-item>
        <section hlmCard>
          <p hlmCardContent class="flex aspect-square items-center justify-center p-6">
            {{ item }}
          </p>
        </section>
      </hlm-carousel-item>
    }
  </hlm-carousel-content>
  <button hlm-carousel-previous></button>
  <button hlm-carousel-next></button>
</hlm-carousel>`;

  protected readonly codeVertical = `<hlm-carousel class="w-full max-w-48" orientation="vertical">
  <hlm-carousel-content class="h-56">
    @for (item of slides; track item) {
      <hlm-carousel-item>{{ item }}</hlm-carousel-item>
    }
  </hlm-carousel-content>
  <button hlm-carousel-previous></button>
  <button hlm-carousel-next></button>
</hlm-carousel>`;

  protected readonly codeSlideCount = `<hlm-carousel class="w-full max-w-xs">
  <hlm-carousel-content>
    @for (item of slides; track item) {
      <hlm-carousel-item class="basis-1/2">{{ item }}</hlm-carousel-item>
    }
  </hlm-carousel-content>
  <button hlm-carousel-previous></button>
  <button hlm-carousel-next></button>
  <hlm-carousel-slide-display class="mt-1 flex justify-end" />
</hlm-carousel>`;

  protected readonly codeComposition = `<hlm-carousel class="w-full max-w-xs">
  <hlm-carousel-content>
    @for (t of testimonials; track t.name) {
      <hlm-carousel-item>
        <section hlmCard>
          <div hlmCardContent class="flex flex-col gap-2 p-4">
            <p class="text-sm">"{{ t.quote }}"</p>
            <p class="text-muted-foreground text-xs font-medium">{{ t.name }}</p>
          </div>
        </section>
      </hlm-carousel-item>
    }
  </hlm-carousel-content>
  <button hlm-carousel-previous></button>
  <button hlm-carousel-next></button>
</hlm-carousel>`;
}
