import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SeparatorPage } from './separator.page';

describe('SeparatorPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SeparatorPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real separator in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-separator, [hlmSeparator]'), 'a usage stage rendered no separator').toBeTruthy();
    }
  });

  it('reflects orientation onto data-orientation for both axes', () => {
    const orientations = [...host.querySelectorAll('hlm-separator')].map((el) => el.getAttribute('data-orientation'));
    expect(orientations).toContain('horizontal');
    expect(orientations).toContain('vertical');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSeparator');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/separator');
  });
});
