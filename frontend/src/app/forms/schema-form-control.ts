import { Directive, input } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import type { FieldSpec } from './field-spec';

/**
 * The contract every registered control implements. Angular inherits inputs
 * from a base class, so a control that forgets one is a compile error — the
 * same guarantee `satisfies FormFieldMeta` gives a field's meta.
 *
 * A @Directive with no selector is Angular's supported base-class form; a bare
 * class does not get its inputs collected.
 *
 * @capability forms.control-base
 * @intent Every control receives the same two inputs, checked at compile time.
 * @reuse `export class MyControl extends SchemaFormControl {}`, then register it.
 */
@Directive()
export abstract class SchemaFormControl {
  readonly field = input.required<FieldSpec>();
  readonly control = input.required<AbstractControl>();

  /** Narrowed accessor so templates can bind [formControl] without a cast. */
  protected get formControl() {
    return this.control() as import('@angular/forms').FormControl;
  }
}
