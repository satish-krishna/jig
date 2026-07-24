import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Native select usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/native-select: hlm-native-select renders its own <select>
 * with an id from `selectId()`, so a sibling label pairs via `for`, and
 * `hlmNativeSelectOption`/`hlmNativeSelectOptGroup` decorate plain
 * <option>/<optgroup> elements projected as content.
 */
@Component({
  selector: 'app-native-select-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmNativeSelectImports, HlmFieldImports],
  template: `
    <app-component-page slug="native-select">
      <app-usage title="Default" note="Plain options, styled via hlmNativeSelectOption." [code]="codeDefault">
        <hlm-native-select>
          <option hlmNativeSelectOption value="">Select status</option>
          <option hlmNativeSelectOption value="todo">Todo</option>
          <option hlmNativeSelectOption value="in-progress">In Progress</option>
          <option hlmNativeSelectOption value="done">Done</option>
        </hlm-native-select>
      </app-usage>

      <app-usage title="Grouped" note="optgroup[hlmNativeSelectOptGroup] groups related options." [code]="codeGrouped">
        <hlm-native-select>
          <option hlmNativeSelectOption value="">Select department</option>
          <optgroup hlmNativeSelectOptGroup label="Engineering">
            <option hlmNativeSelectOption value="frontend">Frontend</option>
            <option hlmNativeSelectOption value="backend">Backend</option>
          </optgroup>
          <optgroup hlmNativeSelectOptGroup label="Sales">
            <option hlmNativeSelectOption value="sales-rep">Sales Rep</option>
          </optgroup>
        </hlm-native-select>
      </app-usage>

      <app-usage title="Disabled" note="disabled on the wrapper disables the native select." [code]="codeDisabled">
        <hlm-native-select disabled>
          <option hlmNativeSelectOption value="">Disabled</option>
          <option hlmNativeSelectOption value="apple">Apple</option>
        </hlm-native-select>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a fruit and the error clears. Note: HlmNativeSelect does not host BrnFieldControlDescribedBy, so unlike input/textarea/select this control's aria-describedby is not auto-wired to the error — a library gap, not a hand-set attribute here."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="native-select-fruit">Favorite fruit</label>
          <hlm-native-select selectId="native-select-fruit" [formControl]="fruit">
            <option hlmNativeSelectOption value="">Select a fruit</option>
            <option hlmNativeSelectOption value="apple">Apple</option>
            <option hlmNativeSelectOption value="banana">Banana</option>
          </hlm-native-select>
          <hlm-field-error>Please select a fruit.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class NativeSelectPage {
  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly fruit = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor() {
    this.fruit.markAsTouched();
  }

  protected readonly codeDefault = `<hlm-native-select>
  <option hlmNativeSelectOption value="">Select status</option>
  <option hlmNativeSelectOption value="todo">Todo</option>
  <option hlmNativeSelectOption value="in-progress">In Progress</option>
  <option hlmNativeSelectOption value="done">Done</option>
</hlm-native-select>`;

  protected readonly codeGrouped = `<hlm-native-select>
  <option hlmNativeSelectOption value="">Select department</option>
  <optgroup hlmNativeSelectOptGroup label="Engineering">
    <option hlmNativeSelectOption value="frontend">Frontend</option>
    <option hlmNativeSelectOption value="backend">Backend</option>
  </optgroup>
</hlm-native-select>`;

  protected readonly codeDisabled = `<hlm-native-select disabled>
  <option hlmNativeSelectOption value="">Disabled</option>
  <option hlmNativeSelectOption value="apple">Apple</option>
</hlm-native-select>`;

  protected readonly codeValidated = `fruit = new FormControl('', { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="fruit">Favorite fruit</label>
  <hlm-native-select selectId="fruit" [formControl]="fruit">
    <option hlmNativeSelectOption value="">Select a fruit</option>
    <option hlmNativeSelectOption value="apple">Apple</option>
  </hlm-native-select>
  <hlm-field-error>Please select a fruit.</hlm-field-error>
</hlm-field>`;
}
