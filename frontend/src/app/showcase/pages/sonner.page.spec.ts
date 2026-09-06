import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SonnerPage } from './sonner.page';

/**
 * jsdom does not implement `window.matchMedia`. BrnSonnerToaster calls it
 * unconditionally on mount (to watch the OS theme preference), so it must be
 * stubbed for the toaster to mount at all — restored after every test so it
 * cannot leak into ThemeService's own "matchMedia is absent" test elsewhere.
 */
let originalMatchMedia: typeof window.matchMedia | undefined;

describe('SonnerPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SonnerPage>>;
  let host: HTMLElement;

  beforeEach(async () => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SonnerPage);
    fixture.detectChanges();
    await fixture.whenStable();
    host = fixture.nativeElement;
  });

  afterEach(() => {
    // Destroy while the stub is still active: BrnSonnerToaster calls
    // matchMedia again on teardown to unregister its listener, so restoring
    // the original (usually undefined) before destroying would throw during
    // the *next* test's automatic TestBed cleanup instead of this one.
    fixture.destroy();

    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      delete (window as any).matchMedia;
    }
  });

  function click(text: string): void {
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
    expect(button, `no button labelled "${text}"`).toBeTruthy();
    (button as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  // Scoped to the rendered toast titles/descriptions, not the whole page: the
  // <pre> code samples repeat these same message strings verbatim, so
  // asserting against host.textContent would pass even if the toast never
  // actually fired.
  function toastText(): string {
    return [...host.querySelectorAll('[data-title], [data-description]')].map((el) => el.textContent).join(' ');
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('mounts exactly one toaster for the whole page', () => {
    expect(host.querySelectorAll('hlm-toaster').length).toBe(1);
  });

  it('every usage stage has a real trigger to fire a toast', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('button'), 'a usage stage rendered no trigger button').toBeTruthy();
    }
  });

  it('actually fires a toast on click rather than showing a static mock', () => {
    expect(toastText()).not.toContain('Payment received');

    click('Success');

    expect(toastText()).toContain('Payment received');
  });

  it('dismisses every visible toast for real', () => {
    click('Success');
    click('Error');
    expect(toastText()).toContain('Payment received');
    expect(toastText()).toContain('Payment failed');

    const dismissAll = host.querySelector('button[aria-label="Dismiss all"]') as HTMLButtonElement;
    dismissAll.click();
    fixture.detectChanges();

    expect(toastText()).not.toContain('Payment received');
    expect(toastText()).not.toContain('Payment failed');
  });

  it('renders a description and a clickable action on the toast', () => {
    expect(toastText()).not.toContain('Sunday, December 3rd at 9:00 AM');

    click('Show toast');

    expect(toastText()).toContain('Sunday, December 3rd at 9:00 AM');
    const undo = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Undo');
    expect(undo, 'no Undo action button rendered on the toast').toBeTruthy();
  });

  it('positions a toast per the requested override', () => {
    expect(host.querySelector('[data-y-position="top"][data-x-position="left"]')).toBeNull();

    click('Top left');

    const toast = host.querySelector('[data-y-position="top"][data-x-position="left"]');
    expect(toast, 'no toast rendered at the top-left position').toBeTruthy();
  });

  it('tracks a real async task through its loading state', () => {
    expect(toastText()).not.toContain('Running task...');

    click('Run task');

    expect(toastText()).toContain('Running task...');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmToaster');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/sonner');
  });
});
