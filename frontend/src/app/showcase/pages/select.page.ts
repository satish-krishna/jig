import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Select usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/select: content lives behind the `*hlmSelectPortal`
 * structural directive (a BrnPopover under the hood, same overlay mechanism
 * as popover/dialog) and is not in the DOM until the trigger opens it — the
 * CDK overlay appends it to `document.body`, not under the trigger.
 */
@Component({
  selector: 'app-select-page',
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmSelectImports, HlmFieldImports],
  template: `
    <app-component-page slug="select">
      <app-usage title="Default" note="itemToString renders the label for the selected value." [code]="codeDefault">
        <hlm-select [itemToString]="itemToString">
          <hlm-select-trigger class="w-56">
            <hlm-select-value placeholder="Select a fruit" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-label>Fruits</hlm-select-label>
              @for (item of items; track item.value) {
                <hlm-select-item [value]="item.value">{{ item.label }}</hlm-select-item>
              }
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>
      </app-usage>

      <app-usage title="Grouped" note="hlm-select-separator divides two hlm-select-group blocks." [code]="codeGrouped">
        <hlm-select>
          <hlm-select-trigger class="w-56">
            <hlm-select-value placeholder="Select a fruit" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-label>Fruits</hlm-select-label>
              <hlm-select-item value="apple">Apple</hlm-select-item>
              <hlm-select-item value="banana">Banana</hlm-select-item>
            </hlm-select-group>
            <hlm-select-separator />
            <hlm-select-group>
              <hlm-select-label>Vegetables</hlm-select-label>
              <hlm-select-item value="carrot">Carrot</hlm-select-item>
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>
      </app-usage>

      <app-usage title="Disabled" note="disabled on hlm-select stops the trigger from opening." [code]="codeDisabled">
        <hlm-select disabled>
          <hlm-select-trigger class="w-56">
            <hlm-select-value placeholder="Select a fruit" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="apple">Apple</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a fruit and the error clears."
        [code]="codeValidated"
      >
        <hlm-field class="w-56">
          <label hlmFieldLabel for="select-fruit">Fruit</label>
          <hlm-select [formControl]="fruit" [itemToString]="itemToString">
            <hlm-select-trigger buttonId="select-fruit" class="w-full">
              <hlm-select-value placeholder="Select a fruit" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                @for (item of items; track item.value) {
                  <hlm-select-item [value]="item.value">{{ item.label }}</hlm-select-item>
                }
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
          <hlm-field-error>Please select a fruit.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class SelectPage {
  protected readonly items = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Blueberry', value: 'blueberry' },
  ];

  protected readonly itemToString = (value: string) => this.items.find((item) => item.value === value)?.label ?? '';

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly fruit = new FormControl<string | null>(null, { validators: [Validators.required] });

  constructor() {
    this.fruit.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-select [itemToString]="itemToString">
  <hlm-select-trigger class="w-56">
    <hlm-select-value placeholder="Select a fruit" />
  </hlm-select-trigger>
  <hlm-select-content *hlmSelectPortal>
    <hlm-select-group>
      <hlm-select-label>Fruits</hlm-select-label>
      @for (item of items; track item.value) {
        <hlm-select-item [value]="item.value">{{ item.label }}</hlm-select-item>
      }
    </hlm-select-group>
  </hlm-select-content>
</hlm-select>`;

  protected readonly codeGrouped = `<hlm-select-content *hlmSelectPortal>
  <hlm-select-group>
    <hlm-select-label>Fruits</hlm-select-label>
    <hlm-select-item value="apple">Apple</hlm-select-item>
  </hlm-select-group>
  <hlm-select-separator />
  <hlm-select-group>
    <hlm-select-label>Vegetables</hlm-select-label>
    <hlm-select-item value="carrot">Carrot</hlm-select-item>
  </hlm-select-group>
</hlm-select-content>`;

  protected readonly codeDisabled = `<hlm-select disabled>
  <hlm-select-trigger class="w-56">
    <hlm-select-value placeholder="Select a fruit" />
  </hlm-select-trigger>
  <hlm-select-content *hlmSelectPortal>…</hlm-select-content>
</hlm-select>`;

  protected readonly codeValidated = `fruit = new FormControl<string | null>(null, { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="fruit">Fruit</label>
  <hlm-select [formControl]="fruit" [itemToString]="itemToString">
    <hlm-select-trigger buttonId="fruit" class="w-full">
      <hlm-select-value placeholder="Select a fruit" />
    </hlm-select-trigger>
    <hlm-select-content *hlmSelectPortal>…</hlm-select-content>
  </hlm-select>
  <hlm-field-error>Please select a fruit.</hlm-field-error>
</hlm-field>`;
}
