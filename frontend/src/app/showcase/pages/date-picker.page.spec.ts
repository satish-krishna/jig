import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatePickerPage } from './date-picker.page';

/**
 * The calendar popover lives behind hlm-popover's own portal (a BrnPopover
 * overlay, same mechanism as popover/dialog) and is not in the DOM until the
 * trigger opens it — the CDK overlay attaches it to `document.body`.
 */
describe('DatePickerPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DatePickerPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DatePickerPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  async function open(trigger: HTMLElement): Promise<void> {
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function firstEnabledDay(): HTMLButtonElement {
    const day = [...document.body.querySelectorAll('button[brncalendarcellbutton]')].find(
      (b) => !b.hasAttribute('data-outside') && !(b as HTMLButtonElement).disabled,
    ) as HTMLButtonElement;
    expect(day, 'no enabled calendar day found').toBeTruthy();
    return day;
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real trigger control', () => {
    // data-slot="date-picker-trigger" lives on the <hlm-date-picker-trigger>
    // host element itself, not the inner <button>.
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(
        stage.querySelector('[data-slot="date-picker-trigger"], input'),
        'a usage stage rendered no trigger control',
      ).toBeTruthy();
    }
  });

  it('renders no calendar until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-calendar')).toBeNull();
  });

  it('opens the default usage, picks a real day, and closes on selection', async () => {
    const trigger = host.querySelector('#date-default') as HTMLButtonElement;
    await open(trigger);

    expect(document.body.querySelector('hlm-calendar'), 'calendar did not render after clicking the trigger').toBeTruthy();

    const day = firstEnabledDay();
    day.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.querySelector('hlm-calendar'), 'calendar did not close after picking a day').toBeNull();
    expect(trigger.textContent?.trim()).not.toBe('Pick a date');
  });

  it('accepts a picked date into the text-input usage', async () => {
    const input = host.querySelector('#date-input') as HTMLInputElement;
    // hlm-date-picker-input defaults openOnClick to false — the calendar
    // trigger icon button is what actually opens the popover.
    const stage = input.closest('[data-slot="usage-stage"]') as HTMLElement;
    const calendarButton = stage.querySelector('button[aria-label="Open calendar"]') as HTMLButtonElement;
    await open(calendarButton);

    const day = firstEnabledDay();
    day.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value.length).toBeGreaterThan(0);
  });

  it('renders month and year selects for the dropdown-navigation usage', async () => {
    const trigger = host.querySelector('#date-dropdown') as HTMLButtonElement;
    await open(trigger);

    const selects = document.body.querySelectorAll('[brncalendarmonthselect], [brncalendaryearselect]');
    expect(selects.length).toBe(2);

    // close it back down for isolation from the next test
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('drives the validated usage from real control state, not hand-set attributes', async () => {
    const trigger = host.querySelector('#date-validated') as HTMLButtonElement;
    expect(trigger.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const field = trigger.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy, 'invalid date picker trigger has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Please select a date');

    await open(trigger);
    const day = firstEnabledDay();
    day.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.getAttribute('data-matches-spartan-invalid')).toBeNull();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmDatePicker');
    expect(text).toContain('captionLayout'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/date-picker');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
