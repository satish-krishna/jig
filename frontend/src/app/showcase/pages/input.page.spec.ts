import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InputPage } from './input.page';

describe('InputPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(InputPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real input in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('input[data-slot="input"]'), 'a usage stage rendered no input').toBeTruthy();
    }
  });

  it('disables the disabled-state input for real, not by class alone', () => {
    const disabled = [...host.querySelectorAll('input[data-slot="input"]')].find(
      (i) => (i as HTMLInputElement).placeholder === 'Disabled',
    ) as HTMLInputElement;
    expect(disabled?.disabled).toBe(true);
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#input-email') as HTMLInputElement;
    expect(input).toBeTruthy();

    const field = input.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
    expect(input.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy, 'invalid input has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Enter a valid email address');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    expect(host.textContent).toContain('HlmInput');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/input');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
