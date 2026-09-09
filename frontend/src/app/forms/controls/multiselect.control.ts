import { Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { SchemaFormControl } from '../schema-form-control';
import { optionsOf } from './options';

/**
 * Multi-select over an enum array. hlm-combobox-multiple renders picked values
 * as removable chips; its anatomy needs every part below — the chips wrapper,
 * the hlmComboboxValues template, the chip input, and the portalled content
 * with an empty state and a list. Omitting one produces a control that opens
 * nothing. hlm-combobox host-composes BrnCombobox, which provides
 * NG_VALUE_ACCESSOR, so [formControl] binds.
 *
 * @capability forms.control.multiselect
 * @intent z.array(z.enum()) infers a chip multi-select, not a repeater of selects.
 * @reuse Registered before the generic array repeater — order is semantic.
 */
@Component({
  selector: 'app-multiselect-control',
  imports: [ReactiveFormsModule, HlmComboboxImports],
  template: `
    <hlm-combobox-multiple [formControl]="formControl">
      <hlm-combobox-chips>
        <ng-template hlmComboboxValues let-values>
          @for (value of values; track value) {
            <hlm-combobox-chip [value]="value">{{ labelFor(value) }}</hlm-combobox-chip>
          }
        </ng-template>
        <input hlmComboboxChipInput [attr.placeholder]="field().meta.placeholder ?? null" />
      </hlm-combobox-chips>
      <hlm-combobox-content *hlmComboboxPortal>
        <hlm-combobox-empty>No items found.</hlm-combobox-empty>
        <div hlmComboboxList>
          @for (opt of options(); track opt.value) {
            @if (!opt.disabled) {
              <hlm-combobox-item [value]="opt.value">{{ opt.label }}</hlm-combobox-item>
            }
          }
        </div>
      </hlm-combobox-content>
    </hlm-combobox-multiple>
  `,
})
export class MultiselectControl extends SchemaFormControl {
  protected readonly options = computed(() => optionsOf(this.field()));

  protected labelFor(value: string): string {
    return this.options().find((o) => o.value === value)?.label ?? value;
  }
}
