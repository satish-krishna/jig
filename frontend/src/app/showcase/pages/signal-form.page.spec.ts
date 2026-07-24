import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SignalFormPage } from './signal-form.page';

/** Narrower than `any`, so a rename in the page fails here. Mirrors user-form.spec.ts. */
interface TestModel {
  set: (v: { displayName: string; email: string }) => void;
}

describe('SignalFormPage', () => {
  let fixture: ComponentFixture<SignalFormPage>;
  let host: HTMLElement;

  const stage = (i: number) => host.querySelectorAll('[data-slot="usage-stage"]')[i];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SignalFormPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a live form in every usage stage', () => {
    for (const s of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(s.querySelector('form'), 'a usage stage rendered no form').toBeTruthy();
    }
  });

  it('takes its labels and placeholders from the schema, not from literals', () => {
    const labels = [...stage(1).querySelectorAll('label')].map((l) => l.textContent?.trim());
    expect(labels).toEqual(['Display name', 'Email address']);

    const email = stage(1).querySelector('input[id$="email"]');
    expect(email?.getAttribute('placeholder')).toBe('ada@example.io');
  });

  it('keeps a zod message hidden until its field is touched', () => {
    const error = stage(0).querySelector('hlm-field-error[data-error-for="displayName"]');

    expect(error, 'no error element rendered').toBeTruthy();
    expect(error?.hasAttribute('hidden'), 'a pristine form is shouting').toBe(true);
  });

  it('shows the schema’s own message once the field is touched', () => {
    const error = stage(2).querySelector('hlm-field-error[data-error-for="email"]');

    expect(error?.hasAttribute('hidden'), 'the pre-touched example is not showing').toBe(false);
    // the string lives in the zod schema, never restated as an Angular validator
    expect(error?.textContent).toContain('Enter a valid email');
  });

  // submit() is async, so these await the microtask before reading the DOM.
  it('refuses to run submit while the form is invalid', async () => {
    stage(3).querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(stage(3).querySelector('[data-slot="payload"]')).toBeNull();
  });

  it('runs submit and yields the typed model once the form is valid', async () => {
    const model = (fixture.componentInstance as unknown as { gateModel: TestModel }).gateModel;
    model.set({ displayName: 'Ada', email: 'ada@example.io' });
    fixture.detectChanges();

    stage(3).querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(stage(3).querySelector('[data-slot="payload"]')?.textContent).toContain('ada@example.io');
  });

  it('points at the canonical reference instead of documenting a second one', () => {
    expect(host.textContent).toContain('features/users/user-form.ts');
  });

  it('offers no spartan reference, because this is a pattern and not a component', () => {
    expect(host.querySelector('a[href*="spartan.ng"]')).toBeNull();
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
