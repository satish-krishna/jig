import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CollapsiblePage } from './collapsible.page';

describe('CollapsiblePage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CollapsiblePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real collapsible with a trigger and content in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-collapsible'), 'a usage stage rendered no collapsible').toBeTruthy();
      expect(
        stage.querySelector('button[hlmCollapsibleTrigger], hlm-collapsible-content'),
        'a usage stage rendered no trigger and no content',
      ).toBeTruthy();
    }
  });

  it('keeps a disabled collapsible closed when its trigger is clicked — real behavior, not a hand-set attribute', () => {
    const fixture = TestBed.createComponent(CollapsiblePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const disabledCollapsible = root.querySelector('hlm-collapsible[disabled]') as HTMLElement;
    expect(disabledCollapsible, 'no disabled collapsible found').toBeTruthy();
    expect(disabledCollapsible.getAttribute('data-state')).toBe('closed');

    const trigger = disabledCollapsible.querySelector('button[hlmCollapsibleTrigger]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    // BrnCollapsible.toggle() no-ops while disabled() is true — clicking must not open it.
    expect(disabledCollapsible.getAttribute('data-state')).toBe('closed');
  });

  it('drives the controlled usage from a real signal via an external button', () => {
    const fixture = TestBed.createComponent(CollapsiblePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const showButton = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Show shipping'));
    expect(showButton, 'no external toggle button found').toBeTruthy();

    const controlled = showButton!.closest('[data-slot="usage-stage"]')!.querySelector('hlm-collapsible')!;
    expect(controlled.getAttribute('data-state')).toBe('closed');

    (showButton as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(controlled.getAttribute('data-state')).toBe('open');
  });

  it('mutates a real signal when adding a team member in the composition usage', () => {
    const fixture = TestBed.createComponent(CollapsiblePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const heading = [...root.querySelectorAll('h4')].find((h) => h.textContent?.includes('Team ·'));
    expect(heading, 'no team heading found').toBeTruthy();
    expect(heading!.textContent).toContain('2 members');

    const addButton = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Add member'));
    (addButton as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(heading!.textContent).toContain('3 members');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCollapsible');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/collapsible');
  });
});
