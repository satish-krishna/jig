import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec } from './spec.ts';
import { emitDotnetTests } from './emit-dotnet-tests.ts';

const spec = validateSpec({
  name: 'Order', icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});

test('emits a service test per use-case outcome', () => {
  const t = emitDotnetTests(spec, 'Jig').find((f) => f.path.endsWith('OrderServiceTests.cs'))!.text;
  assert.match(t, /public class OrderServiceTests/);
  assert.match(t, /ListAsync_returns_all_\w+_as_success/);
  assert.match(t, /GetAsync_unknown_id_returns_NotFound/);
  assert.match(t, /SaveAsync_duplicate_reference_returns_Conflict/);
});

test('a slice with no unique field emits no conflict test', () => {
  const t = emitDotnetTests(validateSpec({
    name: 'Note', icon: 'lucideFile', fields: [{ name: 'body', type: 'string', label: 'Body' }],
  }), 'Jig').find((f) => f.path.endsWith('NoteServiceTests.cs'))!.text;
  assert.doesNotMatch(t, /Conflict/);
});

test('email fields get a valid sample so the validator does not reject the fixture', () => {
  const t = emitDotnetTests(validateSpec({
    name: 'Contact', icon: 'lucideUser',
    fields: [{ name: 'email', type: 'string', label: 'Email', format: 'email' }],
  }), 'Jig').find((f) => f.path.endsWith('ContactsEndpointTests.cs'))!.text;
  assert.match(t, /"\w+@[\w.]+"/);
});

test('numeric fields use a decimal literal', () => {
  const t = emitDotnetTests(spec, 'Jig').find((f) => f.path.endsWith('OrderServiceTests.cs'))!.text;
  assert.match(t, /Total = 1m/);
});
