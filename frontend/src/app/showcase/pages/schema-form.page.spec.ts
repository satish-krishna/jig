import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SchemaForm } from '../../forms/schema-form';
import { provideDefaultFormControls } from '../../forms/controls';
import { SchemaFormPage } from './schema-form.page';

/**
 * Assert the RENDERED DOM, as every component page spec does. This page carries
 * one extra risk the spartan pages do not: its API table comes from an app
 * source the generator has to be told about, so a page that looks right can
 * still be documenting nothing.
 */
describe('SchemaFormPage', () => {
  let fixture: ComponentFixture<SchemaFormPage>;
  let host: HTMLElement;

  const forms = () => fixture.debugElement.queryAll(By.directive(SchemaForm));

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideDefaultFormControls()] });
    fixture = TestBed.createComponent(SchemaFormPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a live form in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('form'), 'a usage stage rendered no form').toBeTruthy();
    }
  });

  it('renders every control kind the switch knows about', () => {
    const kinds = host.querySelectorAll('app-usage')[1];

    expect(kinds.querySelector('textarea'), 'no textarea').toBeTruthy();
    expect(kinds.querySelector('hlm-native-select'), 'no select').toBeTruthy();
    expect(kinds.querySelector('hlm-checkbox'), 'no checkbox').toBeTruthy();
    expect(kinds.querySelector('input[type="number"]'), 'no number input').toBeTruthy();
    expect(kinds.querySelector('input[type="text"]'), 'no text input').toBeTruthy();
  });

  it('folds a zod message onto the field that failed, not the top of the form', () => {
    forms()[2].componentInstance.onSubmit(); // every field is empty
    fixture.detectChanges();

    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[2];
    const error = stage.querySelector('[data-error-for="name"]');
    expect(error?.textContent).toContain('Name is required');
  });

  it('drives the failed field into spartan-invalid, so the control looks wrong too', () => {
    forms()[2].componentInstance.onSubmit();
    fixture.detectChanges();

    const field = host
      .querySelectorAll('[data-slot="usage-stage"]')[2]
      .querySelector('hlm-field');
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');
  });

  it('rebuilds the form when the schema input changes, which is the whole point', () => {
    // Scoped to the swap usage: two other stages render the contact schema, so a
    // page-wide label query would report "Message" whatever this one does.
    const labels = () =>
      [...host.querySelectorAll('[data-slot="usage-stage"]')[3].querySelectorAll('label')].map(
        (l) => l.textContent?.trim(),
      );

    expect(labels()).toContain('Message');
    expect(labels()).not.toContain('Port');

    host.querySelector<HTMLButtonElement>('#swap-to-server')!.click();
    fixture.detectChanges();

    expect(labels()).toContain('Port');
    expect(labels()).not.toContain('Message');
  });

  it('documents the component from the generated table, not a hand-written one', () => {
    const text = host.textContent ?? '';

    expect(text).toContain('SchemaForm');
    expect(text).toContain('app-schema-form');
    expect(text).toContain('z.ZodObject<z.ZodRawShape>'); // only the generator knows this
  });

  it('offers no spartan reference, because spartan did not write this component', () => {
    expect(host.querySelector('a[href*="spartan.ng"]')).toBeNull();
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
