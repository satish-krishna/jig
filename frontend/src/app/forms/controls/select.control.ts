import { Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { SchemaFormControl } from '../schema-form-control';
import { optionsOf } from './options';

/**
 * Enum picker. Values come from z.enum, never from meta, so a value the schema
 * rejects can never be offered.
 *
 * @capability forms.control.select
 * @intent z.enum() infers a select with no meta beyond the label.
 * @reuse Override with control: 'radio' for the same values as radio buttons.
 */
@Component({
  selector: 'app-select-control',
  imports: [ReactiveFormsModule, HlmNativeSelectImports],
  template: `
    <hlm-native-select [selectId]="field().key" [formControl]="formControl">
      @for (opt of options(); track opt.value) {
        <option hlmNativeSelectOption [value]="opt.value" [disabled]="opt.disabled">{{ opt.label }}</option>
      }
    </hlm-native-select>
  `,
})
export class SelectControl extends SchemaFormControl {
  protected readonly options = computed(() => optionsOf(this.field()));
}
