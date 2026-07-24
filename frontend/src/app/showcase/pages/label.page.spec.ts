import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LabelPage } from './label.page';

describe('LabelPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LabelPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real label in every usage stage', () => {
    // The validated usage uses hlmFieldLabel, which composes HlmLabel as a
    // hostDirective and ends up tagged data-slot="field-label" instead.
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(
        stage.querySelector('[data-slot="label"], [data-slot="field-label"]'),
        'a usage stage rendered no label',
      ).toBeTruthy();
    }
  });

  it('pairs the sibling-style labels with their control via for/id', () => {
    const siblingLabels = [...host.querySelectorAll('[data-slot="label"][for]')] as HTMLLabelElement[];
    expect(siblingLabels.length).toBeGreaterThan(0);

    for (const label of siblingLabels) {
      const id = label.getAttribute('for');
      expect(host.querySelector(`#${id}`), `no control for label[for="${id}"]`).toBeTruthy();
    }
  });

  it('wraps its control in the wrapping-label usage instead of using for/id', () => {
    const wrapping = [...host.querySelectorAll('[data-slot="label"]')].find((l) => !l.hasAttribute('for'));
    expect(wrapping?.querySelector('input'), 'wrapping label usage has no nested input').toBeTruthy();
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#label-required') as HTMLInputElement;
    const field = input?.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input?.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Your name is required');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    expect(host.textContent).toContain('HlmLabel');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/label');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
