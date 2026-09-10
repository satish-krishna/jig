import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormGroup } from '@angular/forms';
import { z } from 'zod';
import { SchemaForm } from '../schema-form';
import { provideDefaultFormControls } from './index';
import type { FormFieldMeta } from '../form-field-meta';

const m = (label: string, extra: Partial<FormFieldMeta> = {}) => ({ label, ...extra }) as FormFieldMeta;

const schema = z.object({
  team: z.string().meta(m('Team')),
  contacts: z
    .array(z.object({ email: z.string().min(1, 'Email is required').meta(m('Email')) }))
    .meta(m('Contacts')),
});

function render() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideDefaultFormControls()] });
  const fixture = TestBed.createComponent(SchemaForm);
  fixture.componentRef.setInput('schema', schema);
  fixture.detectChanges();
  return fixture;
}

describe('arrays of objects', () => {
  it('starts with no rows and renders an add affordance', () => {
    const el = render().nativeElement;
    expect(el.querySelectorAll('[data-array-row]').length).toBe(0);
    expect(el.querySelector('[data-array-add]')).toBeTruthy();
  });

  it('adds a row built from the item template', () => {
    const fixture = render();
    (fixture.nativeElement.querySelector('[data-array-add]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[data-array-row]').length).toBe(1);
    const array = fixture.componentInstance.form().get('contacts') as FormArray;
    expect(array.length).toBe(1);
    expect((array.at(0) as FormGroup).get('email')).toBeTruthy();
  });

  it('removes the row the button belongs to', () => {
    const fixture = render();
    const add = fixture.nativeElement.querySelector('[data-array-add]') as HTMLButtonElement;
    add.click();
    add.click();
    fixture.detectChanges();

    // Two structurally identical empty rows cannot distinguish "removed the
    // right row" from "always removes the last/first row" — seed them
    // distinguishably so a wrong-index bug fails loudly.
    const contacts = fixture.componentInstance.form().get('contacts') as FormArray;
    (contacts.at(0) as FormGroup).get('email')!.setValue('first@example.io');
    (contacts.at(1) as FormGroup).get('email')!.setValue('second@example.io');
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll('[data-array-remove]')[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(contacts.length).toBe(1);
    expect((contacts.at(0) as FormGroup).get('email')!.value).toBe('second@example.io');
  });

  it('gives every row its own DOM identity, so ids do not collide across rows', () => {
    const fixture = render();
    const add = fixture.nativeElement.querySelector('[data-array-add]') as HTMLButtonElement;
    add.click();
    add.click();
    fixture.detectChanges();

    const rows = [...fixture.nativeElement.querySelectorAll('[data-array-row]')] as HTMLElement[];
    expect(rows.length).toBe(2);

    const inputs = rows.map((row) => row.querySelector('input') as HTMLInputElement);
    const ids = inputs.map((input) => input.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id) => !!id)).toBe(true);

    rows.forEach((row, i) => {
      const label = row.querySelector('label') as HTMLLabelElement;
      expect(label.getAttribute('for')).toBe(inputs[i].id);
    });
  });

  it('folds a zod error onto the control inside the failing row', () => {
    const fixture = render();
    (fixture.nativeElement.querySelector('[data-array-add]') as HTMLButtonElement).click();
    fixture.detectChanges();

    fixture.componentInstance.onSubmit(); // the row's email is empty
    fixture.detectChanges();

    const rowEmail = fixture.componentInstance.form().get(['contacts', 0, 'email']);
    expect(rowEmail?.errors?.['zod']).toBe('Email is required');
  });

  it('renders a nested object as its own group of fields', () => {
    const nested = z.object({
      address: z.object({ city: z.string().meta(m('City')) }).meta(m('Address')),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideDefaultFormControls()] });
    const fixture = TestBed.createComponent(SchemaForm);
    fixture.componentRef.setInput('schema', nested);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#address-city')).toBeTruthy();
    expect(fixture.componentInstance.form().get(['address', 'city'])).toBeTruthy();
  });

  it('gives two sibling nested groups with a same-named field distinct DOM ids', () => {
    const siblings = z.object({
      home: z.object({ city: z.string().meta(m('City')) }).meta(m('Home')),
      work: z.object({ city: z.string().meta(m('City')) }).meta(m('Work')),
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideDefaultFormControls()] });
    const fixture = TestBed.createComponent(SchemaForm);
    fixture.componentRef.setInput('schema', siblings);
    fixture.detectChanges();

    const homeInput = fixture.nativeElement.querySelector('#home-city') as HTMLInputElement;
    const workInput = fixture.nativeElement.querySelector('#work-city') as HTMLInputElement;
    expect(homeInput).toBeTruthy();
    expect(workInput).toBeTruthy();
    expect(homeInput).not.toBe(workInput);

    const labels = [...fixture.nativeElement.querySelectorAll('label')] as HTMLLabelElement[];
    const homeLabel = labels.find((l) => l.getAttribute('for') === 'home-city');
    const workLabel = labels.find((l) => l.getAttribute('for') === 'work-city');
    expect(homeLabel?.getAttribute('for')).toBe(homeInput.id);
    expect(workLabel?.getAttribute('for')).toBe(workInput.id);
  });
});
