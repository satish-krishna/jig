import { Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { SchemaFormControl } from '../schema-form-control';
import { optionsOf } from './options';

/**
 * Enum picker as radio buttons. Override-only: nothing about z.enum says
 * "show these as radios rather than a select".
 *
 * Anatomy, confirmed against frontend/libs/ui/radio-group: hlm-radio projects
 * `<ng-content select="[target],[indicator],hlm-radio-indicator" indicator />`,
 * so a bare <hlm-radio> renders nothing to click. The label is a sibling tied
 * by inputId, never content inside hlm-radio. hlm-radio-group host-composes
 * BrnRadioGroup, which provides NG_VALUE_ACCESSOR, so [formControl] binds.
 *
 * @capability forms.control.radio
 * @intent Same values as select, different affordance, chosen by meta.control.
 * @reuse Set control: 'radio' on an enum field's meta.
 */
@Component({
  selector: 'app-radio-control',
  imports: [ReactiveFormsModule, HlmRadioGroupImports, HlmLabelImports],
  template: `
    <hlm-radio-group [formControl]="formControl">
      @for (opt of options(); track opt.value) {
        <div class="flex items-center gap-m">
          <hlm-radio [value]="opt.value" [inputId]="field().key + '-' + opt.value" [disabled]="opt.disabled">
            <hlm-radio-indicator indicator />
          </hlm-radio>
          <label hlmLabel [for]="field().key + '-' + opt.value">{{ opt.label }}</label>
        </div>
      }
    </hlm-radio-group>
  `,
})
export class RadioControl extends SchemaFormControl {
  protected readonly options = computed(() => optionsOf(this.field()));
}
