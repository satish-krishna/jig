import { Component, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import type { AbstractControl } from '@angular/forms';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import type { FieldSpec } from '../field-spec';
import { SchemaFormBuilder } from '../schema-form-builder';

/**
 * One grid cell: its span, its own field-group container, its label, the
 * control resolved for it, and its error slot. SchemaForm, GroupControl and
 * ArrayControl all render fields through this, so the cell markup exists once.
 *
 * The cell re-declares @container/field-group deliberately. hlmFieldGroup
 * declares that container and hlm-field keys off it with @md/field-group:flex-row,
 * so without this a field in a 25% wide cell would measure the WHOLE form as
 * wide and render its label beside a 180px control.
 *
 * @capability forms.field-host
 * @intent The cell, its span and its error slot are stated once, not per container.
 * @reuse Render any FieldSpec with its AbstractControl through this component.
 */
@Component({
  selector: 'app-field-host',
  imports: [NgComponentOutlet, HlmFieldImports],
  host: {
    class: '@container/field-group',
    '[class.col-span-1]': 'field().meta.span === 1',
    '[class.col-span-2]': 'field().meta.span === 2',
    '[class.col-span-3]': 'field().meta.span === 3',
    '[class.col-span-4]': '(field().meta.span ?? 4) === 4',
  },
  template: `
    <hlm-field>
      @if (field().meta.label) {
        <label hlmFieldLabel [attr.for]="fieldId()">{{ field().meta.label }}</label>
      }
      <ng-container
        [ngComponentOutlet]="component()"
        [ngComponentOutletInputs]="{ field: field(), control: control(), idPrefix: idPrefix() }"
      />
      <hlm-field-error [attr.data-error-for]="fieldId()">
        {{ control().errors?.['zod'] }}
      </hlm-field-error>
    </hlm-field>
  `,
})
export class FieldHost {
  private readonly builder = inject(SchemaFormBuilder);

  readonly field = input.required<FieldSpec>();
  readonly control = input.required<AbstractControl>();

  // Empty by default, so a top-level field's id stays exactly what it is today.
  // A repeater row passes something unique to the row (see ArrayControl); a
  // nested group passes its own prefix straight through to its children.
  readonly idPrefix = input('');

  /** DOM id for this field. Prefixed inside a repeater so rows do not collide. */
  protected readonly fieldId = computed(() =>
    this.idPrefix() ? `${this.idPrefix()}-${this.field().key}` : this.field().key,
  );

  protected component() {
    return this.builder.componentFor(this.field().kind);
  }
}
