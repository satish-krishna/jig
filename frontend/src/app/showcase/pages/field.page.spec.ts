import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FieldPage } from './field.page';

describe('FieldPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FieldPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real field wrapper in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(
        stage.querySelector('[data-slot="field"], fieldset[data-slot="field-set"]'),
        'a usage stage rendered no field wrapper',
      ).toBeTruthy();
    }
  });

  it('pairs every field label with its control via for/id', () => {
    const labels = [...host.querySelectorAll('[data-slot="field-label"]')] as HTMLLabelElement[];
    expect(labels.length).toBeGreaterThan(0);

    for (const label of labels) {
      const forId = label.getAttribute('for');
      expect(forId, 'field label has no for attribute').toBeTruthy();
      expect(host.querySelector(`#${forId}`), `no control for label[for="${forId}"]`).toBeTruthy();
    }
  });

  it('groups the fieldset usage under a legend', () => {
    const fieldset = host.querySelector('fieldset[data-slot="field-set"]');
    expect(fieldset?.querySelector('legend[data-slot="field-legend"]')?.textContent).toContain('Contact');
    expect(fieldset?.querySelectorAll('input').length).toBe(2);
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#field-required-email') as HTMLInputElement;
    expect(input).toBeTruthy();

    const field = input.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy, 'invalid input has no aria-describedby').toBeTruthy();
    const error = host.querySelector(`#${describedBy}`);
    expect(error?.textContent).toContain('Enter a valid email address');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmField');
    expect(text).toContain('orientation'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/field');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
