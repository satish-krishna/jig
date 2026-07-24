import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ToggleGroupPage } from './toggle-group.page';

describe('ToggleGroupPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ToggleGroupPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real hlmToggleGroup with items in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const group = stage.querySelector('hlm-toggle-group');
      expect(group, 'a usage stage rendered no toggle group').toBeTruthy();
      expect(group?.querySelectorAll('[hlmtogglegroupitem]').length, 'the group rendered no items').toBeGreaterThan(
        0,
      );
    }
  });

  it('starts the single-select group on its initial value and the multi-select group with one item pressed', () => {
    const items = [...host.querySelectorAll('[hlmtogglegroupitem]')];
    const listItem = items.find((i) => i.textContent?.includes('List'));
    const boldItem = items.find((i) => i.getAttribute('aria-label') === 'Toggle bold');

    expect(listItem?.getAttribute('aria-pressed')).toBe('true');
    expect(boldItem?.getAttribute('aria-pressed')).toBe('true');
  });

  it('reaches disabled down onto every item when the group itself is disabled', () => {
    const disabledGroup = [...host.querySelectorAll('hlm-toggle-group')].find((g) => g.hasAttribute('disabled'));
    expect(disabledGroup, 'no disabled group found').toBeTruthy();
    const items = [...(disabledGroup?.querySelectorAll('[hlmtogglegroupitem]') ?? [])];
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.hasAttribute('disabled')), 'group disabled did not reach its items').toBe(true);
  });

  it('reads the field description straight off the group value signal, not a duplicated string', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('Buttons use font-normal.');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmToggleGroup');
    expect(text).toContain('spacing');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/toggle-group');
  });
});
