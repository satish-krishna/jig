import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InputGroupPage } from './input-group.page';

describe('InputGroupPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(InputGroupPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real input group control in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(
        stage.querySelector('[data-slot="input-group-control"]'),
        'a usage stage rendered no input group control',
      ).toBeTruthy();
    }
  });

  it('renders the icon addon and the textarea addon distinctly', () => {
    expect(host.querySelector('ng-icon')).toBeTruthy();
    expect(host.querySelector('textarea[data-slot="input-group-control"]')).toBeTruthy();
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#input-group-url') as HTMLInputElement;
    expect(input).toBeTruthy();

    const field = input.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
    expect(input.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy, 'invalid input has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Enter your website URL');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmInputGroup');
    expect(text).toContain('align'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/input-group');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
