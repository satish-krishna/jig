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
const at = (suffix: string): EmittedFile => files.find((f) => f.path.endsWith(`${suffix}.ts`))!;

test('the facade speaks operation keys, never URLs', () => {
  const ts = at('order.operations').text;
  assert.match(ts, /this\.transport\.request\('orders\.list', \{\}\)/);
  assert.match(ts, /this\.transport\.request\('orders\.get', \{ id \}\)/);
  assert.doesNotMatch(ts, /http|\/api|fetch/i);
});

test('the list ViewModel is unprovided and signal-only', () => {
  const ts = at('order-list.view-model').text;
  assert.match(ts, /@Injectable\(\)\n/);
  assert.doesNotMatch(ts, /providedIn/);
  assert.match(ts, /readonly orders = signal<OrderDto\[\]>\(\[\]\)/);
});

test('the view provides its ViewModel and never subscribes', () => {
  const ts = at('order-list.view').text;
  assert.match(ts, /providers: \[OrderListViewModel\]/);
  assert.doesNotMatch(ts, /\.subscribe\(/);
  assert.doesNotMatch(ts, /standalone|changeDetection/);
});

test('the view template uses built-in control flow and token spacing', () => {
  const ts = at('order-list.view').text;
  assert.match(ts, /@for \(order of vm\.orders\(\); track order\.id\)/);
  assert.match(ts, /@empty/);
  assert.match(ts, /class="grid gap-m"/);
  assert.doesNotMatch(ts, /\*ngIf|\*ngFor|gap-\d/);
});

test('the schema is the only place validation is stated', () => {
  const ts = at('order-form.schema').text;
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
  const ts = at('order-form.schema').text;
  assert.match(ts, /total: z\n?\s*\.number\(\)/);
});

test('the form component renders through SchemaForm and wires nothing per field', () => {
  const ts = at('order-form').text;
  assert.match(ts, /<app-schema-form \[schema\]="orderFormSchema"/);
  assert.match(ts, /\(submitted\)="onSubmitted\(\$event\)"/);
  assert.doesNotMatch(ts, /<hlm-field>|\[formField\]|ngModel|formControlName|FormsModule/);
});

// SchemaForm.submitted is output<Record<string, unknown>>, so $event in the template
// is Record<string, unknown> — Angular templates have no `as`, so an inline
// `saved.emit($event)` binding fails strict template type-checking (TS2345):
// Record<string, unknown> is not assignable to a type with required typed properties.
// The narrowing has to happen in a handler method instead.
test('the form narrows the payload through a handler, not an inline emit in the template', () => {
  const ts = at('order-form').text;
  assert.match(ts, /protected onSubmitted\(value: Record<string, unknown>\): void \{/);
  assert.match(ts, /this\.saved\.emit\(value as OrderFormModel\)/);
  assert.doesNotMatch(ts, /saved\.emit\(\$event\)/);
});

test('no form ViewModel is emitted — SchemaForm owns the form state', () => {
  assert.equal(emitFrontend(spec).filter((f) => f.path.endsWith('-form.view-model.ts')).length, 0);
});

test('the commands file registers a nav command and an action command', () => {
  const ts = at('orders.commands').text;
  assert.match(ts, /id: 'nav-orders'/);
  assert.match(ts, /icon: 'lucideBox'/);
  assert.match(ts, /route: '\/orders'/);
  assert.match(ts, /export function provideOrdersMenu\(\): EnvironmentProviders/);
});

test('a boolean field emits z.boolean() with no min or email validator', () => {
  const ts = emitFrontend(validateSpec({
    name: 'Flag', icon: 'lucideFlag',
    fields: [{ name: 'active', type: 'boolean', label: 'Active' }],
  })).find((f) => f.path.endsWith('flag-form.schema.ts'))!.text;
  assert.match(ts, /active: z\n?\s*\.boolean\(\)/);
  assert.doesNotMatch(ts, /\.min\(1,/);
  assert.doesNotMatch(ts, /\.email\(/);
});

// A label is human copy: "Owner's name" is ordinary English. Interpolated raw it closes
// the emitted single-quoted literal early, and the generated schema is not TypeScript at
// all — a defect the regex suites here would miss but every clone would ship.
test('an apostrophe in a label or placeholder emits an escaped literal, not broken TypeScript', () => {
  const quoted = validateSpec({
    name: 'Owner',
    icon: 'lucideUser',
    fields: [{ name: 'fullName', type: 'string', label: "Owner's name", placeholder: "Ada's" }],
  });
  const schema = emitFrontend(quoted).find((f) => f.path.endsWith('owner-form.schema.ts'))!.text;
  assert.ok(schema.includes(String.raw`.min(1, 'Owner\'s name is required')`), schema);
  assert.ok(schema.includes(String.raw`label: 'Owner\'s name'`), schema);
  assert.ok(schema.includes(String.raw`placeholder: 'Ada\'s'`), schema);
});

test('a backslash in a label is escaped rather than starting an escape sequence', () => {
  const quoted = validateSpec({
    name: 'Path',
    icon: 'lucideFolder',
    fields: [{ name: 'root', type: 'string', label: String.raw`C:\ root`, placeholder: 'x' }],
  });
  const schema = emitFrontend(quoted).find((f) => f.path.endsWith('path-form.schema.ts'))!.text;
  assert.ok(schema.includes(String.raw`label: 'C:\\ root'`), schema);
});
