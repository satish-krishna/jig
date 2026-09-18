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
