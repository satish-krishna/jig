import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ScrollAreaPage } from './scroll-area.page';

describe('ScrollAreaPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ScrollAreaPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real ng-scrollbar with hlm in every usage stage, holding overflowing content', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const scrollbar = stage.querySelector('ng-scrollbar[hlm]');
      expect(scrollbar, 'a usage stage rendered no ng-scrollbar[hlm]').toBeTruthy();
      expect(scrollbar!.textContent?.trim(), 'the scroll area rendered no content').not.toBe('');
    }
  });

  it('renders separators between the vertical list rows', () => {
    const list = host.querySelectorAll('ng-scrollbar')[0];
    expect(list.querySelectorAll('[hlmSeparator], hlm-separator').length).toBeGreaterThan(0);
  });

  it('marks the compact usage with appearance=compact', () => {
    expect(host.querySelector('ng-scrollbar[appearance="compact"]')).toBeTruthy();
  });

  it('drives the selectable-list composition from a real signal, not a hand-set class', () => {
    const fixture = TestBed.createComponent(ScrollAreaPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const rows = [...root.querySelectorAll('ng-scrollbar button')];
    expect(rows.length).toBeGreaterThan(1);
    expect(rows[0].querySelector('ng-icon'), 'the initially selected row should show a checkmark').toBeTruthy();
    expect(rows[1].querySelector('ng-icon')).toBeNull();

    (rows[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(rows[0].querySelector('ng-icon')).toBeNull();
    expect(rows[1].querySelector('ng-icon'), 'clicking a row did not move the checkmark').toBeTruthy();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmScrollArea');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/scroll-area');
  });
});
