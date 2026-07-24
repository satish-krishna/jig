import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarouselPage } from './carousel.page';

/**
 * carousel is the component with the named-slot trap: hlm-carousel's template
 * projects only `[hlmCarouselContent],hlm-carousel-content` — if a usage forgot
 * to nest hlm-carousel-content, the carousel would mount and render an empty
 * shell. Every test here checks the projected content actually landed.
 */
describe('CarouselPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CarouselPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real carousel in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-carousel'), 'a usage stage rendered no carousel').toBeTruthy();
    }
  });

  it('projects real slide content into the named hlm-carousel-content slot', () => {
    const carousels = host.querySelectorAll('hlm-carousel');
    expect(carousels.length).toBe(4);

    for (const carousel of carousels) {
      const content = carousel.querySelector('hlm-carousel-content');
      expect(content, 'carousel rendered no hlm-carousel-content').toBeTruthy();

      const items = content!.querySelectorAll('hlm-carousel-item');
      expect(items.length, 'hlm-carousel-content received no hlm-carousel-item children').toBeGreaterThan(0);

      // The projected-slot failure mode renders an empty shell — guard against that directly.
      expect(items[0].textContent?.trim(), 'the first carousel item rendered no text').not.toBe('');
    }
  });

  it('renders previous/next controls on every carousel', () => {
    for (const carousel of host.querySelectorAll('hlm-carousel')) {
      expect(carousel.querySelector('[hlm-carousel-previous], [hlmCarouselPrevious]'), 'no previous button').toBeTruthy();
      expect(carousel.querySelector('[hlm-carousel-next], [hlmCarouselNext]'), 'no next button').toBeTruthy();
    }
  });

  it('renders the vertical usage with orientation=vertical', () => {
    const vertical = host.querySelector('hlm-carousel[orientation="vertical"]');
    expect(vertical).toBeTruthy();
  });

  it('renders a slide display driven by the carousel own signals', () => {
    expect(host.querySelector('hlm-carousel-slide-display')).toBeTruthy();
  });

  it('renders full card compositions in the testimonials usage, not bare numbers', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('Olivia Martin');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCarousel');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/carousel');
  });
});
