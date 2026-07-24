import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResizablePage } from './resizable.page';

describe('ResizablePage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ResizablePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real resizable group with at least two panels and a handle in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const group = stage.querySelector('hlm-resizable-group');
      expect(group, 'a usage stage rendered no resizable group').toBeTruthy();
      expect(group!.querySelectorAll('hlm-resizable-panel').length).toBeGreaterThanOrEqual(2);
      expect(group!.querySelector('hlm-resizable-handle'), 'group rendered no handle').toBeTruthy();
    }
  });

  it('gives every panel an explicit defaultSize', () => {
    const panels = host.querySelectorAll('hlm-resizable-panel');
    expect(panels.length).toBeGreaterThan(0);
    for (const panel of panels) {
      expect(panel.getAttribute('defaultSize'), 'panel has no explicit defaultSize').toBeTruthy();
    }
  });

  it('reflects direction onto data-panel-group-direction for both horizontal and vertical groups', () => {
    const directions = [...host.querySelectorAll('hlm-resizable-group')].map((el) =>
      el.getAttribute('data-panel-group-direction'),
    );
    expect(directions).toContain('horizontal');
    expect(directions).toContain('vertical');
  });

  it('nests a vertical group inside a panel of the horizontal group', () => {
    const outerGroups = [...host.querySelectorAll('hlm-resizable-group')].filter(
      (el) => el.getAttribute('data-panel-group-direction') === 'horizontal',
    );
    const nested = outerGroups.some((group) =>
      [...group.querySelectorAll('hlm-resizable-panel')].some((panel) => panel.querySelector('hlm-resizable-group')),
    );
    expect(nested, 'no horizontal group contains a nested resizable group').toBe(true);
  });

  it('resets the controlled layout via a real signal without throwing', () => {
    const fixture = TestBed.createComponent(ResizablePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const resetButton = [...root.querySelectorAll('button')].find((b) => b.textContent?.includes('Reset to'));
    expect(resetButton, 'no reset button found').toBeTruthy();

    expect(() => {
      (resetButton as HTMLButtonElement).click();
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmResizableGroup');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/resizable');
  });
});
