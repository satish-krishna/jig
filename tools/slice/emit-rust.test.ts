// Tests for the desktop shell's per-slice store emitter. This whole file is thick-only —
// a thin clone has no desktop shell to generate a store for — so its entire body sits
// behind one thick-cut marker, mirroring how tools/slice/slice.ts wraps its import of
// emitRustStore. See tools/init/thin.ts's marker mechanism.
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
// thick:end
