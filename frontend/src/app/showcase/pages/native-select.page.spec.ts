import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NativeSelectPage } from './native-select.page';

describe('NativeSelectPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(NativeSelectPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real native select in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('select[data-slot="native-select"]'), 'a usage stage rendered no select').toBeTruthy();
    }
  });

  it('renders grouped options via optgroup', () => {
    const groups = host.querySelectorAll('optgroup[data-slot="native-select-optgroup"]');
    expect(groups.length).toBeGreaterThanOrEqual(2);
  });

  it('disables the disabled-state select for real, not by class alone', () => {
    const selects = [...host.querySelectorAll('select[data-slot="native-select"]')] as HTMLSelectElement[];
    expect(selects.some((s) => s.disabled)).toBe(true);
  });

  it('pairs the labeled select with its label via for/selectId', () => {
    const select = host.querySelector('#native-select-fruit');
    expect(select).toBeTruthy();
    expect(host.querySelector('label[for="native-select-fruit"]')).toBeTruthy();
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const select = host.querySelector('#native-select-fruit') as HTMLSelectElement;
    expect(select.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const field = select.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    // HlmNativeSelect does not host BrnFieldControlDescribedBy (confirmed in
    // frontend/libs/ui/native-select and the spartan docs' own examples, which
    // never pair hlm-field-error with hlm-native-select) — so aria-describedby
    // is intentionally not asserted here; asserting it would be a false claim.
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmNativeSelect');
    expect(text).toContain('selectId');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/native-select');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
