import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmNativeSelectImports } from '@spartan-ng/helm/native-select';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmToggleImports } from '@spartan-ng/helm/toggle';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { ShowcaseExample } from '../showcase-example';

/**
 * Controls that collect input. The field anatomy (label, control, description,
 * error) is the one worth copying — see docs/architecture/forms.md.
 */
@Component({
  selector: 'app-showcase-forms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShowcaseExample,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmInputImports,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmNativeSelectImports,
    HlmRadioGroupImports,
    HlmSliderImports,
    HlmSwitchImports,
    HlmTextareaImports,
    HlmToggleImports,
    HlmToggleGroupImports,
  ],
  template: `
    <app-showcase-example name="field + input + label">
      <div hlmField class="w-64">
        <label hlmFieldLabel for="showcase-email">Email</label>
        <input hlmInput id="showcase-email" type="email" placeholder="ada@example.io" />
        <p hlmFieldDescription>We never share it.</p>
      </div>
    </app-showcase-example>

    <app-showcase-example name="field (invalid)">
      <div hlmField class="w-64" data-invalid="true">
        <label hlmFieldLabel for="showcase-invalid">Email</label>
        <input hlmInput id="showcase-invalid" aria-invalid="true" value="not-an-email" />
        <hlm-field-error forceShow>Enter a valid email address.</hlm-field-error>
      </div>
    </app-showcase-example>

    <app-showcase-example name="fieldset + legend">
      <fieldset hlmFieldSet class="w-64">
        <legend hlmFieldLegend>Profile</legend>
        <p hlmFieldDescription>Shown on invoices.</p>
        <div hlmFieldGroup>
          <div hlmField>
            <label hlmFieldLabel for="showcase-name">Full name</label>
            <input hlmInput id="showcase-name" />
          </div>
        </div>
      </fieldset>
    </app-showcase-example>

    <app-showcase-example name="textarea">
      <textarea hlmTextarea class="w-64" placeholder="Tell us more"></textarea>
    </app-showcase-example>

    <app-showcase-example name="native-select">
      <hlm-native-select selectId="showcase-select" class="w-64">
        <option hlmNativeSelectOption value="light">Light</option>
        <option hlmNativeSelectOption value="dark">Dark</option>
      </hlm-native-select>
    </app-showcase-example>

    <app-showcase-example name="checkbox">
      <div hlmField orientation="horizontal">
        <hlm-checkbox inputId="showcase-terms" />
        <label hlmFieldLabel for="showcase-terms">Accept the terms</label>
      </div>
    </app-showcase-example>

    <app-showcase-example name="switch">
      <div hlmField orientation="horizontal">
        <hlm-switch inputId="showcase-switch" />
        <label hlmFieldLabel for="showcase-switch">Dark mode</label>
      </div>
    </app-showcase-example>

    <app-showcase-example name="radio-group">
      <!-- The visible control is PROJECTED: hlm-radio renders
           <ng-content select="...hlm-radio-indicator" indicator />, so omitting
           hlm-radio-indicator leaves you with bare text and no radio button.
           The label is a sibling, tied to the radio by inputId — not content
           inside hlm-radio.
           value/valueChange come from BrnRadioGroup; it is also a CVA, so
           [formControlName] or [formField] work just as well in a real form. -->
      <hlm-radio-group name="showcase-plan" [value]="plan()" (valueChange)="plan.set($event)">
        <div class="flex items-center gap-3">
          <hlm-radio value="free" inputId="showcase-plan-free">
            <hlm-radio-indicator indicator />
          </hlm-radio>
          <label hlmLabel for="showcase-plan-free">Free</label>
        </div>
        <div class="flex items-center gap-3">
          <hlm-radio value="pro" inputId="showcase-plan-pro">
            <hlm-radio-indicator indicator />
          </hlm-radio>
          <label hlmLabel for="showcase-plan-pro">Pro</label>
        </div>
      </hlm-radio-group>
    </app-showcase-example>

    <app-showcase-example name="slider">
      <!-- value is an array: the slider supports multiple thumbs (ranges) -->
      <hlm-slider class="w-64" [value]="[40]" />
    </app-showcase-example>

    <app-showcase-example name="toggle">
      <button hlmToggle>Bold</button>
    </app-showcase-example>

    <app-showcase-example name="toggle-group">
      <hlm-toggle-group>
        <button hlmToggleGroupItem value="left">Left</button>
        <button hlmToggleGroupItem value="center">Center</button>
        <button hlmToggleGroupItem value="right">Right</button>
      </hlm-toggle-group>
    </app-showcase-example>

    <app-showcase-example name="input-group">
      <div hlmInputGroup class="w-64">
        <span hlmInputGroupAddon>https://</span>
        <input hlmInputGroupInput placeholder="example.io" />
      </div>
    </app-showcase-example>
  `,
})
export class ShowcaseForms {
  protected readonly plan = signal('free');
}
