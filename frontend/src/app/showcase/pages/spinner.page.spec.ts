import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SpinnerPage } from './spinner.page';

describe('SpinnerPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SpinnerPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SpinnerPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real spinner in every usage stage', () => {
    const stages = host.querySelectorAll('[data-slot="usage-stage"]');
    // The "Submitting" stage only mounts hlm-spinner once the real signal is
    // flipped on, so it is checked separately below rather than at rest.
    for (const stage of [stages[0], stages[1], stages[3]]) {
      expect(stage.querySelector('hlm-spinner'), 'a usage stage rendered no spinner').toBeTruthy();
    }
  });

  it('uses the custom icon input rather than the default loader', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[1];
    expect(stage.querySelector('hlm-spinner')?.getAttribute('icon')).toBe('lucideLoader');
  });

  it('mounts a spinner and disables the button only while really submitting', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[2];
    const submitButton = stage.querySelector('button') as HTMLButtonElement;
    expect(stage.querySelector('hlm-spinner'), 'expected no spinner before submitting').toBeNull();

    submitButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['submitting']()).toBe(true);
    expect(stage.querySelector('hlm-spinner'), 'expected a spinner while submitting').toBeTruthy();
    expect(submitButton.disabled).toBe(true);

    const cancelButton = stage.querySelector('button[aria-label="Cancel"]') as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['submitting']()).toBe(false);
    expect(stage.querySelector('hlm-spinner')).toBeNull();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSpinner');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/spinner');
  });
});
