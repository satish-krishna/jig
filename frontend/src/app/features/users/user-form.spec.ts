import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UserForm } from './user-form';

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

  it('surfaces the zod validation on the matching field (Standard Schema bridge)', () => {
    const fixture = render();
    const form = (fixture.componentInstance as unknown as { form: any }).form;

    // The initial empty model violates the zod schema; validation runs natively.
    const nameErrors = form.name().errors();
    expect(nameErrors.length).toBeGreaterThan(0);
    expect(nameErrors.some((e: { message: string }) => /required/i.test(e.message))).toBe(true);
  });

  it('emits saved with the model when the form is valid', async () => {
    const fixture = render();
    const inst = fixture.componentInstance as unknown as {
      saved: { subscribe: (fn: (v: unknown) => void) => void };
      model: { set: (v: unknown) => void };
      onSubmit: (e: Event) => Promise<void>;
    };
    let emitted: unknown;
    inst.saved.subscribe((v) => (emitted = v));

    inst.model.set({ name: 'Ada', email: 'ada@example.io' });
    fixture.detectChanges();
    await inst.onSubmit(new Event('submit'));

    expect(emitted).toEqual({ name: 'Ada', email: 'ada@example.io' });
  });
});
