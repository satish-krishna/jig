import { Component, computed, inject } from '@angular/core';
import type { FormArray } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { SchemaFormBuilder } from '../schema-form-builder';
import { SchemaFormControl } from '../schema-form-control';
import { FieldHost } from './field-host';

/**
 * A repeating list. children[0] is the item TEMPLATE, not an instance; each row
 * is minted by asking the builder to build a control from it.
 *
 * The array itself can carry an error — z.array(x).min(1) yields an issue whose
 * path is the array — and hlm-field-error is built for a leaf, so the error slot
 * above the rows is this component's own.
 *
 * @capability forms.control.array
 * @intent A repeater is a registered control that recurses through the same outlet.
 * @reuse Inferred from z.array(); .min(n) seeds n rows at build time.
 */
@Component({
  selector: 'app-array-control',
  imports: [FieldHost, HlmButtonImports],
  template: `
    <div class="grid gap-m">
      @if (array.errors?.['zod']; as arrayError) {
        <p class="text-destructive text-sm">{{ arrayError }}</p>
      }
      @for (row of array.controls; track row; let i = $index) {
        <!-- A flex row, NOT a grid. FieldHost always emits a col-span-* class
             from its host bindings (span defaults to 4), so any span class this
             parent added would collide with it. Inside a flex container that
             class is inert, which removes the collision rather than arbitrating
             it. A row with one non-column child is not the shape
             no-nested-flex-grid forbids. -->
        <div data-array-row class="flex items-start gap-m">
          <app-field-host class="grow" [field]="item()" [control]="row" [idPrefix]="field().key + '-' + i" />
          <button hlmBtn type="button" variant="ghost" data-array-remove (click)="remove(i)">Remove</button>
        </div>
      }
      <button hlmBtn type="button" variant="outline" data-array-add (click)="add()">
        Add {{ field().meta.label }}
      </button>
    </div>
  `,
})
export class ArrayControl extends SchemaFormControl {
  private readonly builder = inject(SchemaFormBuilder);

  protected readonly item = computed(() => this.field().children![0]);

  protected get array(): FormArray {
    return this.control() as FormArray;
  }

  protected add(): void {
    this.array.push(this.builder.buildControl(this.item()));
  }

  protected remove(index: number): void {
    this.array.removeAt(index);
  }
}
