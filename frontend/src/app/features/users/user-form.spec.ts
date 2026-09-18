import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UserForm } from './user-form';
import { SchemaForm } from '../../forms/schema-form';
import { provideDefaultFormControls } from '../../forms/controls';

// These assert the RENDERED result, not the wiring that produced it. The component
// no longer owns a control per field to reach into — the schema does — so a test
// that poked at named form controls would be testing SchemaForm's internals from
// the wrong file. What is this component's own is: it passes the right schema, it
// labels its submit button, and it re-emits SchemaForm's untyped payload as the
// model. Everything else here is a check that the schema really did drive the DOM.
function render() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideDefaultFormControls()] });
  const fixture = TestBed.createComponent(UserForm);
  fixture.detectChanges();
  return fixture;
}

describe('UserForm', () => {
  it('renders the schema form with a control per field', () => {
    const host = render().nativeElement;

    expect(host.querySelector('app-schema-form')).toBeTruthy();
    expect(host.querySelector('#name'), 'no control for name').toBeTruthy();
    expect(host.querySelector('#email'), 'no control for email').toBeTruthy();
  });

  it('labels the submit button with the action, not the default', () => {
    // The e2e drives this form by that button's accessible name, so the label is
    // load-bearing beyond looking right.
    expect(render().nativeElement.querySelector('button[type="submit"]').textContent.trim()).toBe('Add user');
  });

  it('surfaces the schema validation message on an invalid submit', () => {
    const fixture = render();
    fixture.debugElement.query(By.directive(SchemaForm)).componentInstance.onSubmit(); // every field starts empty

    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-error-for="name"]');
    expect(error.textContent).toContain('Name is required');
  });

  it('shows no validation message before the first submit', () => {
    // The error slot is always in the DOM — hlm-field-error keeps its id stable for
    // aria-describedby and hides itself instead of unmounting — so "no message" is an
    // empty slot, not an absent element. Asserting absence here would pass only by
    // accident of how the host happens to render today.
    const error = render().nativeElement.querySelector('[data-error-for="name"]');

    expect(error, 'no error slot rendered for name').toBeTruthy();
    expect(error.textContent.trim()).toBe('');
  });

  it('narrows the payload SchemaForm emits and re-emits it as the UserFormModel on saved', () => {
    const fixture = render();
    const schemaForm = fixture.debugElement.query(By.directive(SchemaForm)).componentInstance as SchemaForm;
    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    schemaForm.form().setValue({ name: 'Ada', email: 'ada@example.io' });
    schemaForm.onSubmit();

    expect(emitted).toEqual({ name: 'Ada', email: 'ada@example.io' });
  });

  it('does not emit saved when the schema rejects the value', () => {
    const fixture = render();
    const schemaForm = fixture.debugElement.query(By.directive(SchemaForm)).componentInstance as SchemaForm;
    let emitted: unknown;
    fixture.componentInstance.saved.subscribe((v) => (emitted = v));

    schemaForm.form().setValue({ name: 'Ada', email: 'not-an-email' });
    schemaForm.onSubmit();

    expect(emitted).toBeUndefined();
  });
});
