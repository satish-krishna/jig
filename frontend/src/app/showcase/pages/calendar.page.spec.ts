import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalendarPage } from './calendar.page';

/**
 * Calendar (unlike date-picker) is not a ControlValueAccessor and hosts no
 * BrnFieldControl, so the validated usage proves validation via real
 * signal-derived state (a conditionally-rendered message after a confirm
 * attempt) rather than hlm-field-error, which would silently never display
 * for this control.
 */
describe('CalendarPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CalendarPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CalendarPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function enabledDaysIn(root: ParentNode): HTMLButtonElement[] {
    // Exclude both disabled days and "outside" (adjacent month) days — outside
    // days render but do not participate in this calendar's own month grid.
    return [...root.querySelectorAll('button[brncalendarcellbutton]')].filter(
      (b) => !(b as HTMLButtonElement).disabled && b.getAttribute('data-outside') !== 'true',
    ) as HTMLButtonElement[];
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real calendar grid with day buttons in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(enabledDaysIn(stage).length, 'a usage stage rendered no enabled day buttons').toBeGreaterThan(0);
    }
  });

  it('selects a real day on click in the default usage', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[0] as HTMLElement;
    const day = enabledDaysIn(stage)[0];
    day.click();
    fixture.detectChanges();

    expect(day.getAttribute('aria-selected')).toBe('true');
  });

  it('accumulates several selected days in the multi-select usage', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[1] as HTMLElement;
    const days = enabledDaysIn(stage);

    days[0].click();
    fixture.detectChanges();
    days[1].click();
    fixture.detectChanges();

    const selected = [...stage.querySelectorAll('button[brncalendarcellbutton][aria-selected="true"]')];
    expect(selected.length).toBe(2);
  });

  it('tracks a start and end day independently in the range usage', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[2] as HTMLElement;
    const days = enabledDaysIn(stage);

    days[0].click();
    fixture.detectChanges();
    days[days.length - 1].click();
    fixture.detectChanges();

    expect(stage.querySelector('button[brncalendarcellbutton][data-range-start="true"]')).toBeTruthy();
    expect(stage.querySelector('button[brncalendarcellbutton][data-range-end="true"]')).toBeTruthy();
  });

  it('drives the validated usage from real signal state, not a hand-set attribute', () => {
    const stage = host.querySelectorAll('[data-slot="usage-stage"]')[3] as HTMLElement;
    expect(stage.textContent).not.toContain('Please select a date.');

    const confirmButton = [...stage.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Confirm') as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();

    expect(stage.textContent).toContain('Please select a date.');

    const day = enabledDaysIn(stage)[0];
    day.click();
    fixture.detectChanges();

    expect(stage.textContent).not.toContain('Please select a date.');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCalendar');
    expect(text).toContain('captionLayout'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/calendar');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
