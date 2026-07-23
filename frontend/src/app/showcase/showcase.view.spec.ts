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

  it('projects a visible indicator into every radio', () => {
    // hlm-radio renders <ng-content select="...hlm-radio-indicator" indicator />:
    // the visible control is projected, not built in. Omit it and the radio
    // renders as bare text with no button — which is exactly what shipped.
    const radios = [...host.querySelectorAll('hlm-radio')];
    expect(radios.length).toBeGreaterThan(0);
    expect(radios.every((r) => r.querySelector('hlm-radio-indicator') !== null)).toBe(true);
  });

  it('pairs every radio with a label via inputId', () => {
    for (const radio of host.querySelectorAll('hlm-radio')) {
      const id = radio.getAttribute('inputid') ?? radio.getAttribute('inputId');
      expect(id, 'radio has no inputId to hang a label off').toBeTruthy();
      expect(host.querySelector(`label[for="${id}"]`)).toBeTruthy();
    }
  });

  it('demonstrates the invalid state with real validation, not hand-set attributes', () => {
    // A showcase is copied from. Faking data-invalid/aria-invalid in markup and
    // forcing the message visible produces a field that LOOKS right and is broken
    // in the two ways that matter: the control never gets the destructive ring,
    // and the error is never announced.
    const caption = [...host.querySelectorAll('figcaption')].find(
      (c) => c.textContent?.trim() === 'field (invalid)',
    );
    const stage = caption?.parentElement?.querySelector('div');
    const field = stage?.querySelector('hlm-field, [hlmfield]') as HTMLElement;
    const input = field.querySelector('input') as HTMLElement;
    const error = field.querySelector('hlm-field-error') as HTMLElement;

    expect(field.getAttribute('data-matches-spartan-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('never reaches for forceShow, which bypasses the error a11y registration', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });

  it('gives every example a caption so the page is scannable', () => {
    const captions = [...host.querySelectorAll('figcaption')];
    expect(captions.length).toBeGreaterThan(30);
    expect(captions.every((c) => (c.textContent ?? '').trim().length > 0)).toBe(true);
  });
});
