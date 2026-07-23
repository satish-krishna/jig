import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShowcaseView } from './showcase.view';

describe('ShowcaseView', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    // helm link-bearing components (breadcrumb, pagination) inject ActivatedRoute
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ShowcaseView);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('renders an example per component it documents', () => {
    // The showcase exists to be copied from, so an example that silently stops
    // rendering is worse than no example at all.
    expect(host.querySelectorAll('app-showcase-example').length).toBeGreaterThan(30);
  });

  it.each([
    ['button', 'button[hlmbtn]'],
    ['field', 'hlm-field, [hlmfield]'],
    ['native-select', 'hlm-native-select'],
    ['checkbox', 'hlm-checkbox'],
    ['accordion', 'hlm-accordion'],
    ['table', 'table[hlmtable]'],
    ['card', '[hlmcard]'],
    ['tabs', 'hlm-tabs'],
  ])('mounts the %s example', (_name, selector) => {
    expect(host.querySelector(selector)).toBeTruthy();
  });

  it('gives every example a caption so the page is scannable', () => {
    const captions = [...host.querySelectorAll('figcaption')];
    expect(captions.length).toBeGreaterThan(30);
    expect(captions.every((c) => (c.textContent ?? '').trim().length > 0)).toBe(true);
  });
});
