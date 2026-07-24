import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RadioGroupPage } from './radio-group.page';

describe('RadioGroupPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(RadioGroupPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real radio group with a projected indicator in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-radio-group, [hlmradiogroup]'), 'a usage stage rendered no radio group').toBeTruthy();
      expect(
        stage.querySelector('hlm-radio-indicator'),
        'a usage stage rendered a radio with no projected indicator',
      ).toBeTruthy();
    }
  });

  it('pairs every radio with a label via inputId, and every radio has a rendered indicator', () => {
    const radios = [...host.querySelectorAll('hlm-radio')];
    expect(radios.length).toBeGreaterThan(0);

    for (const radio of radios) {
      expect(radio.querySelector('hlm-radio-indicator'), 'hlm-radio has no projected hlm-radio-indicator').toBeTruthy();

      const id = radio.getAttribute('inputid') ?? radio.getAttribute('inputId');
      expect(id, 'radio has no inputId to hang a label off').toBeTruthy();
      expect(host.querySelector(`label[for="${id}"]`), `no label for ${id}`).toBeTruthy();
    }
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    // BrnRadioGroup composes BrnFieldControl and BrnFieldControlDescribedBy onto
    // the same hlm-radio-group host element, so both the touched-aware invalid
    // state and aria-describedby land there directly.
    const group = host.querySelector('hlm-radio-group[data-matches-spartan-invalid="true"]');
    expect(group, 'the validated radio group never reached the earned invalid state').toBeTruthy();

    const describedBy = group?.getAttribute('aria-describedby');
    expect(describedBy, 'invalid radio group has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Please choose a plan');

    const field = group?.closest('[hlmfield], hlm-field') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmRadio');
    expect(text).toContain('inputId'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/radio-group');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
