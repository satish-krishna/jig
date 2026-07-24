import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AutocompletePage } from './autocomplete.page';

/**
 * Autocomplete content lives behind `*hlmAutocompletePortal`, so it renders
 * nothing until the input opens it, and the CDK overlay attaches the content
 * to `document.body` rather than under the fixture host.
 */
describe('AutocompletePage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AutocompletePage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(AutocompletePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // BrnAutocompleteInput opens the popover on keydown/input, not on click —
  // dispatching a real `input` event is what a typing user actually triggers.
  async function openInput(input: HTMLInputElement): Promise<void> {
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real autocomplete input', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('input'), 'a usage stage rendered no input').toBeTruthy();
    }
  });

  it('renders no autocomplete content until it is opened', () => {
    expect(document.body.querySelector('hlm-autocomplete-content')).toBeNull();
  });

  it('filters real component options as the search signal changes, not a static list', async () => {
    const input = host.querySelector('input[placeholder="Search components"]') as HTMLInputElement;
    await openInput(input);

    let content = document.body.querySelector('hlm-autocomplete-content');
    expect(content?.querySelectorAll('hlm-autocomplete-item').length).toBeGreaterThan(1);

    input.value = 'Avatar';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    content = document.body.querySelector('hlm-autocomplete-content');
    const items = [...content!.querySelectorAll('hlm-autocomplete-item')];
    expect(items.length).toBe(1);
    expect(items[0].textContent?.trim()).toBe('Avatar');
  });

  it('shows a clear button only once the clearable usage has text', () => {
    const clearableInput = [...host.querySelectorAll('input[placeholder="Search components"]')][1] as HTMLInputElement;
    const stage = clearableInput.closest('[data-slot="usage-stage"]') as HTMLElement;
    expect(stage.querySelector('[data-slot="autocomplete-clear"]')).toBeNull();

    clearableInput.value = 'Dialog';
    clearableInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(stage.querySelector('[data-slot="autocomplete-clear"]')).toBeTruthy();
  });

  it('disables the disabled-state autocomplete input for real, not by class alone', () => {
    const inputs = [...host.querySelectorAll('input')] as HTMLInputElement[];
    expect(inputs.some((i) => i.disabled)).toBe(true);
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#autocomplete-component') as HTMLInputElement;
    expect(input).toBeTruthy();

    const field = input.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
    expect(input.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy, 'invalid autocomplete input has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Please select a component');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAutocompleteInput');
    expect(text).toContain('showClear'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/autocomplete');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
