import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CheckboxPage } from './checkbox.page';

/**
 * The template every component page spec copies.
 *
 * Assert the RENDERED DOM, not that the component mounted. The failure mode
 * here is markup that compiles, mounts, and shows nothing — a projected slot
 * left empty renders bare text and no test that only checks mounting will
 * notice.
 */
describe('CheckboxPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CheckboxPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real checkbox in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-checkbox'), 'a usage stage rendered no checkbox').toBeTruthy();
    }
  });

  it('pairs every checkbox with a label via inputId', () => {
    const boxes = [...host.querySelectorAll('hlm-checkbox')];
    expect(boxes.length).toBeGreaterThan(0);

    for (const box of boxes) {
      const id = box.getAttribute('inputid') ?? box.getAttribute('inputId');
      expect(id, 'checkbox has no inputId to hang a label off').toBeTruthy();
      expect(host.querySelector(`label[for="${id}"]`), `no label for ${id}`).toBeTruthy();
    }
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const field = host.querySelector('[hlmfield]:has(hlm-field-error), hlm-field:has(hlm-field-error)');
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCheckbox');
    expect(text).toContain('indeterminate'); // a model() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/checkbox');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
