import { Injectable, inject } from '@angular/core';
import type { z } from 'zod';
import { FORM_CONTROL, FORM_CONTROL_DEFAULT, type FormControlDefinition } from './control-definition';
import type { FormFieldMeta } from './form-field-meta';
import { unwrap } from './zod-meta';

/**
 * Thrown when a schema contains a shape no registered control draws — a union,
 * a record, a tuple, or a recursive z.lazy.
 *
 * This is a DEVELOPER-TIME assertion. The agreed response is to register the
 * missing control, not to catch this. No caller branches on it and there is no
 * fallback renderer, so the message's whole job is to name what to go build.
 */
export class SchemaFormUnsupportedError extends Error {
  constructor(
    readonly path: string,
    readonly zodType: string,
  ) {
    super(
      `SchemaForm: ${path || '<root>'}: zod type "${zodType}" is not supported. ` +
        `Register a FormControlDefinition whose matches() claims it.`,
    );
    this.name = 'SchemaFormUnsupportedError';
  }
}

/**
 * Resolves a zod node to the control that draws it. meta.control wins; otherwise
 * the first definition whose matches() claims the UNWRAPPED type.
 *
 * @capability forms.control-registry
 * @intent Control choice is a lookup over registered data, not a switch in a component.
 * @reuse Inject it; register kinds with provideFormControls(). Order is semantic — first match wins.
 */
@Injectable({ providedIn: 'root' })
export class FormControlRegistry {
  // Caller-registered controls first, defaults after — so a caller overrides a
  // shipped kind without editing the catalog, while order WITHIN each list stays
  // exactly as written (first match wins, specific before general).
  private readonly definitions = [
    ...inject(FORM_CONTROL, { optional: true }) ?? [],
    ...inject(FORM_CONTROL_DEFAULT, { optional: true }) ?? [],
  ];

  resolve(schema: z.ZodType, meta: FormFieldMeta, path: string): FormControlDefinition {
    const inner = unwrap(schema);

    if (meta.control) {
      const byKind = this.definitions.find((d) => d.kind === meta.control);
      if (!byKind) {
        throw new SchemaFormUnsupportedError(path, `control override "${meta.control}"`);
      }
      return byKind;
    }

    const matched = this.definitions.find((d) => d.matches?.(inner) === true);
    if (!matched) {
      throw new SchemaFormUnsupportedError(path, (inner.def as { type: string }).type);
    }
    return matched;
  }
}
