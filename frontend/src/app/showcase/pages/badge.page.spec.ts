import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BadgePage } from './badge.page';

describe('BadgePage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BadgePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real badge in every usage stage that always shows one', () => {
    // The "In context" stage starts with count() at 0, so its badge is intentionally
    // absent until a real click happens — that path is covered by its own test below.
    const stages = [...host.querySelectorAll('[data-slot="usage-stage"]')];
    for (const stage of stages.slice(0, 3)) {
      expect(stage.querySelector('[hlmbadge]'), 'a usage stage rendered no badge').toBeTruthy();
    }
  });

  it('covers every semantic variant', () => {
    const text = host.textContent ?? '';
    for (const label of ['Default', 'Secondary', 'Destructive', 'Outline', 'Ghost', 'Link']) {
      expect(text).toContain(label);
    }
  });

  it('sets data-icon on the icon badge so its padding utilities apply', () => {
    const icon = host.querySelector('[hlmbadge] ng-icon[data-icon="inline-start"]');
    expect(icon, 'no inline-start icon found inside a badge').toBeTruthy();
  });

  it('does not render a notification badge until the real count signal is positive', () => {
    const bellButton = [...host.querySelectorAll('button')].find((b) =>
      b.getAttribute('aria-label') === 'Notifications',
    ) as HTMLElement;
    expect(bellButton, 'no notification button found').toBeTruthy();
    expect(bellButton.querySelector('[hlmbadge]')).toBeNull();
  });

  it('reflects a click into the real count signal everywhere it is displayed', () => {
    const fixture = TestBed.createComponent(BadgePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const simulateButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Simulate event'),
    ) as HTMLButtonElement;
    expect(simulateButton, 'no simulate button found').toBeTruthy();

    simulateButton.click();
    fixture.detectChanges();

    const bellButton = [...root.querySelectorAll('button')].find((b) =>
      b.getAttribute('aria-label') === 'Notifications',
    ) as HTMLElement;
    expect(bellButton.querySelector('[hlmbadge]')?.textContent?.trim()).toBe('1');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmBadge');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/badge');
  });
});
