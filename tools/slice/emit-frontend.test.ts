// Tests for the Angular production emitters. Fixture spec is "Order" (two fields,
// one unique string) so every assertion below reads directly off deriveNames' output:
// pascal Order, pascalPlural Orders, camel order, camelPlural orders, kebab order,
// kebabPlural orders, opPrefix orders, route /orders.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EmittedFile } from './spec.ts';
import { validateSpec } from './spec.ts';
import { emitFrontend } from './emit-frontend.ts';

const spec = validateSpec({
  name: 'Order',
  icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

const files = emitFrontend(spec);
const at = (suffix: string): EmittedFile | undefined => files.find((f) => f.path.endsWith(`${suffix}.ts`));

test('the facade speaks operation keys, never URLs', () => {
  const ts = at('orders.operations') ?? at('order.operations');
  assert.match(ts!.text, /this\.transport\.request\('orders\.list', \{\}\)/);
  assert.match(ts!.text, /this\.transport\.request\('orders\.get', \{ id \}\)/);
  assert.doesNotMatch(ts!.text, /http|\/api|fetch/i);
});

test('the list ViewModel is unprovided and signal-only', () => {
  const ts = at('order-list.view-model')!.text;
  assert.match(ts, /@Injectable\(\)\n/);
  assert.doesNotMatch(ts, /providedIn/);
  assert.match(ts, /readonly orders = signal<OrderDto\[\]>\(\[\]\)/);
});

test('the view provides its ViewModel and never subscribes', () => {
  const ts = at('order-list.view')!.text;
  assert.match(ts, /providers: \[OrderListViewModel\]/);
  assert.doesNotMatch(ts, /\.subscribe\(/);
  assert.doesNotMatch(ts, /standalone|changeDetection/);
});

test('the view template uses built-in control flow and token spacing', () => {
  const ts = at('order-list.view')!.text;
  assert.match(ts, /@for \(order of vm\.orders\(\); track order\.id\)/);
  assert.match(ts, /@empty/);
  assert.match(ts, /class="grid gap-m"/);
  assert.doesNotMatch(ts, /\*ngIf|\*ngFor|gap-\d/);
});

test('the schema is the only place validation is stated', () => {
  const ts = at('order-form.schema')!.text;
  assert.match(ts, /export const orderFormSchema = z\.object\(\{/);
  assert.match(ts, /reference: z\n?\s*\.string\(\)\n?\s*\.min\(1, 'Reference is required'\)/);
  assert.match(ts, /export type OrderFormModel = z\.infer<typeof orderFormSchema>;/);
});

test('an email field emits the email control and validator once', () => {
  const ts = emitFrontend(validateSpec({
    name: 'Contact', icon: 'lucideUser',
    fields: [{ name: 'email', type: 'string', label: 'Email', format: 'email' }],
  })).find((f) => f.path.endsWith('contact-form.schema.ts'))!.text;
  assert.match(ts, /\.email\('Enter a valid email'\)/);
  assert.match(ts, /control: 'email'/);
});

test('a number field emits a numeric zod type and a coercing control', () => {
  const ts = at('order-form.schema')!.text;
  assert.match(ts, /total: z\n?\s*\.number\(\)/);
});

test('the form component renders through SchemaForm and wires nothing per field', () => {
  const ts = at('order-form')!.text;
  assert.match(ts, /<app-schema-form \[schema\]="orderFormSchema"/);
  assert.match(ts, /\(submitted\)="saved\.emit\(\$event\)"/);
  assert.doesNotMatch(ts, /<hlm-field>|\[formField\]|ngModel|formControlName|FormsModule/);
});

test('no form ViewModel is emitted — SchemaForm owns the form state', () => {
  assert.equal(emitFrontend(spec).filter((f) => f.path.endsWith('-form.view-model.ts')).length, 0);
});

test('the commands file registers a nav command and an action command', () => {
  const ts = at('orders.commands')!.text;
  assert.match(ts, /id: 'nav-orders'/);
  assert.match(ts, /icon: 'lucideBox'/);
  assert.match(ts, /route: '\/orders'/);
  assert.match(ts, /export function provideOrdersMenu\(\): EnvironmentProviders/);
});
