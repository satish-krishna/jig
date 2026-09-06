import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Calendar usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/calendar: hlm-calendar/-multi/-range render their own grid
 * entirely from `date()`/`startDate()`/`endDate()` inputs — no projected
 * content. No global DateAdapter is provided app-wide, so this page provides
 * one itself, required for `injectDateAdapter()` to resolve.
 *
 * Calendar (unlike date-picker) is not a ControlValueAccessor and hosts no
 * BrnFieldControl, so it cannot register with an ancestor hlm-field —
 * hlm-field-error would silently never display here. The validated usage
 * proves validation via real signal-derived state instead (a disabled submit
 * button and a conditionally-rendered message), the same shape input-otp.page
 * uses for the same structural reason.
 */
@Component({
  selector: 'app-calendar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [ComponentPage, Usage, HlmCalendarImports, HlmButtonImports],
  template: `
    <app-component-page slug="calendar">
      <app-usage title="Default" note="A single selected date, bound with [(date)]." [code]="codeDefault">
        <hlm-calendar [(date)]="selectedDate" [min]="minDate" [max]="maxDate" />
      </app-usage>

      <app-usage title="Multiple selection" note="hlm-calendar-multi accumulates several dates." [code]="codeMulti">
        <hlm-calendar-multi [(date)]="multiDates" [maxSelection]="3" />
      </app-usage>

      <app-usage title="Range" note="hlm-calendar-range tracks a start and an end date independently." [code]="codeRange">
        <hlm-calendar-range [(startDate)]="rangeStart" [(endDate)]="rangeEnd" />
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by real signal state — Confirm without picking a date and the error appears."
        [code]="codeValidated"
      >
        <div class="flex flex-col items-start gap-m">
          <hlm-calendar [(date)]="requiredDate" [max]="maxDate" />
          @if (touched() && !requiredDate()) {
            <p class="text-destructive text-sm">Please select a date.</p>
          }
          <button hlmBtn type="button" (click)="confirm()">Confirm</button>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class CalendarPage {
  protected readonly minDate = new Date(new Date().setMonth(new Date().getMonth() - 2));
  protected readonly maxDate = new Date(new Date().setMonth(new Date().getMonth() + 2));

  protected readonly selectedDate = signal(new Date());
  protected readonly multiDates = signal<Date[]>([]);
  protected readonly rangeStart = signal<Date | undefined>(undefined);
  protected readonly rangeEnd = signal<Date | undefined>(undefined);

  protected readonly requiredDate = signal<Date | undefined>(undefined);
  protected readonly touched = signal(false);

  protected readonly hasRequiredDate = computed(() => !!this.requiredDate());

  protected confirm(): void {
    this.touched.set(true);
  }

  protected readonly codeDefault = `selectedDate = signal(new Date());

<hlm-calendar [(date)]="selectedDate" [min]="minDate" [max]="maxDate" />`;

  protected readonly codeMulti = `multiDates = signal<Date[]>([]);

<hlm-calendar-multi [(date)]="multiDates" [maxSelection]="3" />`;

  protected readonly codeRange = `rangeStart = signal<Date | undefined>(undefined);
rangeEnd = signal<Date | undefined>(undefined);

<hlm-calendar-range [(startDate)]="rangeStart" [(endDate)]="rangeEnd" />`;

  protected readonly codeValidated = `requiredDate = signal<Date | undefined>(undefined);
touched = signal(false);
confirm() { this.touched.set(true); }

<hlm-calendar [(date)]="requiredDate" [max]="maxDate" />
@if (touched() && !requiredDate()) {
  <p class="text-destructive text-sm">Please select a date.</p>
}
<button hlmBtn (click)="confirm()">Confirm</button>`;
}
