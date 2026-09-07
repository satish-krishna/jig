import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmComboboxImports } from '@spartan-ng/helm/combobox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Combobox usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/combobox: content lives behind `*hlmComboboxPortal` (a
 * BrnPopover overlay, same mechanism as select/dialog) and is not in the DOM
 * until the input or trigger opens it. hlm-combobox-input's inner `<input>`
 * hosts `hlmInputGroupInput` -> HlmInput -> BrnFieldControlDescribedBy, so it
 * carries the same aria-describedby wiring input.page relies on.
 */
@Component({
  selector: 'app-combobox-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmComboboxImports, HlmFieldImports],
  template: `
    <app-component-page slug="combobox">
      <app-usage title="Default" note="Typing filters the list; the input itself opens the popover." [code]="codeDefault">
        <hlm-combobox>
          <hlm-combobox-input placeholder="Select a framework" />
          <hlm-combobox-content *hlmComboboxPortal>
            <hlm-combobox-empty>No items found.</hlm-combobox-empty>
            <div hlmComboboxList>
              @for (framework of frameworks; track framework) {
                <hlm-combobox-item [value]="framework">{{ framework }}</hlm-combobox-item>
              }
            </div>
          </hlm-combobox-content>
        </hlm-combobox>
      </app-usage>

      <app-usage
        title="Multiple selection"
        note="hlm-combobox-multiple renders picked values as removable chips."
        [code]="codeMultiple"
      >
        <hlm-combobox-multiple [(value)]="selectedFrameworks">
          <hlm-combobox-chips class="max-w-xs">
            <ng-template hlmComboboxValues let-values>
              @for (value of values; track value) {
                <hlm-combobox-chip [value]="value">{{ value }}</hlm-combobox-chip>
              }
            </ng-template>
            <input hlmComboboxChipInput placeholder="Add frameworks" />
          </hlm-combobox-chips>
          <hlm-combobox-content *hlmComboboxPortal>
            <hlm-combobox-empty>No items found.</hlm-combobox-empty>
            <div hlmComboboxList>
              @for (framework of frameworks; track framework) {
                <hlm-combobox-item [value]="framework">{{ framework }}</hlm-combobox-item>
              }
            </div>
          </hlm-combobox-content>
        </hlm-combobox-multiple>
      </app-usage>

      <app-usage title="Disabled" note="disabled on hlm-combobox stops the input from opening the popover." [code]="codeDisabled">
        <hlm-combobox disabled>
          <hlm-combobox-input placeholder="Select a framework" />
          <hlm-combobox-content *hlmComboboxPortal>
            <div hlmComboboxList>
              <hlm-combobox-item value="Angular">Angular</hlm-combobox-item>
            </div>
          </hlm-combobox-content>
        </hlm-combobox>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a framework and the error clears."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="combobox-framework">Framework</label>
          <hlm-combobox [formControl]="framework">
            <hlm-combobox-input inputId="combobox-framework" placeholder="e.g. Angular" />
            <hlm-combobox-content *hlmComboboxPortal>
              <hlm-combobox-empty>No items found.</hlm-combobox-empty>
              <div hlmComboboxList>
                @for (f of frameworks; track f) {
                  <hlm-combobox-item [value]="f">{{ f }}</hlm-combobox-item>
                }
              </div>
            </hlm-combobox-content>
          </hlm-combobox>
          <hlm-field-error>Please select a framework.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class ComboboxPage {
  protected readonly frameworks = ['Analog', 'Angular', 'Next.js', 'Nuxt', 'React'];

  protected readonly selectedFrameworks = signal<string[]>(['Angular']);

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly framework = new FormControl<string | null>(null, { validators: [Validators.required] });

  constructor() {
    this.framework.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-combobox>
  <hlm-combobox-input placeholder="Select a framework" />
  <hlm-combobox-content *hlmComboboxPortal>
    <hlm-combobox-empty>No items found.</hlm-combobox-empty>
    <div hlmComboboxList>
      @for (framework of frameworks; track framework) {
        <hlm-combobox-item [value]="framework">{{ framework }}</hlm-combobox-item>
      }
    </div>
  </hlm-combobox-content>
</hlm-combobox>`;

  protected readonly codeMultiple = `selectedFrameworks = signal<string[]>(['Angular']);

<hlm-combobox-multiple [(value)]="selectedFrameworks">
  <hlm-combobox-chips>
    <ng-template hlmComboboxValues let-values>
      @for (value of values; track value) {
        <hlm-combobox-chip [value]="value">{{ value }}</hlm-combobox-chip>
      }
    </ng-template>
    <input hlmComboboxChipInput placeholder="Add frameworks" />
  </hlm-combobox-chips>
  <hlm-combobox-content *hlmComboboxPortal>…</hlm-combobox-content>
</hlm-combobox-multiple>`;

  protected readonly codeDisabled = `<hlm-combobox disabled>
  <hlm-combobox-input placeholder="Select a framework" />
  <hlm-combobox-content *hlmComboboxPortal>…</hlm-combobox-content>
</hlm-combobox>`;

  protected readonly codeValidated = `framework = new FormControl<string | null>(null, { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="framework">Framework</label>
  <hlm-combobox [formControl]="framework">
    <hlm-combobox-input inputId="framework" placeholder="e.g. Angular" />
    <hlm-combobox-content *hlmComboboxPortal>…</hlm-combobox-content>
  </hlm-combobox>
  <hlm-field-error>Please select a framework.</hlm-field-error>
</hlm-field>`;
}
