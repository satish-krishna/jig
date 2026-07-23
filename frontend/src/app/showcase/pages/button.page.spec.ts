import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButtonPage } from './button.page';

describe('ButtonPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ButtonPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real hlmBtn element in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[hlmbtn]'), 'a usage stage rendered no hlmBtn element').toBeTruthy();
    }
  });

  it('covers every semantic variant', () => {
    const text = host.textContent ?? '';
    for (const label of ['Default', 'Outline', 'Secondary', 'Ghost', 'Destructive', 'Link']) {
      expect(text).toContain(label);
    }
  });

  it('starts the Save button idle, with no spinner and no disabled attribute', () => {
    const saveButton = [...host.querySelectorAll('[hlmbtn]')].find((b) => b.textContent?.includes('Save'));
    expect(saveButton, 'no Save button found').toBeTruthy();
    expect(saveButton?.querySelector('hlm-spinner')).toBeNull();
    expect(saveButton?.hasAttribute('disabled')).toBe(false);
  });

  it('reflects a click into a real spinner and a disabled attribute, not hand-set state', () => {
    const fixture = TestBed.createComponent(ButtonPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const saveButton = [...root.querySelectorAll('[hlmbtn]')].find((b) =>
      b.textContent?.includes('Save'),
    ) as HTMLButtonElement;

    saveButton.click();
    fixture.detectChanges();

    expect(saveButton.querySelector('hlm-spinner'), 'clicking Save did not render a spinner').toBeTruthy();
    expect(saveButton.hasAttribute('disabled')).toBe(true);
  });

  it('sets data-icon on icons so the button padding utilities apply', () => {
    const icons = [...host.querySelectorAll('ng-icon[data-icon]')];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    expect(icons.some((i) => i.getAttribute('data-icon') === 'inline-start')).toBe(true);
    expect(icons.some((i) => i.getAttribute('data-icon') === 'inline-end')).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmButton');
    expect(text).toContain('variant');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/button');
  });
});
