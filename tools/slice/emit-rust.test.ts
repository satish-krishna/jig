// Tests for the desktop shell's per-slice store emitter. This whole file is thick-only —
// a thin clone has no desktop shell to generate a store for — so its entire body sits
// behind one thick-cut marker, mirroring how tools/slice/slice.ts wraps its import of
// emitRustStore; the template's thin cut strips everything between the markers.
// thick:start
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec } from './spec.ts';
import { emitRustStore } from './emit-rust.ts';

const spec = validateSpec({
  name: 'Order', icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

test('emits the desktop store at the right path', () => {
  const file = emitRustStore(spec);
  assert.equal(file.path, 'apps/desktop/src-tauri/src/orders.rs');
});

test('the struct carries id plus every field with its native type', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /pub struct Order \{/);
  assert.match(text, /pub id: String,/);
  assert.match(text, /pub reference: String,/);
  assert.match(text, /pub total: f64,/);
});

test('the store gains a conflict check for the unique field only', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /x\.reference == reference/);
  assert.match(text, /StoreError::Conflict/);
});

test('a slice with no unique field emits no conflict check and no conflict test', () => {
  const plain = emitRustStore(validateSpec({
    name: 'Note', icon: 'lucideFile', fields: [{ name: 'body', type: 'string', label: 'Body' }],
  }));
  assert.doesNotMatch(plain.text, /is already in use\./);
  assert.doesNotMatch(plain.text, /is_conflict/);
});

test('list sorts by the first field without unwrapping a None on NaN', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /partial_cmp\(&b\.reference\)\.unwrap_or\(std::cmp::Ordering::Equal\)/);
  assert.doesNotMatch(text, /partial_cmp\([^)]*\)\.unwrap\(\)/);
});

// The map iterates in a different order on every call, so rows that tie on the first field
// would swap places between two refreshes of the same list. The API breaks ties by id too.
test('list breaks a first-field tie by id, so equal rows keep one order', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /\.unwrap_or\(std::cmp::Ordering::Equal\)\.then_with\(\|\| a\.id\.cmp\(&b\.id\)\)\);/);
});

// A camelCase identifier in the native crate draws a non_snake_case warning for every field,
// local and test name. The fields stay snake_case in source and serde renames them back,
// so the JSON on the wire is unchanged.
test('a multi-word entity and field emit snake_case source and camelCase JSON', () => {
  const { text } = emitRustStore(validateSpec({
    name: 'PurchaseOrder', icon: 'lucideReceipt',
    fields: [{ name: 'firstName', type: 'string', label: 'First name' }],
  }));
  assert.match(text, /#\[serde\(rename_all = "camelCase"\)\]\npub struct PurchaseOrder \{/);
  assert.match(text, /pub first_name: String,/);
  assert.match(text, /pub fn save\(&self, id: Option<String>, first_name: String\)/);
  assert.match(text, /let purchase_order = purchase_orders/);
  assert.match(text, /purchase_order\.first_name = first_name;/);
  assert.match(text, /fn save_creates_a_purchase_order_with_an_id\(\)/);
  assert.doesNotMatch(text, /firstName|purchaseOrder/);
});

// The store is a reusable unit like every other layer the generator emits, so it carries
// the same annotation the exemplar's store does and reaches the capability catalog.
test('the store is annotated for the capability catalog', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /\/\/\/ @capability shell\.order-store\n\/\/\/ @intent /);
});

// Without a value check, a save that dropped a field on the floor would still pass.
test('the create and update tests assert the values that were saved', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /assert_eq!\(order\.reference, "alpha"\);/);
  assert.match(text, /assert_eq!\(updated\.total, 2\.0\);/);
});

test('save assigns every field on update and constructs every field on create', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /order\.reference = reference;/);
  assert.match(text, /order\.total = total;/);
  assert.match(text, /Order \{ id: Uuid::new_v4\(\)\.to_string\(\), reference, total \};/);
});

test('the unit tests cover list, get, save, and — with a unique field — both conflict cases', () => {
  const { text } = emitRustStore(spec);
  assert.match(text, /fn list_is_empty_on_a_fresh_store\(\)/);
  assert.match(text, /fn get_unknown_id_is_not_found\(\)/);
  assert.match(text, /fn save_then_get_roundtrips\(\)/);
  assert.match(text, /fn save_duplicate_reference_on_a_different_order_is_conflict\(\)/);
  assert.match(text, /fn save_update_keeps_the_same_reference_without_conflict\(\)/);
  assert.match(text, /fn save_update_of_unknown_id_is_not_found\(\)/);
});

// The label lands inside a format! string, where a brace opens a placeholder and a double
// quote ends the literal. Both are compile errors in the generated crate, far from cause.
test('a label with a quote or a brace is escaped for the format! conflict message', () => {
  const awkward = emitRustStore(validateSpec({
    name: 'Owner', icon: 'lucideUser',
    fields: [{ name: 'tag', type: 'string', label: 'The "{x}" tag', unique: true }],
  }));
  assert.ok(awkward.text.includes(String.raw`format!("The \"{{x}}\" tag {tag} is already in use.")`), awkward.text);
});

// The test name reads as English: "a user", "an order" — the same article rule the API's doc comments use.
test('the create test name uses the right article for the entity', () => {
  assert.match(emitRustStore(spec).text, /fn save_creates_an_order_with_an_id\(\)/);
  const user = emitRustStore(validateSpec({ name: 'User', icon: 'lucideUser', fields: [{ name: 'label', type: 'string', label: 'Label' }] }));
  assert.match(user.text, /fn save_creates_a_user_with_an_id\(\)/);
});
// thick:end
