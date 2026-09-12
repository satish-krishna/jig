import { Injectable, inject, type Type } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';
import type { z } from 'zod';
import { FormControlRegistry } from './control-registry';
import type { FieldSpec } from './field-spec';
import { resolveMeta, unwrap } from './zod-meta';

interface ObjectDef { type: string; shape: Record<string, z.ZodType> }
interface ArrayDef { type: string; element: z.ZodType; checks?: readonly unknown[] }

/**
 * Turns a zod schema into the two trees SchemaForm renders: a FieldSpec tree
 * (what to draw) and an AbstractControl tree (what holds the values).
 *
 * fieldsFromSchema accepts ANY zod node and is callable at runtime, not only
 * the root object at bootstrap. That is a requirement, not an accident: the
 * first control to extend the supported boundary is a discriminated union,
 * which must build a child field tree when its discriminator flips.
 *
 * @capability forms.schema-form-builder
 * @intent One walk of the schema produces both the render tree and the control tree.
 * @reuse Inject it; call fieldsFromSchema(node) then buildControl(spec). Both work on any node.
 */
@Injectable({ providedIn: 'root' })
export class SchemaFormBuilder {
  private readonly registry = inject(FormControlRegistry);

  fieldsFromSchema(schema: z.ZodType, key = '', path = ''): FieldSpec {
    // The root (no key, no path) and an array item template (a path ending in
    // `[]`) render no label of their own, so neither is required to carry one.
    const isUnlabeledContainer = (!key && !path) || path.endsWith('[]');
    const meta = resolveMeta(schema, path || key || '<root>', {
      requireLabel: !isUnlabeledContainer,
    });
    const inner = unwrap(schema);
    const def = inner.def as unknown as { type: string };

    // An object node is always a group — there is no ambiguity to resolve the
    // way an array has (plain array vs. multiselect), so this skips the
    // registry rather than requiring a 'group' definition to be registered
    // before any object schema, including the root every caller passes, can
    // be walked at all. An explicit meta.control still wins: that is the seam
    // a composite widget (e.g. an address autocomplete) uses to render a whole
    // object as one control instead of a grid of its fields.
    if (def.type === 'object') {
      const kind = meta.control ?? 'group';
      const shape = (inner.def as unknown as ObjectDef).shape;
      const children = Object.entries(shape)
        .map(([childKey, child]) =>
          this.fieldsFromSchema(child, childKey, path ? `${path}.${childKey}` : childKey),
        )
        .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0));
      return { key, kind, schema: inner, meta, children };
    }

    const kind = this.registry.resolve(schema, meta, path || key).kind;

    if (def.type === 'array' && kind === 'array') {
      const element = (inner.def as unknown as ArrayDef).element;
      const itemPath = `${path || key}[]`;
      return { key, kind, schema: inner, meta, children: [this.fieldsFromSchema(element, '', itemPath)] };
    }

    return { key, kind, schema: inner, meta };
  }

  buildControl(spec: FieldSpec): AbstractControl {
    if (spec.kind === 'group') {
      const controls: Record<string, AbstractControl> = {};
      for (const child of spec.children ?? []) {
        controls[child.key] = this.buildControl(child);
      }
      return new FormGroup(controls);
    }

    if (spec.kind === 'array') {
      const item = spec.children?.[0];
      const rows = item ? Array.from({ length: minItemsOf(spec.schema) }, () => this.buildControl(item)) : [];
      return new FormArray(rows);
    }

    const definition = this.registry.resolve(spec.schema, spec.meta, spec.key);
    return new FormControl(definition.defaultValue?.(spec.schema) ?? null);
  }

  /** The component registered for a kind. Used by the outlet in SchemaForm and GroupControl. */
  componentFor(kind: string): Type<unknown> {
    const definition = this.registry.byKind(kind);
    return definition.component;
  }
}

/**
 * The row count an empty array should start with. A `.min(n)` array that starts
 * empty is invalid before the user has touched anything, which reads as a bug.
 */
function minItemsOf(schema: z.ZodType): number {
  const checks = (schema.def as unknown as ArrayDef).checks ?? [];
  for (const check of checks) {
    const def = (check as { _zod?: { def?: { check?: string; minimum?: number } } })._zod?.def;
    if (def?.check === 'min_length' && typeof def.minimum === 'number') return def.minimum;
  }
  return 0;
}
