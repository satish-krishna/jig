// Angular production emitters for the vertical-slice generator. Six pure functions, one
// per TypeScript file, each reproducing the shape of the `users` reference slice
// (frontend/src/app/features/users) with the spec's own names substituted in. The text lives
// in tools/slice/templates/frontend/, and this file builds the models that fill it. No disk
// access here — the CLI (a later task) decides where these EmittedFile entries land.
//
// The form is rendered through SchemaForm, not hand-wired: no {kebab}-form.view-model.ts
// is emitted. Every users exemplar file is these emitters' exact output for
// examples/slices/users.slice.json (the template gates it with a golden test), so the exemplar and
// the generator cannot teach different shapes; docs/architecture/forms.md makes the
// renderer the default for every form. The schema file below carries every field's shape,
// validation, and control kind, and the form component wires nothing per field.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { label, sentenceCase } from './naming.ts';
import { tsString } from './literal.ts';
import { renderTemplate } from './render.ts';

// ---------------------------------------------------------------------------
// The zod-type fragment and per-field .meta() block, shared by the schema file.
// Copied verbatim from the task brief: it reproduces user-form.schema.ts's shape
// field by field, decimal validation for strings, the email validator, and the
// FormFieldMeta the control registry (and SchemaForm) reads to render and label it.
// ---------------------------------------------------------------------------

const ZOD_TYPE: Record<FieldSpec['type'], string> = {
  string: 'z\n    .string()',
  number: 'z\n    .number()',
  boolean: 'z\n    .boolean()',
};

function zodField(f: FieldSpec, order: number): string {
  const lines = [`  ${f.name}: ${ZOD_TYPE[f.type]}`];
  // label and placeholder are the spec author's own words, so they go through tsString
  // rather than straight into the literal — see literal.ts.
  if (f.type === 'string') lines.push(`    .min(1, ${tsString(`${f.label} is required`)})`);
  if (f.format === 'email') lines.push(`    .email('Enter a valid email')`);
  const meta = [`label: ${tsString(f.label)}`];
  if (f.format) meta.push(`control: '${f.format}'`);
  if (f.placeholder) meta.push(`placeholder: ${tsString(f.placeholder)}`);
  meta.push(`order: ${order}`);
  lines.push(`    .meta({ ${meta.join(', ')} } satisfies FormFieldMeta),`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// frontend/src/app/operations/{kebab}.operations.ts — shape source: user.operations.ts
// ---------------------------------------------------------------------------

interface OperationsModel extends SliceNames {}

function operationsModel(n: SliceNames): OperationsModel {
  return { ...n };
}

function emitOperations(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/operations/${n.kebab}.operations.ts`,
    text: renderTemplate('frontend/operations.ts.ejs', operationsModel(n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view-model.ts
// shape source: user-list.view-model.ts
// ---------------------------------------------------------------------------

interface ListViewModelModel extends SliceNames {}

function listViewModelModel(n: SliceNames): ListViewModelModel {
  return { ...n };
}

function emitListViewModel(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view-model.ts`,
    text: renderTemplate('frontend/list-view-model.ts.ejs', listViewModelModel(n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-list.view.ts
// shape source: user-list.view.ts
// ---------------------------------------------------------------------------

interface ListViewModel extends SliceNames {
  listHeading: string;
  rowFields: { name: string; sep: string }[];
  emptyMessage: string;
}

function listViewModel(spec: SliceSpec, n: SliceNames): ListViewModel {
  return {
    ...n,
    listHeading: sentenceCase(label(n.kebabPlural)),
    rowFields: spec.fields.map((f, i) => ({ name: f.name, sep: i === 0 ? '' : ' · ' })),
    emptyMessage: label(n.kebabPlural),
  };
}

function emitListView(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-list.view.ts`,
    text: renderTemplate('frontend/list-view.ts.ejs', listViewModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.schema.ts
// shape source: user-form.schema.ts
// ---------------------------------------------------------------------------

interface FormSchemaModel extends SliceNames {
  formLabel: string;
  zodFields: string[];
}

function formSchemaModel(spec: SliceSpec, n: SliceNames): FormSchemaModel {
  return {
    ...n,
    formLabel: label(n.kebabPlural),
    zodFields: spec.fields.map((f, i) => zodField(f, i + 1)),
  };
}

function emitFormSchema(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.schema.ts`,
    text: renderTemplate('frontend/form-schema.ts.ejs', formSchemaModel(spec, n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebab}-form.ts
// shape source: showcase/pages/schema-form.page.ts (SchemaForm's real usage)
// ---------------------------------------------------------------------------

interface FormModel extends SliceNames {
  formLabel: string;
  submitLabel: string;
}

function formModel(n: SliceNames): FormModel {
  return {
    ...n,
    formLabel: label(n.kebabPlural),
    submitLabel: `Add ${label(n.kebab)}`,
  };
}

function emitForm(n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebab}-form.ts`,
    text: renderTemplate('frontend/form.ts.ejs', formModel(n)),
  };
}

// ---------------------------------------------------------------------------
// frontend/src/app/features/{kebabPlural}/{kebabPlural}.commands.ts
// shape source: users.commands.ts
// ---------------------------------------------------------------------------

interface CommandsModel extends SliceNames {
  newCommandLabel: string;
  navLabel: string;
  icon: string;
}

function commandsModel(spec: SliceSpec, n: SliceNames): CommandsModel {
  return {
    ...n,
    newCommandLabel: `new ${label(n.kebab)}`,
    navLabel: label(n.kebabPlural),
    icon: spec.icon,
  };
}

function emitCommands(spec: SliceSpec, n: SliceNames): EmittedFile {
  return {
    path: `frontend/src/app/features/${n.kebabPlural}/${n.kebabPlural}.commands.ts`,
    text: renderTemplate('frontend/commands.ts.ejs', commandsModel(spec, n)),
  };
}

/**
 * Emit the six Angular files that make up the frontend half of a vertical slice: the
 * operations facade, the list ViewModel and view, the form schema and its thin
 * SchemaForm wrapper, and the nav/action commands file. `spec` has no product
 * parameter — the frontend has no per-clone namespace to substitute.
 */
export function emitFrontend(spec: SliceSpec): EmittedFile[] {
  const n = deriveNames(spec);
  return [
    emitOperations(n),
    emitListViewModel(n),
    emitListView(spec, n),
    emitFormSchema(spec, n),
    emitForm(n),
    emitCommands(spec, n),
  ];
}
