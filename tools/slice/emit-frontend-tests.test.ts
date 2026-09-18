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
