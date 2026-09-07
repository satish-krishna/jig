import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserForm } from './user-form';

// Minimal shape of the signal-form under test. Narrower than 'any' so a rename
// in the component fails here, without importing Angular's internal field types.
interface TestField {
  errors(): readonly { message: string }[];
  markAsTouched(): void;
  touched(): boolean;
}
interface TestForm {
  name: () => TestField;
  email: () => TestField;
}
interface TestViewModel {
  form: TestForm;
  model: { set: (v: unknown) => void };
}

describe('UserForm', () => {
  function render() {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(UserForm);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an input per schema field', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(2);
  });

  it('stacks its fields through the spartan field group, not a class that styles nothing', () => {
    // It carried class="user-form", which matched no rule in styles.css or any
    // component stylesheet, so the rows sat flush. hlmFieldGroup is spartan's own
    // field stack — the reference form should not hand-roll one.
    const form = render().nativeElement.querySelector('form');

    expect(form.getAttribute('data-slot')).toBe('field-group');
    expect(form.classList.contains('user-form')).toBe(false);
  });

  it('surfaces the zod validation on the matching field (Standard Schema bridge)', () => {
    const fixture = render();
    const form = (fixture.componentInstance as unknown as { vm: TestViewModel }).vm.form;

    // The initial empty model violates the zod schema; validation runs natively.
    const nameErrors = form.name().errors();
    expect(nameErrors.length).toBeGreaterThan(0);
    expect(nameErrors.some((e: { message: string }) => /required/i.test(e.message))).toBe(true);
  });

  it('keeps the validation message hidden until the field is touched', () => {
    const fixture = render();

    // The empty model is already invalid, so the message exists in the DOM from
    // the start; hlm-field-error is what decides it is not shown yet.
    const error = fixture.nativeElement.querySelector('hlm-field-error[data-error-for="name"]');
    expect(error.hasAttribute('hidden')).toBe(true);
  });

  it('shows the validation message to the user once the field is touched', () => {
    const fixture = render();
    const inst = fixture.componentInstance as unknown as { vm: TestViewModel };

    inst.vm.form.name().markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('hlm-field-error[data-error-for="name"]');
    expect(error, 'no hlm-field-error rendered for name').toBeTruthy();
    expect(error.hasAttribute('hidden'), 'error is rendered but hidden').toBe(false);
    expect(error.textContent.trim().length).toBeGreaterThan(0);
  });

  it('emits saved with the model when the form is valid', async () => {
    const fixture = render();
    const inst = fixture.componentInstance as unknown as {
      saved: { subscribe: (fn: (v: unknown) => void) => void };
      vm: TestViewModel;
      onSubmit: (e: Event) => Promise<void>;
    };
    let emitted: unknown;
    inst.saved.subscribe((v) => (emitted = v));

    inst.vm.model.set({ name: 'Ada', email: 'ada@example.io' });
    fixture.detectChanges();
    await inst.onSubmit(new Event('submit'));

    expect(emitted).toEqual({ name: 'Ada', email: 'ada@example.io' });
  });
});
