import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real tabs root in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="tabs"]'), 'a usage stage rendered no tabs').toBeTruthy();
    }
  });

  it('every tabs list has a matching content panel for each trigger — the projected-slot failure mode', () => {
    for (const tabs of host.querySelectorAll('[data-slot="tabs"]')) {
      const triggers = [...tabs.querySelectorAll('button[hlmTabsTrigger]')];
      expect(triggers.length).toBeGreaterThan(0);
      for (const trigger of triggers) {
        const id = trigger.getAttribute('hlmtabstrigger') ?? trigger.getAttribute('hlmTabsTrigger');
        expect(tabs.querySelector(`[hlmtabscontent="${id}"], [hlmTabsContent="${id}"]`), `no content panel for ${id}`).toBeTruthy();
      }
    }
  });

  it('the default usage keeps the active panel visible and hides the inactive ones', () => {
    const firstTabs = host.querySelector('[data-slot="tabs"]') as HTMLElement;
    const overview = firstTabs.querySelector('[hlmtabscontent="overview"], [hlmTabsContent="overview"]') as HTMLElement;
    const analytics = firstTabs.querySelector('[hlmtabscontent="analytics"], [hlmTabsContent="analytics"]') as HTMLElement;

    expect(overview.hidden).toBe(false);
    expect(analytics.hidden).toBe(true);
  });

  it('drives the state-driven usage from a real signal when the external button is clicked', () => {
    const fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const jumpButton = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Jump to invoice')) as HTMLButtonElement;
    expect(jumpButton, 'no jump-to-invoice button found').toBeTruthy();

    const stateTabs = [...root.querySelectorAll('[data-slot="tabs"]')].find((t) =>
      t.querySelector('[hlmtabstrigger="invoice"], [hlmTabsTrigger="invoice"]'),
    ) as HTMLElement;
    const invoicePanel = stateTabs.querySelector('[hlmtabscontent="invoice"], [hlmTabsContent="invoice"]') as HTMLElement;
    expect(invoicePanel.hidden).toBe(true);

    jumpButton.click();
    fixture.detectChanges();

    expect(invoicePanel.hidden).toBe(false);
  });

  it('activating a trigger by click flips its data-state to active', () => {
    const fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const firstTabs = root.querySelector('[data-slot="tabs"]') as HTMLElement;
    const analyticsTrigger = firstTabs.querySelector('[hlmtabstrigger="analytics"], [hlmTabsTrigger="analytics"]') as HTMLButtonElement;

    expect(analyticsTrigger.getAttribute('data-state')).toBe('inactive');
    analyticsTrigger.click();
    fixture.detectChanges();

    expect(analyticsTrigger.getAttribute('data-state')).toBe('active');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmTabs');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/tabs');
  });
});
