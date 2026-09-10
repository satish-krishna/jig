import { Component, computed } from '@angular/core';
import type { FormGroup } from '@angular/forms';
import { SchemaFormControl } from '../schema-form-control';
import { FieldHost } from './field-host';

/**
 * A nested object: its own four-column grid of child fields. A container always
 * occupies a full row and opens a fresh grid — a two-wide group containing a
 * four-column grid is illegible, so the shape is forbidden rather than discouraged.
 *
 * This is where the registry earns its file count: recursion is just the same
 * outlet again. A template @switch could not do this without a self-referencing
 * ngTemplateOutlet.
 *
 * @capability forms.control.group
 * @intent Nesting is a registered control, not a special case in the renderer.
 * @reuse Inferred from z.object(); nothing to configure.
 */
@Component({
  selector: 'app-group-control',
  imports: [FieldHost],
  // Same stylesheet as SchemaForm: emulated encapsulation would otherwise leave
  // this nested grid with no container declaration and no collapse rule.
  styleUrl: '../schema-form.css',
  template: `
    <div data-schema-grid class="grid grid-cols-4 gap-m">
      @for (child of children(); track child.key) {
        <app-field-host [field]="child" [control]="group.get(child.key)!" [idPrefix]="idPrefix()" />
      }
    </div>
  `,
})
export class GroupControl extends SchemaFormControl {
  protected readonly children = computed(() => this.field().children ?? []);

  protected get group(): FormGroup {
    return this.control() as FormGroup;
  }
}
