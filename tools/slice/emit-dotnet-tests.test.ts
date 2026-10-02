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

test('a number-typed unique field gets distinct sample values across call sites', () => {
  // ApiFixture shares one SQLite database across every [Fact] in the class: if the factory's
  // sample and the duplicate test's shared value were the same literal, the two facts that
  // actually insert a row would collide on it and one would fail unpredictably.
  const t = emitDotnetTests(validateSpec({
    name: 'Ticket', icon: 'lucideTicket',
    fields: [{ name: 'seatNumber', type: 'number', label: 'Seat Number', unique: true }],
  }), 'Jig').find((f) => f.path.endsWith('TicketsEndpointTests.cs'))!.text;
  const factoryLiteral = t.match(/NewTicket\(\) => new \{ seatNumber = (\d+m) \};/)?.[1];
  const dupLiteral = t.match(/var seatNumber = (\d+m);/)?.[1];
  assert.ok(factoryLiteral, 'expected the factory to assign seatNumber a decimal literal');
  assert.ok(dupLiteral, 'expected the duplicate test to declare a seatNumber decimal literal');
  assert.notEqual(factoryLiteral, dupLiteral);
});

test('a spec with no string field emits no invalid-body test, because nothing is validated', () => {
  const t = emitDotnetTests(validateSpec({
    name: 'Reading', icon: 'lucideGauge',
    fields: [
      { name: 'celsius', type: 'number', label: 'Celsius' },
      { name: 'indoor', type: 'boolean', label: 'Indoor' },
    ],
  }), 'Jig').find((f) => f.path.endsWith('ReadingsEndpointTests.cs'))!.text;
  assert.doesNotMatch(t, /save_with_invalid_body_returns_400/);
});

// The 400 test empties every string, so EmailAddress() never ran on its own: a malformed
// address beside otherwise valid fields is the only request that proves the format rule.
test('an email field gets an endpoint test that a malformed address alone returns 400', () => {
  const t = emitDotnetTests(validateSpec({
    name: 'Contact', icon: 'lucideUser',
    fields: [
      { name: 'name', type: 'string', label: 'Name' },
      { name: 'email', type: 'string', label: 'Email', format: 'email', unique: true },
    ],
  }), 'Jig').find((f) => f.path.endsWith('ContactsEndpointTests.cs'))!.text;
  assert.match(t, /public async Task save_with_malformed_email_returns_400\(\)/);
  assert.match(t, /new \{ name = "alpha", email = "not-an-email" \}/);
});

test('a spec with no email field gets no malformed-address endpoint test', () => {
  const t = emitDotnetTests(spec, 'Jig').find((f) => f.path.endsWith('OrdersEndpointTests.cs'))!.text;
  assert.doesNotMatch(t, /malformed/);
});

test('every email field gets its own malformed-address endpoint test', () => {
  const t = emitDotnetTests(validateSpec({
    name: 'Contact', icon: 'lucideUser',
    fields: [
      { name: 'workEmail', type: 'string', label: 'Work email', format: 'email' },
      { name: 'homeEmail', type: 'string', label: 'Home email', format: 'email' },
    ],
  }), 'Jig').find((f) => f.path.endsWith('ContactsEndpointTests.cs'))!.text;
  assert.match(t, /save_with_malformed_workEmail_returns_400/);
  assert.match(t, /save_with_malformed_homeEmail_returns_400/);
});
