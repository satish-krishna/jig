// Angular test emitters for the vertical-slice generator. Five pure functions, one per
// Vitest spec file, reproducing the shape of the users reference slice's tests
// (frontend/src/app/operations/user.operations.spec.ts and the four specs under
// frontend/src/app/features/users) with the spec's own names substituted in. The text lives
// in tools/slice/templates/frontend-tests/, and this file builds the models that fill it. No
// disk access here — the CLI (a later task) decides where these EmittedFile entries land.
//
// There is no {kebab}-form.view-model.spec.ts: emit-frontend.ts emits no form ViewModel
// for the same reason — the form renders entirely through SchemaForm, and SchemaForm's
// own behavior is already covered by frontend/src/app/forms/schema-form.spec.ts. The
// emitted form spec below tests only the emitted component's own behavior: that it
// renders the schema form and narrows SchemaForm's untyped payload before re-emitting it.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { label, words } from './naming.ts';
import { tsString } from './literal.ts';
import { renderTemplate } from './render.ts';

/**
 * A TS-literal sample value for a field, distinct per variant (0 or 1). Mirrors
 * emit-dotnet-tests.ts's sample() but produces JS literals ('alpha', 1, true) for a spec
 * file's object literals instead of C# ones.
 */
function sampleValue(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return String(variant + 1);
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? `'alpha@x.io'` : `'bravo@x.io'`;
  return variant === 0 ? `'alpha'` : `'bravo'`;
}

/** `name: value, name: value` fragment for every field at one sample variant. */
function fieldsLiteral(spec: SliceSpec, variant: 0 | 1): string {
  return spec.fields.map((f) => `${f.name}: ${sampleValue(f, variant)}`).join(', ');
}

/** A sample row object literal carrying an id plus every field, e.g. `{ id: '1', reference: 'alpha', total: 1 }`. */
function rowLiteral(spec: SliceSpec, id: string, variant: 0 | 1): string {
  return `{ id: '${id}', ${fieldsLiteral(spec, variant)} }`;
}

// ---------------------------------------------------------------------------
// frontend/src/app/operations/{kebab}.operations.spec.ts
// shape source: user.operations.spec.ts
// ---------------------------------------------------------------------------

interface OperationsSpecModel {
  pascal: string;
  kebab: string;
  opPrefix: string;
  camel: string;
  fieldsLiteral0: string;
}

function operationsSpecModel(spec: SliceSpec, n: SliceNames): OperationsSpecModel {
  return {
    pascal: n.pascal,
    kebab: n.kebab,
    opPrefix: n.opPrefix,
    camel: n.camel,
    fieldsLiteral0: fieldsLiteral(spec, 0),
  };
}

function emitOperationsSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/operations/${n.kebab}.operations.spec.ts`,
    text: renderTemplate('frontend-tests/operations.spec.ts.ejs', operationsSpecModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view-model.spec.ts
// shape source: user-list.view-model.spec.ts
// ---------------------------------------------------------------------------

interface ListViewModelSpecModel {
  pascal: string;
  kebab: string;
  camelPlural: string;
  opPrefix: string;
  fieldsLiteral0: string;
  rowLiteral1_0: string;
}

function listViewModelSpecModel(spec: SliceSpec, n: SliceNames): ListViewModelSpecModel {
  return {
    pascal: n.pascal,
    kebab: n.kebab,
    camelPlural: n.camelPlural,
    opPrefix: n.opPrefix,
    fieldsLiteral0: fieldsLiteral(spec, 0),
    rowLiteral1_0: rowLiteral(spec, '1', 0),
  };
}

function emitListViewModelSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view-model.spec.ts`,
    text: renderTemplate('frontend-tests/list-view-model.spec.ts.ejs', listViewModelSpecModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view.spec.ts
// shape source: user-list.view.spec.ts
// ---------------------------------------------------------------------------

interface ListViewSpecModel {
  pascal: string;
  kebab: string;
  camel: string;
  camelPlural: string;
  opPrefix: string;
  rowLiteral1_0: string;
  rowLiteral2_1: string;
  firstFieldSample: string;
  labelPlural: string;
}

function listViewSpecModel(spec: SliceSpec, n: SliceNames): ListViewSpecModel {
  const firstField = spec.fields[0];
  return {
    pascal: n.pascal,
    kebab: n.kebab,
    camel: n.camel,
    camelPlural: n.camelPlural,
    opPrefix: n.opPrefix,
    rowLiteral1_0: rowLiteral(spec, '1', 0),
    rowLiteral2_1: rowLiteral(spec, '2', 1),
    firstFieldSample: sampleValue(firstField, 0).replace(/'/g, ''),
    labelPlural: label(n.kebabPlural),
  };
}

function emitListViewSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view.spec.ts`,
    text: renderTemplate('frontend-tests/list-view.spec.ts.ejs', listViewSpecModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.spec.ts
// shape source: user-form.spec.ts. user-form.ts is emit-frontend.ts's own output now, so
// its spec is the golden suite for the emitted component and all six of its tests are
// reproduced here — minus the two that need a string field (see below), which the exemplar
// has and some specs do not.
// ---------------------------------------------------------------------------

interface IdCheck {
  fieldName: string;
}

interface EmailTest {
  inWords: string;
  literal: string;
}

interface FormSpecModel {
  pascal: string;
  kebab: string;
  labelKebab: string;
  idChecks: IdCheck[];
  validated: { name: string; message: string } | null;
  firstFieldName: string;
  fieldsLiteral0: string;
  invalidLiteral: string;
  emailTests: EmailTest[];
}

function formSpecModel(spec: SliceSpec, n: SliceNames): FormSpecModel {
  const validated = spec.fields.find((f) => f.type === 'string');
  const firstField = spec.fields[0];

  const invalidLiteral = validated
    ? spec.fields.map((f) => `${f.name}: ${f === validated ? `''` : sampleValue(f, 0)}`).join(', ')
    : '';

  const emailTests: EmailTest[] = spec.fields
    .filter((f) => f.format === 'email')
    .map((emailField) => {
      const malformedLiteral = spec.fields
        .map((f) => `${f.name}: ${f === emailField ? `'not-an-email'` : sampleValue(f, 0)}`)
        .join(', ');
      const inWords = words(emailField.name).map((w) => w.toLowerCase()).join(' ');
      return { inWords, literal: malformedLiteral };
    });

  return {
    pascal: n.pascal,
    kebab: n.kebab,
    labelKebab: label(n.kebab),
    idChecks: spec.fields.map((f) => ({ fieldName: f.name })),
    validated: validated ? {
      name: validated.name,
      message: tsString(`${validated.label} is required`),
    } : null,
    firstFieldName: firstField.name,
    fieldsLiteral0: fieldsLiteral(spec, 0),
    invalidLiteral,
    emailTests,
  };
}

function emitFormSpec(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.spec.ts`,
    text: renderTemplate('frontend-tests/form.spec.ts.ejs', formSpecModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebabPlural}.commands.spec.ts
// shape source: users.commands.spec.ts
// ---------------------------------------------------------------------------

interface CommandsSpecModel {
  pascal: string;
  pascalPlural: string;
  kebab: string;
  kebabPlural: string;
  labelPlural: string;
}

function commandsSpecModel(n: SliceNames): CommandsSpecModel {
  return {
    pascal: n.pascal,
    pascalPlural: n.pascalPlural,
    kebab: n.kebab,
    kebabPlural: n.kebabPlural,
    labelPlural: label(n.kebabPlural),
  };
}

function emitCommandsSpec(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebabPlural}.commands.spec.ts`,
    text: renderTemplate('frontend-tests/commands.spec.ts.ejs', commandsSpecModel(n)),
  };
}

/**
 * Emit the five Angular test files that accompany a generated slice's production
 * code: the operations facade spec, the list ViewModel spec, the list view spec, the
 * form component spec, and the nav/action commands spec. There is no form-ViewModel
 * spec — see the module comment above.
 */
export function emitFrontendTests(spec: SliceSpec): EmittedFile[] {
  const n = deriveNames(spec);
  return [
    emitOperationsSpec(spec, n),
    emitListViewModelSpec(spec, n),
    emitListViewSpec(spec, n),
    emitFormSpec(spec, n),
    emitCommandsSpec(n),
  ];
}
