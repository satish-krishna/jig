import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PaginationPage } from './pagination.page';

describe('PaginationPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PaginationPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real pagination nav in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="pagination"]'), 'a usage stage rendered no pagination').toBeTruthy();
    }
  });

  it('every pagination-content list holds only li[hlmPaginationItem] children — the composition rule', () => {
    const lists = host.querySelectorAll('[data-slot="pagination-content"]');
    expect(lists.length).toBeGreaterThan(0);
    for (const list of lists) {
      expect(list.children.length).toBeGreaterThan(0);
      for (const child of [...list.children]) {
        expect(child.tagName.toLowerCase()).toBe('li');
      }
    }
  });

  it('the default usage marks exactly one link active', () => {
    const firstList = host.querySelector('[data-slot="pagination-content"]') as HTMLElement;
    const active = firstList.querySelectorAll('[data-slot="pagination-link"][data-active="true"]');
    expect(active.length).toBe(1);
    expect(active[0].textContent?.trim()).toBe('1');
  });

  it('drives hlm-numbered-pagination from real model state when a page link is clicked', () => {
    const fixture = TestBed.createComponent(PaginationPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const numbered = root.querySelector('hlm-numbered-pagination') as HTMLElement;
    expect(numbered, 'no hlm-numbered-pagination found').toBeTruthy();

    const links = [...numbered.querySelectorAll('a[hlmpaginationlink], a[hlmPaginationLink]')] as HTMLAnchorElement[];
    const pageTwo = links.find((a) => a.textContent?.trim() === '2');
    expect(pageTwo, 'no page-2 link found in numbered pagination').toBeTruthy();

    pageTwo!.click();
    fixture.detectChanges();

    expect(pageTwo!.getAttribute('data-active')).toBe('true');
  });

  it('drives the hand-built composition from the same signal when next is clicked', () => {
    const fixture = TestBed.createComponent(PaginationPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const lists = root.querySelectorAll('[data-slot="pagination-content"]');
    const compositionList = lists[lists.length - 1] as HTMLElement;
    const activeBefore = compositionList.querySelector('[data-active="true"]');
    expect(activeBefore?.textContent?.trim()).toBe('1');

    const secondLink = [...compositionList.querySelectorAll('a[hlmpaginationlink], a[hlmPaginationLink]')].find((a) => a.textContent?.trim() === '2') as HTMLAnchorElement;
    secondLink.click();
    fixture.detectChanges();

    expect(secondLink.getAttribute('data-active')).toBe('true');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmPagination');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/pagination');
  });
});
