import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HlmAutocompleteImports } from '@spartan-ng/helm/autocomplete';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Autocomplete usages. Anatomy confirmed against the spartan MCP docs and
 * frontend/libs/ui/autocomplete: content lives behind `*hlmAutocompletePortal`
 * (a BrnPopover overlay) and is not in the DOM until the input opens it.
 * hlm-autocomplete-input's inner `<input>` hosts `hlmInputGroupInput` ->
 * HlmInput -> BrnFieldControlDescribedBy, so it carries the same
 * aria-describedby wiring input.page relies on.
 */
@Component({
  selector: 'app-autocomplete-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ComponentPage, Usage, HlmAutocompleteImports, HlmFieldImports],
  template: `
    <app-component-page slug="autocomplete">
      <app-usage title="Default" note="Typing filters the list client-side, via a plain search signal." [code]="codeDefault">
        <hlm-autocomplete [(search)]="search">
          <hlm-autocomplete-input placeholder="Search components" />
          <hlm-autocomplete-content *hlmAutocompletePortal>
            <hlm-autocomplete-empty>No components found.</hlm-autocomplete-empty>
            <div hlmAutocompleteList>
              @for (option of filtered(); track option) {
                <hlm-autocomplete-item [value]="option">{{ option }}</hlm-autocomplete-item>
              }
            </div>
          </hlm-autocomplete-content>
        </hlm-autocomplete>
      </app-usage>

      <app-usage title="Clearable" note="showClear renders a clear button once text is entered." [code]="codeClearable">
        <hlm-autocomplete [(search)]="clearableSearch">
          <hlm-autocomplete-input placeholder="Search components" showClear />
          <hlm-autocomplete-content *hlmAutocompletePortal>
            <hlm-autocomplete-empty>No components found.</hlm-autocomplete-empty>
            <div hlmAutocompleteList>
              @for (option of clearableFiltered(); track option) {
                <hlm-autocomplete-item [value]="option">{{ option }}</hlm-autocomplete-item>
              }
            </div>
          </hlm-autocomplete-content>
        </hlm-autocomplete>
      </app-usage>

      <app-usage title="Disabled" note="disabled on hlm-autocomplete stops the input from opening the popover." [code]="codeDisabled">
        <hlm-autocomplete disabled>
          <hlm-autocomplete-input placeholder="Search components" />
          <hlm-autocomplete-content *hlmAutocompletePortal>
            <div hlmAutocompleteList>
              <hlm-autocomplete-item value="Accordion">Accordion</hlm-autocomplete-item>
            </div>
          </hlm-autocomplete-content>
        </hlm-autocomplete>
      </app-usage>

      <app-usage
        title="Required, with validation"
        note="Driven by a real FormControl — pick a component and the error clears."
        [code]="codeValidated"
      >
        <hlm-field class="max-w-xs">
          <label hlmFieldLabel for="autocomplete-component">Component</label>
          <hlm-autocomplete [formControl]="component" [(search)]="validatedSearch">
            <hlm-autocomplete-input inputId="autocomplete-component" placeholder="Search components" />
            <hlm-autocomplete-content *hlmAutocompletePortal>
              <hlm-autocomplete-empty>No components found.</hlm-autocomplete-empty>
              <div hlmAutocompleteList>
                @for (option of validatedFiltered(); track option) {
                  <hlm-autocomplete-item [value]="option">{{ option }}</hlm-autocomplete-item>
                }
              </div>
            </hlm-autocomplete-content>
          </hlm-autocomplete>
          <hlm-field-error>Please select a component.</hlm-field-error>
        </hlm-field>
      </app-usage>
    </app-component-page>
  `,
})
export class AutocompletePage {
  private readonly options = ['Accordion', 'Autocomplete', 'Avatar', 'Checkbox', 'Combobox', 'Dialog', 'Input'];

  protected readonly search = signal('');
  protected readonly filtered = computed(() =>
    this.options.filter((o) => o.toLowerCase().includes(this.search().toLowerCase())),
  );

  protected readonly clearableSearch = signal('');
  protected readonly clearableFiltered = computed(() =>
    this.options.filter((o) => o.toLowerCase().includes(this.clearableSearch().toLowerCase())),
  );

  protected readonly validatedSearch = signal('');
  protected readonly validatedFiltered = computed(() =>
    this.options.filter((o) => o.toLowerCase().includes(this.validatedSearch().toLowerCase())),
  );

  /** Pre-touched so the example lands on the invalid state: the default spartan
   *  ErrorStateMatcher only reports a control once it is touched or submitted. */
  protected readonly component = new FormControl<string | null>(null, { validators: [Validators.required] });

  constructor() {
    this.component.markAsTouched();
  }

  protected readonly codeDefault = `search = signal('');
filtered = computed(() => options.filter(o => o.toLowerCase().includes(search().toLowerCase())));

<hlm-autocomplete [(search)]="search">
  <hlm-autocomplete-input placeholder="Search components" />
  <hlm-autocomplete-content *hlmAutocompletePortal>
    <hlm-autocomplete-empty>No components found.</hlm-autocomplete-empty>
    <div hlmAutocompleteList>
      @for (option of filtered(); track option) {
        <hlm-autocomplete-item [value]="option">{{ option }}</hlm-autocomplete-item>
      }
    </div>
  </hlm-autocomplete-content>
</hlm-autocomplete>`;

  protected readonly codeClearable = `<hlm-autocomplete-input placeholder="Search components" showClear />`;

  protected readonly codeDisabled = `<hlm-autocomplete disabled>
  <hlm-autocomplete-input placeholder="Search components" />
  <hlm-autocomplete-content *hlmAutocompletePortal>…</hlm-autocomplete-content>
</hlm-autocomplete>`;

  protected readonly codeValidated = `component = new FormControl<string | null>(null, { validators: [Validators.required] });

<hlm-field>
  <label hlmFieldLabel for="component">Component</label>
  <hlm-autocomplete [formControl]="component" [(search)]="search">
    <hlm-autocomplete-input inputId="component" placeholder="Search components" />
    <hlm-autocomplete-content *hlmAutocompletePortal>…</hlm-autocomplete-content>
  </hlm-autocomplete>
  <hlm-field-error>Please select a component.</hlm-field-error>
</hlm-field>`;
}
