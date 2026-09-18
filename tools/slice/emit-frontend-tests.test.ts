// Tests for the Angular test emitters. Fixture spec is "Order" (two fields, one unique
// string), matching emit-frontend.test.ts, so every assertion below reads off the same
// derived names: pascal Order, camel order, camelPlural orders, kebab order.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EmittedFile } from './spec.ts';
import { validateSpec } from './spec.ts';
import { emitFrontendTests } from './emit-frontend-tests.ts';

const spec = validateSpec({
  name: 'Order',
  icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

const files = emitFrontendTests(spec);
const at = (suffix: string): EmittedFile => files.find((f) => f.path.endsWith(`${suffix}.ts`))!;

test('the ViewModel spec fakes the Transport port, not the facade', () => {
  const ts = at('order-list.view-model.spec').text;
  assert.match(ts, /class FakeTransport extends Transport/);
  assert.doesNotMatch(ts, /A\.Fake|vi\.mock\('.*operations'\)/);
});

test('the ViewModel spec covers load success, load failure, and save', () => {
  const ts = at('order-list.view-model.spec').text;
  assert.match(ts, /load\(\) populates the orders signal/);
  assert.match(ts, /load\(\) puts a failure on the error signal/);
  assert.match(ts, /save\(\)/);
});

test('sample rows carry every field', () => {
  const ts = at('order-list.view-model.spec').text;
  assert.match(ts, /\{ id: '1', reference: 'a', total: 1 \}/);
});

test('the form spec asserts a validation message from the schema', () => {
  assert.match(at('order-form.spec').text, /Reference is required/);
});

// The exemplar (user-list.view.spec.ts) asserts the alert PRIMITIVE, not just its text,
// on the load-failure path — it lives in the same static, non-field-dependent template
// block as the hlmH3 and hlmUl checks the view spec already carries, so dropping it while
// keeping its siblings has no principled line.
test('the view spec asserts the alert primitive on a load failure, not just its text', () => {
  const ts = at('order-list.view.spec').text;
  assert.match(ts, /reports a failure through the alert primitive/);
  assert.match(ts, /alert\.hasAttribute\('hlmAlert'\)\)\.toBe\(true\)/);
});

// sampleValue's boolean and email-format branches are otherwise never exercised: every
// other test in this file uses the Order fixture (string + number only). The email sample
// matters beyond cosmetics — the emitted schema applies .email(...) to that field, so a
// malformed sample would make every generated slice with an email field start red.
test('a boolean field and an email-format field get their own sample shapes', () => {
  const mixed = validateSpec({
    name: 'Flag',
    icon: 'lucideFlag',
    fields: [
      { name: 'active', type: 'boolean', label: 'Active' },
      { name: 'email', type: 'string', label: 'Email', format: 'email' },
    ],
  });
  const ts = emitFrontendTests(mixed).find((f) => f.path.endsWith('flag-list.view-model.spec.ts'))!.text;
  assert.match(ts, /active: true/);
  assert.match(ts, /email: 'a@x\.io'/);
});

// The required-message assertion reads a message only emit-frontend.ts's STRING branch
// emits: `.min(1, '{label} is required')`. A boolean field yields a bare z.boolean(), so an
// unchecked box is valid, nothing renders in the error slot, and the assertion would throw
// on a null element. The test therefore has to target a string field wherever it sits.
test('the required-message test targets the first STRING field, not the first field', () => {
  const booleanFirst = validateSpec({
    name: 'Task',
    icon: 'lucideCheck',
    fields: [
      { name: 'done', type: 'boolean', label: 'Done' },
      { name: 'title', type: 'string', label: 'Title' },
    ],
  });
  const ts = emitFrontendTests(booleanFirst).find((f) => f.path.endsWith('task-form.spec.ts'))!.text;
  assert.match(ts, /querySelector\('\[data-error-for="title"\]'\);\n    expect\(error\.textContent\)\.toContain\('Title is required'\)/);
  assert.doesNotMatch(ts, /Done is required/);
  // The negative path needs a value the schema rejects, which only the string field has
  // (''), so it targets the same field.
  assert.match(ts, /setValue\(\{ done: true, title: '' \}\)/);
});

// No string field means no required message exists to assert, and no value the schema
// rejects either — z.boolean() accepts both booleans — so both the invalid-submit test and
// its negative-path sibling are omitted entirely. Same guard emit-dotnet-tests.ts applies
// to its 400-on-invalid-body fact.
test('a spec with no string field emits no validation tests and a still-valid suite', () => {
  const allBoolean = validateSpec({
    name: 'Flag',
    icon: 'lucideFlag',
    fields: [
      { name: 'enabled', type: 'boolean', label: 'Enabled' },
      { name: 'archived', type: 'boolean', label: 'Archived' },
    ],
  });
  const ts = emitFrontendTests(allBoolean).find((f) => f.path.endsWith('flag-form.spec.ts'))!.text;
  assert.doesNotMatch(ts, /is required/);
  assert.doesNotMatch(ts, /does not emit saved/);
  assert.match(ts, /describe\('FlagForm', \(\) => \{/);
  assert.match(ts, /renders the schema form with a control per field/);
  assert.match(ts, /labels the submit button with the action/);
  // The empty-slot test survives: hlm-field-error is rendered for every field regardless
  // of its control kind (forms/controls/field-host.ts), so it needs no string field.
  assert.match(ts, /shows no validation message before the first submit/);
  assert.match(ts, /data-error-for="enabled"/);
  assert.match(ts, /narrows the payload SchemaForm emits/);
  assert.equal(ts.match(/\n  it\(/g)!.length, 4);
});

// user-form.spec.ts is the golden spec now that user-form.ts is the generator's own
// output, so the emitted suite carries all six of its tests. Three of them were
// missing: the submit-label check (the emitter emits submitLabel="Save {camel}", so it is
// assertable), the before-first-submit check (which guards the trap its own comment
// describes — the error slot stays mounted, so asserting absence can pass by accident),
// and the negative path, the only test of the component's one piece of real logic.
test('the form spec carries all six of the exemplar suite tests', () => {
  const ts = at('order-form.spec').text;
  assert.match(ts, /renders the schema form with a control per field/);
  assert.match(ts, /labels the submit button with the action, not the default/);
  assert.match(ts, /toBe\('Save order'\)/);
  assert.match(ts, /surfaces the schema validation message on an invalid submit/);
  assert.match(ts, /shows no validation message before the first submit/);
  assert.match(ts, /narrows the payload SchemaForm emits/);
  assert.match(ts, /does not emit saved when the schema rejects the value/);
  assert.equal(ts.match(/\n  it\(/g)!.length, 6);
});

// A label is human copy, so an apostrophe in it is ordinary English, not an exotic input.
// Interpolated raw it closes the emitted single-quoted literal early and the generated
// file is not TypeScript at all.
test('an apostrophe in a label or placeholder does not break the emitted spec files', () => {
  const quoted = validateSpec({
    name: 'Owner',
    icon: 'lucideUser',
    fields: [{ name: 'fullName', type: 'string', label: "Owner's name", placeholder: "Ada's" }],
  });
  const ts = emitFrontendTests(quoted).find((f) => f.path.endsWith('owner-form.spec.ts'))!.text;
  assert.match(ts, /Owner\\'s name is required/);
});
