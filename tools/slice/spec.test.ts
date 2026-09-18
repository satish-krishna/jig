import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveNames, validateSpec, loadSpec } from './spec.ts';

const base = { name: 'Order', icon: 'lucideBox', fields: [{ name: 'reference', type: 'string', label: 'Reference' }] };

test('deriveNames pluralizes a regular noun', () => {
  const n = deriveNames(validateSpec(base));
  assert.equal(n.pascal, 'Order');
  assert.equal(n.pascalPlural, 'Orders');
  assert.equal(n.camelPlural, 'orders');
  assert.equal(n.opPrefix, 'orders');
  assert.equal(n.route, '/orders');
});

test('deriveNames handles the -o and -y nouns that bit Tour of Heroes', () => {
  assert.equal(deriveNames(validateSpec({ ...base, name: 'Hero' })).pascalPlural, 'Heroes');
  assert.equal(deriveNames(validateSpec({ ...base, name: 'Category' })).pascalPlural, 'Categories');
  assert.equal(deriveNames(validateSpec({ ...base, name: 'Address' })).pascalPlural, 'Addresses');
});

test('an explicit plural overrides the rule', () => {
  assert.equal(deriveNames(validateSpec({ ...base, name: 'Person', plural: 'People' })).pascalPlural, 'People');
});

test('a multi-word entity derives every casing', () => {
  const n = deriveNames(validateSpec({ ...base, name: 'PurchaseOrder' }));
  assert.equal(n.camel, 'purchaseOrder');
  assert.equal(n.kebab, 'purchase-order');
  assert.equal(n.kebabPlural, 'purchase-orders');
  assert.equal(n.snakePlural, 'purchase_orders');
});

test('validateSpec rejects two unique fields', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [
      { name: 'a', type: 'string', label: 'A', unique: true },
      { name: 'b', type: 'string', label: 'B', unique: true },
    ] }),
    /at most one unique field/,
  );
});

test('validateSpec rejects an empty field list', () => {
  assert.throws(() => validateSpec({ ...base, fields: [] }), /at least one field/);
});

test('validateSpec rejects a non-Pascal entity name', () => {
  assert.throws(() => validateSpec({ ...base, name: 'order' }), /PascalCase/);
});

test('loadSpec loads and validates the users example', () => {
  const spec = loadSpec('examples/slices/users.slice.json');
  const n = deriveNames(spec);
  assert.equal(n.opPrefix, 'users');
});

test('validateSpec rejects a string unique instead of boolean', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'string', label: 'A', unique: 'true' }] }),
    /unique.*boolean/,
  );
});

test('validateSpec rejects an unknown format value', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'string', label: 'A', format: 'bogus' }] }),
    /format.*email/,
  );
});

test('validateSpec rejects a non-string placeholder', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'string', label: 'A', placeholder: 123 }] }),
    /placeholder.*string/,
  );
});

test('validateSpec rejects a non-string plural', () => {
  assert.throws(
    () => validateSpec({ ...base, name: 'Order', plural: 123 }),
    /plural.*string/,
  );
});

test('validateSpec rejects a unique boolean field', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'active', type: 'boolean', label: 'Active', unique: true }] }),
    /boolean field.*cannot be unique/,
  );
});

test('validateSpec rejects format on a non-string field', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'number', label: 'A', format: 'email' }] }),
    /format.*string field/,
  );
});

test('validateSpec accepts specs with no optional fields', () => {
  const spec = validateSpec({ ...base, fields: [{ name: 'a', type: 'number', label: 'Count' }] });
  assert.equal(spec.name, 'Order');
});
