import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KbdPage } from './kbd.page';

describe('KbdPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(KbdPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real kbd in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('kbd[hlmkbd]'), 'a usage stage rendered no kbd').toBeTruthy();
    }
  });

  it('renders the shortcut group with its keys, not an empty wrapper', () => {
    const group = host.querySelector('kbd[hlmkbdgroup]');
    expect(group?.textContent).toContain('Ctrl');
    expect(group?.textContent).toContain('K');
  });

  it('starts the platform toggle on the Mac keys', () => {
    const fixture = TestBed.createComponent(KbdPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const toggleButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Show Windows keys'),
    ) as HTMLButtonElement;
    expect(toggleButton, 'no platform toggle button found').toBeTruthy();
    expect(toggleButton.parentElement?.textContent).toContain('⌘');
  });

  it('reflects a click into the real mac signal, swapping the rendered keys', () => {
    const fixture = TestBed.createComponent(KbdPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const toggleButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Show Windows keys'),
    ) as HTMLButtonElement;

    toggleButton.click();
    fixture.detectChanges();

    expect(toggleButton.textContent).toContain('Show Mac keys');
    expect(toggleButton.parentElement?.textContent).toContain('Ctrl');
    expect(toggleButton.parentElement?.textContent).not.toContain('⌘');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmKbd');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/kbd');
  });
});
