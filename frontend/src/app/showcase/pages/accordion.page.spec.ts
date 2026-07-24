import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccordionPage } from './accordion.page';

describe('AccordionPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AccordionPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real accordion in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-accordion'), 'a usage stage rendered no accordion').toBeTruthy();
    }
  });

  it('every accordion item has both a trigger and content — the projected-slot failure mode', () => {
    const items = host.querySelectorAll('hlm-accordion-item');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.querySelector('hlm-accordion-trigger'), 'item rendered no trigger').toBeTruthy();
      expect(item.querySelector('hlm-accordion-content'), 'item rendered no content').toBeTruthy();
    }
  });

  it('drives the multiple usage from real signal state when a trigger is clicked', () => {
    const fixture = TestBed.createComponent(AccordionPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const multipleAccordion = [...root.querySelectorAll('hlm-accordion')].find(
      (el) => el.getAttribute('type') === 'multiple',
    ) as HTMLElement;
    expect(multipleAccordion, 'no type=multiple accordion found').toBeTruthy();

    const item = multipleAccordion.querySelector('hlm-accordion-item') as HTMLElement;
    const trigger = item.querySelector('button[brnAccordionTrigger]') as HTMLButtonElement;
    const before = item.getAttribute('data-state');

    trigger.click();
    fixture.detectChanges();

    expect(item.getAttribute('data-state')).not.toBe(before);
  });

  it('makes the disabled item real — its trigger button carries the native disabled attribute', () => {
    const disabledItem = host.querySelector('hlm-accordion-item[disabled]') as HTMLElement;
    expect(disabledItem, 'no disabled item found').toBeTruthy();
    const trigger = disabledItem.querySelector('button[brnAccordionTrigger]') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAccordion');
    expect(text).toContain('HlmAccordionTrigger');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/accordion');
  });
});
