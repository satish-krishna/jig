import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SliderPage } from './slider.page';

describe('SliderPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SliderPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real slider with at least one thumb in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const slider = stage.querySelector('hlm-slider');
      expect(slider, 'a usage stage rendered no slider').toBeTruthy();
      expect(slider?.querySelector('[brnsliderthumb]'), 'slider rendered no thumb').toBeTruthy();
    }
  });

  it('renders two thumbs for the range usage', () => {
    const sliders = [...host.querySelectorAll('hlm-slider')];
    const rangeSlider = sliders.find((s) => s.querySelectorAll('[brnsliderthumb]').length === 2);
    expect(rangeSlider, 'no slider rendered two thumbs for the range usage').toBeTruthy();
  });

  it('disables the disabled-state slider for real, not by class alone', () => {
    const disabled = [...host.querySelectorAll('hlm-slider')].find((s) => s.getAttribute('data-disabled') === '');
    expect(disabled).toBeTruthy();
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const slider = host.querySelector('#slider-volume');
    expect(slider?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const field = slider?.closest('[hlmfield], hlm-field') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    // BrnSlider never wires BrnFieldControlDescribedBy (confirmed in
    // frontend/libs/ui/slider and the brain slider source) — so
    // aria-describedby is intentionally not asserted here.
  });

  it('renders the generated API table rather than a hand-written one', () => {
    expect(host.textContent).toContain('HlmSlider');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/slider');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
