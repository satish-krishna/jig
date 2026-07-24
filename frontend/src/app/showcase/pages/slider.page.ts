import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/** A minimum-volume rule so the validated usage demonstrates a real business
 *  constraint rather than an empty-array edge case (an empty slider value
 *  renders no thumb at all). */
function minVolume(min: number) {
  return (control: AbstractControl<number[]>): ValidationErrors | null =>
    (control.value?.[0] ?? 0) >= min ? null : { minVolume: { min } };
}

/**
 * Slider usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/slider: hlm-slider renders its track, range and thumbs
 * entirely from its own template based on `value()` — no projected content —
 * and binds directly as a ControlValueAccessor.
 */
@Component({
  selector: 'app-slider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmSliderImports, HlmLabelImports, HlmFieldImports],
  template: `
    <app-component-page slug="slider">
      <app-usage title="Default" note="A single thumb, bound with [(value)]." [code]="codeDefault">
        <hlm-slider class="max-w-sm" [(value)]="volume" />
      </app-usage>

      <app-usage title="Range" note="Two values render two thumbs and a filled range between them." [code]="codeRange">
        <hlm-slider class="max-w-sm" [(value)]="range" />
      </app-usage>

      <app-usage title="Ticks and disabled" note="showTicks renders labeled tick marks; disabled stops all interaction." [code]="codeStates">
        <div class="flex max-w-sm flex-col gap-6">
          <hlm-slider [(value)]="volume" [showTicks]="true" />
          <hlm-slider [value]="[40]" [disabled]="true" />
        </div>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — raise it to 50 or above and the error clears. Note: BrnSlider never wires BrnFieldControlDescribedBy, so unlike input this one's aria-describedby is not auto-linked to the error — a library gap, not a hand-set attribute here."
        [code]="codeValidated"
      >
        <div hlmField class="max-w-sm">
          <label hlmFieldLabel for="slider-volume">Speaker volume (min 50)</label>
          <hlm-slider id="slider-volume" [formControl]="minVolumeControl" />
          <hlm-field-error>Volume must be at least 50.</hlm-field-error>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SliderPage {
  protected readonly volume = signal([75]);
  protected readonly range = signal([25, 50]);

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly minVolumeControl = new FormControl<number[]>([10], {
    nonNullable: true,
    validators: [minVolume(50)],
  });

  constructor() {
    this.minVolumeControl.markAsTouched();
  }

  protected readonly codeDefault = `volume = signal([75]);

<hlm-slider [(value)]="volume" />`;

  protected readonly codeRange = `range = signal([25, 50]);

<hlm-slider [(value)]="range" />`;

  protected readonly codeStates = `<hlm-slider [(value)]="volume" [showTicks]="true" />
<hlm-slider [value]="[40]" [disabled]="true" />`;

  protected readonly codeValidated = `minVolumeControl = new FormControl([10], { validators: [minVolume(50)] });

<div hlmField>
  <label hlmFieldLabel for="volume">Speaker volume (min 50)</label>
  <hlm-slider id="volume" [formControl]="minVolumeControl" />
  <hlm-field-error>Volume must be at least 50.</hlm-field-error>
</div>`;
}
