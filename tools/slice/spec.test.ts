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

// thick:start
// Only the desktop shell's language reserves these, so a thin clone, which has no desktop
// shell, strips both the rule and this test and accepts a field called `type`.
test('validateSpec rejects a field name that is a Rust keyword', () => {
  assert.throws(
    () => validateSpec({ ...base, fields: [{ name: 'impl', type: 'string', label: 'X' }] }),
    /reserved: it is a keyword in Rust/,
  );
});

// The store module is named after the entity plural, so these would overwrite the shell's own
// command adapters or entry points, and the collision check's --force advice would do it.
test('validateSpec rejects an entity whose store module would replace a desktop shell file', () => {
  assert.throws(() => validateSpec({ ...base, name: 'Command' }), /desktop shell's own/);
  // lib.rs and main.rs are reachable only through a plural override.
  assert.throws(() => validateSpec({ ...base, name: 'Library', plural: 'Lib' }), /desktop shell's own/);
  assert.throws(() => validateSpec({ ...base, name: 'Entry', plural: 'Main' }), /desktop shell's own/);
});

// thick:end
// A unique field is bound beside generated locals: the native conflict check's |x| closure
// and `existing` binding, the endpoint test's `res`, and the service's `by{Unique}` lookup.
test('validateSpec rejects a unique field named after a local its conflict check declares', () => {
  for (const name of ['x', 'existing', 'res']) {
    assert.throws(
      () => validateSpec({ ...base, fields: [{ name, type: 'string', label: 'X', unique: true }] }),
      /conflict check already declares/,
      name,
    );
  }
  assert.throws(
    () => validateSpec({ ...base, fields: [
      { name: 'email', type: 'string', label: 'Email', unique: true },
      { name: 'byEmail', type: 'string', label: 'By email' },
    ] }),
    /conflict check already declares/,
  );
});

test('validateSpec still accepts x and y on an entity with no unique field', () => {
  assert.doesNotThrow(() => validateSpec({ ...base, name: 'Point', fields: [
    { name: 'x', type: 'number', label: 'X' },
    { name: 'y', type: 'number', label: 'Y' },
  ] }));
});

// Most -o nouns take -s (todos, photos, memos); the few that take -es are the exception.
test('deriveNames pluralizes -o nouns with -s unless they are known -es nouns', () => {
  const plural = (name: string) => deriveNames(validateSpec({ ...base, name })).pascalPlural;
  assert.equal(plural('Todo'), 'Todos');
  assert.equal(plural('Photo'), 'Photos');
  assert.equal(plural('Memo'), 'Memos');
  assert.equal(plural('Hero'), 'Heroes');
  assert.equal(plural('Potato'), 'Potatoes');
  assert.equal(plural('SuperHero'), 'SuperHeroes');
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

test('validateSpec rejects a field named after its own entity', () => {
  // C# forbids a member named after its enclosing type (CS0542), and the native store's
  // `let note = ...` local would shadow the `note` parameter it then assigns from.
  assert.throws(
    () => validateSpec({ ...base, name: 'Note', fields: [{ name: 'note', type: 'string', label: 'Note' }] }),
    /named after the entity/,
  );
  assert.throws(
    () => validateSpec({ ...base, name: 'PurchaseOrder', fields: [{ name: 'purchaseOrder', type: 'string', label: 'PO' }] }),
    /named after the entity/,
  );
});

test('validateSpec rejects a field named after the entity plural', () => {
  // The native store's save() binds the locked map to `let mut notes`, shadowing a `notes` parameter.
  assert.throws(
    () => validateSpec({ ...base, name: 'Note', fields: [{ name: 'notes', type: 'string', label: 'Notes' }] }),
    /named after the entity/,
  );
});

test('validateSpec rejects the identifiers the emitted code already declares', () => {
  for (const name of ['store', 'ct', 'current', 'existingId']) {
    assert.throws(
      () => validateSpec({ ...base, fields: [{ name, type: 'string', label: 'X' }] }),
      /generated code already declares/,
      name,
    );
  }
});

test('validateSpec rejects an entity name the generated .NET code cannot tell apart', () => {
  // Task collides with the implicit System.Threading.Tasks using; Result and Error with the Domain's own types.
  for (const name of ['Task', 'File', 'Result', 'Error', 'ErrorKind']) {
    assert.throws(() => validateSpec({ ...base, name }), /clashes with a type/, name);
  }
});

test('validateSpec rejects State, which the desktop command adapters already import', () => {
  assert.throws(() => validateSpec({ ...base, name: 'State' }), /clashes with a type/);
});

test('validateSpec accepts a camelCase plural field on a multi-word entity', () => {
  // The native store's map local is snake_case (stock_items); a camelCase field cannot spell it.
  assert.doesNotThrow(() => validateSpec({
    ...base, name: 'StockItem', fields: [{ name: 'stockItems', type: 'number', label: 'Stock items' }],
  }));
});
