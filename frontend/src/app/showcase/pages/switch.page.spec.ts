import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwitchPage } from './switch.page';

describe('SwitchPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SwitchPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real switch in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-switch'), 'a usage stage rendered no switch').toBeTruthy();
    }
  });

  it('renders the switch thumb internally, with no projected content required', () => {
    const thumbs = host.querySelectorAll('[data-slot="switch-thumb"]');
    const switches = host.querySelectorAll('hlm-switch');
    expect(thumbs.length).toBe(switches.length);
  });

  it('disables the disabled-state switch for real, not by class alone', () => {
    const brnSwitch = [...host.querySelectorAll('brn-switch')].find((s) => s.getAttribute('data-disabled') === 'true');
    expect(brnSwitch, 'no switch reached data-disabled=true').toBeTruthy();
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const brnSwitch = host.querySelector('#switch-required');
    expect(brnSwitch?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const field = brnSwitch?.closest('[hlmfield], hlm-field') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    // HlmSwitch forces aria-describedby to null on brn-switch and never wires
    // BrnFieldControlDescribedBy (confirmed in frontend/libs/ui/switch and the
    // brain switch source) — so it is intentionally not asserted here.
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSwitch');
    expect(text).toContain('checked'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/switch');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
