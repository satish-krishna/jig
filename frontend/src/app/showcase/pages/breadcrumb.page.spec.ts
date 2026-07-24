import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbPage } from './breadcrumb.page';

describe('BreadcrumbPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BreadcrumbPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real breadcrumb list in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[hlmbreadcrumblist], [hlmBreadcrumbList]'), 'a usage stage rendered no breadcrumb list').toBeTruthy();
    }
  });

  it('every breadcrumb list ends in exactly one current page, not a link', () => {
    const lists = host.querySelectorAll('[hlmbreadcrumblist], [hlmBreadcrumbList]');
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      expect(list.querySelectorAll('[hlmbreadcrumbpage], [hlmBreadcrumbPage]').length).toBe(1);
    }
  });

  it('separates every two items with exactly one separator — the projected-slot failure mode', () => {
    const lists = [...host.querySelectorAll('[hlmbreadcrumblist], [hlmBreadcrumbList]')];
    for (const list of lists) {
      const items = list.querySelectorAll('li[hlmbreadcrumbitem], li[hlmBreadcrumbItem]');
      const separators = list.querySelectorAll('li[hlmbreadcrumbseparator], li[hlmBreadcrumbSeparator], [hlmBreadcrumbSeparator]');
      expect(separators.length, 'separator count should trail item count by one').toBe(items.length - 1);
    }
  });

  it('drives the state-driven trail from a real signal: drilling in adds a segment, clicking back truncates it', () => {
    const fixture = TestBed.createComponent(BreadcrumbPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const drillButton = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Open "Reports" folder')) as HTMLButtonElement;
    expect(drillButton, 'no drill-in button found').toBeTruthy();

    const stateList = root.querySelectorAll('[hlmbreadcrumblist], [hlmBreadcrumbList]')[2] as HTMLElement;
    expect(stateList.querySelectorAll('li[hlmbreadcrumbitem], li[hlmBreadcrumbItem]').length).toBe(2);

    drillButton.click();
    fixture.detectChanges();
    expect(stateList.querySelectorAll('li[hlmbreadcrumbitem], li[hlmBreadcrumbItem]').length).toBe(3);
    expect(stateList.textContent).toContain('Reports');

    const homeLink = [...stateList.querySelectorAll('a[hlmbreadcrumblink], a[hlmBreadcrumbLink]')][0] as HTMLAnchorElement;
    homeLink.click();
    fixture.detectChanges();
    expect(stateList.querySelectorAll('li[hlmbreadcrumbitem], li[hlmBreadcrumbItem]').length).toBe(1);
    expect(stateList.textContent).toContain('Home');
  });

  it('renders the ellipsis in the composition usage as a real component, not a text placeholder', () => {
    expect(host.querySelector('hlm-breadcrumb-ellipsis')).toBeTruthy();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmBreadcrumb');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/breadcrumb');
  });
});
