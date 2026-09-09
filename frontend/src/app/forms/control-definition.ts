import { InjectionToken, makeEnvironmentProviders, type Type } from '@angular/core';
import type { z } from 'zod';
import type { ControlKind } from './form-field-meta';

/**
 * One registered control: its kind name, the component that renders it, when to
 * infer it from a zod type, and what an empty instance of it holds.
 *
 * @capability forms.control-definition
 * @intent A control kind is registered data, never a branch inside SchemaForm.
 * @reuse Declare one per control and pass it to provideFormControls() in app config.
 */
export interface FormControlDefinition {
  readonly kind: ControlKind;
  /** Must extend SchemaFormControl so it declares the field and control inputs. */
  readonly component: Type<unknown>;
  /** Absent means "reachable only by an explicit meta.control override". */
  readonly matches?: (schema: z.ZodType) => boolean;
  /** Absent means null. Receives the UNWRAPPED schema. */
  readonly defaultValue?: (schema: z.ZodType) => unknown;
}

/** Caller-registered controls. Resolved before any default. */
export const FORM_CONTROL = new InjectionToken<readonly FormControlDefinition[]>('FORM_CONTROL');

/** The shipped catalog. Resolved only after every caller-registered control. */
export const FORM_CONTROL_DEFAULT = new InjectionToken<readonly FormControlDefinition[]>(
  'FORM_CONTROL_DEFAULT',
);

/**
 * Register controls. Two tokens rather than one ordered list, because the two
 * precedence rules pull in opposite directions: WITHIN a call, order must be
 * first-match-wins (specific before general), while ACROSS calls, a caller must
 * beat the defaults. Reversing one array cannot give both — it would flip the
 * within-call order too. Concatenating two tokens gives both with no sorting.
 */
export function provideFormControls(...defs: readonly FormControlDefinition[]) {
  return makeEnvironmentProviders(
    defs.map((def) => ({ provide: FORM_CONTROL, useValue: def, multi: true })),
  );
}

/** Used only by provideDefaultFormControls(). Callers use provideFormControls(). */
export function provideFormControlDefaults(...defs: readonly FormControlDefinition[]) {
  return makeEnvironmentProviders(
    defs.map((def) => ({ provide: FORM_CONTROL_DEFAULT, useValue: def, multi: true })),
  );
}
