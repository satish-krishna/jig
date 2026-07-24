import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InputOtpPage } from './input-otp.page';

/**
 * BrnInputOtp has no BrnFieldControl at all (confirmed in
 * frontend/node_modules/@spartan-ng/brain, fesm2022 bundle), so it cannot
 * register with an ancestor hlm-field. The validated usage therefore proves
 * validation via a real disabled-button state instead of hlm-field-error,
 * which would silently never display for this control.
 */
describe('InputOtpPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<InputOtpPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(InputOtpPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function typeInto(otp: HTMLInputElement, value: string): void {
    otp.value = value;
    otp.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real brn-input-otp with slots in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('brn-input-otp'), 'a usage stage rendered no brn-input-otp').toBeTruthy();
      expect(stage.querySelectorAll('hlm-input-otp-slot').length, 'usage stage rendered no slots').toBeGreaterThan(0);
    }
  });

  it('disables the disabled-state control for real, not by class alone', () => {
    const inputs = [...host.querySelectorAll('input[data-slot="input-otp"]')] as HTMLInputElement[];
    expect(inputs.some((i) => i.disabled)).toBe(true);
  });

  it('drives the controlled-value usage from real input events, not a static string', () => {
    const controlledStage = [...host.querySelectorAll('[data-slot="usage-stage"]')].find((s) =>
      s.textContent?.includes('Current value:'),
    ) as HTMLElement;
    expect(controlledStage.textContent).toContain('(empty)');

    const otp = controlledStage.querySelector('input[data-slot="input-otp"]') as HTMLInputElement;
    typeInto(otp, '42');

    expect(controlledStage.textContent).toContain('Current value: 42');
  });

  it('drives the validated usage from real control state, not a hand-set disabled attribute', () => {
    const verifyButton = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Verify') as HTMLButtonElement;
    expect(verifyButton.disabled, 'verify button should start disabled while the control is invalid').toBe(true);
    expect(host.textContent).toContain('Enter all 6 digits.');

    const stage = verifyButton.closest('[data-slot="usage-stage"]') as HTMLElement;
    const otp = stage.querySelector('input[data-slot="input-otp"]') as HTMLInputElement;
    typeInto(otp, '123456');

    expect(verifyButton.disabled).toBe(false);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmInputOtpSlot');
    expect(text).toContain('index'); // a required input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/input-otp');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
