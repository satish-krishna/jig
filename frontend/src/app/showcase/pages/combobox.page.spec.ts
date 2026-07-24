import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComboboxPage } from './combobox.page';

// jsdom has no scrollIntoView implementation; BrnComboboxItem's active-descendant
// key manager calls it when an item becomes active on click/select.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Combobox content lives behind `*hlmComboboxPortal`, so it renders nothing
 * until the input opens it, and the CDK overlay attaches the content to
 * `document.body` rather than under the fixture host.
 */
describe('ComboboxPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ComboboxPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ComboboxPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  async function openInput(input: HTMLInputElement): Promise<void> {
    input.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real combobox input', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('input'), 'a usage stage rendered no input').toBeTruthy();
    }
  });

  it('renders no combobox content until it is opened', () => {
    expect(document.body.querySelector('hlm-combobox-content')).toBeNull();
  });

  it('opens the default usage and lists real items from the component, not the code sample', async () => {
    // "Select a framework" is the placeholder on both the default and disabled
    // usages; the default usage renders first in DOM order.
    const defaultInput = host.querySelector('input[placeholder="Select a framework"]') as HTMLInputElement;
    await openInput(defaultInput);

    const content = document.body.querySelector('hlm-combobox-content');
    expect(content, 'combobox content did not render after opening the input').toBeTruthy();

    const items = [...content!.querySelectorAll('hlm-combobox-item')];
    expect(items.length).toBeGreaterThan(0);

    const angular = items.find((i) => i.textContent?.trim() === 'Angular') as HTMLElement;
    angular.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(defaultInput.value).toContain('Angular');
  });

  it('renders the pre-selected value as a chip in the multiple-selection usage', () => {
    const chip = [...host.querySelectorAll('hlm-combobox-chip')].find((c) => c.textContent?.trim() === 'Angular');
    expect(chip, 'no chip rendered for the pre-selected value').toBeTruthy();
  });

  it('disables the disabled-state combobox input for real, not by class alone', () => {
    const inputs = [...host.querySelectorAll('input')] as HTMLInputElement[];
    expect(inputs.some((i) => i.disabled)).toBe(true);
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const input = host.querySelector('#combobox-framework') as HTMLInputElement;
    expect(input).toBeTruthy();

    const field = input.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
    expect(input.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy, 'invalid combobox input has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Please select a framework');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCombobox');
    expect(text).toContain('showRemove'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/combobox');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
