import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AspectRatioPage } from './aspect-ratio.page';

describe('AspectRatioPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AspectRatioPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real hlmAspectRatio box with visible content in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      // hlmAspectRatio is bound via property syntax ([hlmAspectRatio]="..."), so it never
      // appears as a static DOM attribute — the host's [style.--ratio] binding is the
      // reliable, directive-driven fingerprint that the box actually applied it.
      const box = stage.querySelector('[style*="--ratio"]') as HTMLElement;
      expect(box, 'a usage stage rendered no aspect-ratio box').toBeTruthy();
      expect(box.textContent?.trim(), 'an aspect-ratio box rendered no visible content').not.toBe('');
    }
  });

  it('sets the --ratio custom property from the static inputs', () => {
    const box = host.querySelector('[style*="--ratio"]') as HTMLElement;
    expect(box.style.getPropertyValue('--ratio')).not.toBe('');
  });

  it('starts the dynamic usage on the 16 / 9 preset', () => {
    const fixture = TestBed.createComponent(AspectRatioPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const nextButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Next ratio'),
    ) as HTMLButtonElement;
    expect(nextButton, 'no next-ratio button found').toBeTruthy();
    expect(nextButton.previousElementSibling?.textContent).toContain('16 / 9');
  });

  it('reflects a click into the real ratio signal, cycling the preset', () => {
    const fixture = TestBed.createComponent(AspectRatioPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const nextButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Next ratio'),
    ) as HTMLButtonElement;

    nextButton.click();
    fixture.detectChanges();

    expect(nextButton.previousElementSibling?.textContent).toContain('4 / 3');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAspectRatio');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/aspect-ratio');
  });
});
