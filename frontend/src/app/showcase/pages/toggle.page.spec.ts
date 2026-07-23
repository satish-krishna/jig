import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TogglePage } from './toggle.page';

describe('TogglePage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TogglePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real hlmToggle button in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[hlmtoggle]'), 'a usage stage rendered no toggle').toBeTruthy();
    }
  });

  it('starts the bookmark toggle unpressed and flips a real two-way state binding on click', () => {
    const fixture = TestBed.createComponent(TogglePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const bookmark = [...root.querySelectorAll('[hlmtoggle]')].find((b) =>
      b.textContent?.includes('Bookmark'),
    ) as HTMLButtonElement;
    expect(bookmark, 'no Bookmark toggle found').toBeTruthy();
    expect(bookmark.getAttribute('aria-pressed')).toBe('false');

    bookmark.click();
    fixture.detectChanges();

    expect(bookmark.getAttribute('aria-pressed'), 'clicking did not flip aria-pressed').toBe('true');
  });

  it('renders a statically disabled toggle alongside the interactive one', () => {
    const disabled = [...host.querySelectorAll('[hlmtoggle]')].find((b) => b.hasAttribute('disabled'));
    expect(disabled).toBeTruthy();
  });

  it('pairs the field toggle with a label via a real id, not a hand-set attribute pair', () => {
    const toggle = host.querySelector('#toggle-notif');
    expect(toggle, 'no toggle with id toggle-notif found').toBeTruthy();
    expect(host.querySelector('label[for="toggle-notif"]'), 'no label pointing at the toggle').toBeTruthy();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmToggle');
    expect(text).toContain('variant');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/toggle');
  });
});
