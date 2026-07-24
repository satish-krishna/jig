import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { UndocumentedPage } from './undocumented.page';

/**
 * The catch-all route. Both branches matter and neither was covered: this was
 * the one production file in the showcase without a spec, and its unknown-slug
 * path used to render an empty heading over an empty API table — a 404 that
 * looked like a component.
 */
function renderWith(slug: string): HTMLElement {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug })) } },
    ],
  });
  const fixture = TestBed.createComponent(UndocumentedPage);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('UndocumentedPage', () => {
  describe('when the slug names a real component', () => {
    let host: HTMLElement;

    beforeEach(() => {
      host = renderWith('button');
    });

    it('renders the component frame, not the not-found state', () => {
      expect(host.querySelector('app-component-page')).toBeTruthy();
      expect(host.querySelector('[data-testid="showcase-not-found"]')).toBeNull();
    });

    it('still shows the generated API, because that part is always accurate', () => {
      expect(host.textContent).toContain('HlmButton');
    });

    it('says the usages are missing rather than implying the component is', () => {
      expect(host.textContent).toContain('Usages not written yet');
    });
  });

  describe('when the slug names nothing', () => {
    let host: HTMLElement;

    beforeEach(() => {
      host = renderWith('not-a-component');
    });

    it('renders a real not-found instead of an empty heading', () => {
      expect(host.querySelector('[data-testid="showcase-not-found"]')).toBeTruthy();
      expect(host.querySelector('app-component-page')).toBeNull();
    });

    it('echoes what was asked for, so the typo is visible', () => {
      expect(host.textContent).toContain('not-a-component');
    });

    it('offers a way back to the index', () => {
      const back = host.querySelector('a[href]') as HTMLAnchorElement;
      expect(back?.getAttribute('href')).toBe('/showcase');
    });
  });
});
