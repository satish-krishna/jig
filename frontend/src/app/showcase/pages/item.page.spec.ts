import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ItemPage } from './item.page';

describe('ItemPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ItemPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real item with a non-empty title in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const items = [...stage.querySelectorAll('hlm-item')];
      expect(items.length, 'a usage stage rendered no item').toBeGreaterThan(0);
      for (const item of items) {
        expect(
          item.querySelector('hlm-item-title')?.textContent?.trim(),
          'an item rendered no visible title',
        ).not.toBe('');
      }
    }
  });

  it('renders the basic composition with real content', () => {
    expect(host.textContent).toContain('Your profile has been verified');
  });

  it('starts the removable group with two real invitations', () => {
    const fixture = TestBed.createComponent(ItemPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('ada@example.com');
    expect(root.textContent).toContain('grace@example.com');
  });

  it('mutates the real invites signal when a dismiss button is clicked', () => {
    const fixture = TestBed.createComponent(ItemPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const dismissButtons = [...root.querySelectorAll('button')].filter((b) =>
      b.querySelector('.sr-only')?.textContent === 'Dismiss',
    );
    expect(dismissButtons.length).toBe(2);

    (dismissButtons[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(root.textContent).not.toContain('ada@example.com');
    expect(root.textContent).toContain('grace@example.com');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmItem');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/item');
  });
});
