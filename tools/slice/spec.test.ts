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

// The doc comment on validateSpec has always claimed field names are checked as camelCase;
// only their typeof was. A field named "id" emits `public Guid Id` beside `public required
// string Id`, a C# duplicate-member error nowhere near its cause; a name with a space or a
// quote emits a property name that is not an identifier in any of the four languages.
test('validateSpec rejects a field name that is not a camelCase identifier', () => {
  for (const bad of ['Reference', 'my field', 'total-price', '2fast', "o'brien", '']) {
    assert.throws(
      () => validateSpec({ ...base, fields: [{ name: bad, type: 'string', label: 'X' }] }),
      /camelCase identifier/,
      `accepted ${JSON.stringify(bad)}`,
    );
  }
});

test('validateSpec accepts the camelCase names the emitters are built for', () => {
  for (const good of ['reference', 'fullName', 'line2', 'a']) {
    assert.ok(validateSpec({ ...base, fields: [{ name: good, type: 'string', label: 'X' }] }));
  }
});

// Every emitter adds an id of its own — Guid Id, pub id: String, the DTO's id — so a field
// called id is a collision by construction rather than a matter of taste.
test('validateSpec reserves the id field name', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'id', type: 'string', label: 'Id' }] }),
    /reserved/,
  );
});

// A field named after a keyword in one of the three emitted languages breaks a build far
// from this validation: `string string` in a C# signature, a native struct field that
// will not parse, a TypeScript identifier-shaped key that will not parse either. All
// three are silent until the far-away build fails, so they are rejected here instead.
// ("native" here, and in the assertion below, is this codebase's own word for the
// desktop runtime a thin clone does not have — see the RUST_RESERVED comment in spec.ts.)
test('validateSpec rejects a field name that is a C# keyword', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'decimal', type: 'string', label: 'X' }] }),
    /reserved.*C#/,
  );
});

test('validateSpec rejects a field name that is a native-runtime keyword', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'impl', type: 'string', label: 'X' }] }),
    /reserved.*native/,
  );
});

test('validateSpec rejects a field name that is a TypeScript keyword', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'instanceof', type: 'string', label: 'X' }] }),
    /reserved.*TypeScript/,
  );
});

// The check must not over-reach: a name that merely looks risky, but is reserved
// nowhere, stays legal.
test('validateSpec accepts field names that look risky but reserve nothing', () => {
  for (const good of ['value', 'data']) {
    assert.ok(validateSpec({ ...base, fields: [{ name: good, type: 'string', label: 'X' }] }));
  }
});

test('validateSpec rejects two fields with the same name', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [
      { name: 'reference', type: 'string', label: 'A' },
      { name: 'reference', type: 'number', label: 'B' },
    ] }),
    /duplicate/i,
  );
});

// Label and placeholder are escaped at every emit site, but a newline cannot be escaped
// into a single-quoted TypeScript literal at all, so it is refused at the boundary instead.
test('validateSpec rejects a control character in a label or placeholder', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'string', label: 'Two\nlines' }] }),
    /control character/,
  );
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'a', type: 'string', label: 'A', placeholder: 'Two\nlines' }] }),
    /control character/,
  );
});

// name and icon are interpolated into C# namespaces, native module names and TypeScript
// identifiers, none of which survive a space or a quote. Same boundary, same reasoning.
test('validateSpec rejects a name or icon that is not an identifier', () => {
  assert.throws(() => validateSpec({ ...base, name: 'Purchase Order' }), /PascalCase/);
  assert.throws(() => validateSpec({ ...base, name: 'Order"; x' }), /PascalCase/);
  assert.throws(() => validateSpec({ ...base, plural: 'Order Items' }), /PascalCase/);
  assert.throws(() => validateSpec({ ...base, icon: "lucide's" }), /icon must be/);
});
