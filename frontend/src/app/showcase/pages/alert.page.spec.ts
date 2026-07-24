import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertPage } from './alert.page';

describe('AlertPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AlertPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(AlertPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real alert in every usage stage that has one at rest', () => {
    // The "Form validation" stage deliberately shows no alert until the user
    // submits an invalid field — covered separately below.
    const stages = [...host.querySelectorAll('[data-slot="usage-stage"]')].slice(0, 3);
    for (const stage of stages) {
      expect(stage.querySelector('[data-slot="alert"]'), 'a usage stage rendered no alert').toBeTruthy();
    }
  });

  it('renders the destructive variant with its own styling hook', () => {
    const alerts = [...host.querySelectorAll('[data-slot="alert"]')];
    expect(alerts.some((a) => a.getAttribute('variant') === 'destructive')).toBe(true);
  });

  it('dismisses and restores the alert from real signal state', () => {
    const dismissButton = [...host.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Dismiss',
    ) as HTMLButtonElement;
    expect(dismissButton, 'no dismiss button found').toBeTruthy();

    dismissButton.click();
    fixture.detectChanges();

    const showAgain = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Show alert again'));
    expect(showAgain, 'dismissing did not swap in the restore button').toBeTruthy();

    (showAgain as HTMLButtonElement).click();
    fixture.detectChanges();
    expect([...host.querySelectorAll('button')].some((b) => b.getAttribute('aria-label') === 'Dismiss')).toBe(true);
  });

  it('shows the validation alert only after a real submit, driven by FormControl state', () => {
    const before = host.querySelectorAll('[data-slot="alert"][variant="destructive"]').length;

    const submit = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Submit');
    (submit as HTMLButtonElement).click();
    fixture.detectChanges();

    const after = host.querySelectorAll('[data-slot="alert"][variant="destructive"]').length;
    expect(after).toBeGreaterThan(before);
    expect(fixture.componentInstance['email'].touched).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAlert');
    expect(text).toContain('variant');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/alert');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('[forceShow], [forceshow]')).toBeNull();
  });
});
