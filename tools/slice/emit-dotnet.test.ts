import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSpec } from './spec.ts';
import { emitDotnet } from './emit-dotnet.ts';

const spec = validateSpec({
  name: 'Order', icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
});
const files = emitDotnet(spec, 'Jig');
const at = (suffix: string) => files.find((f) => f.path.endsWith(suffix))!;

test('emits all ten .NET files at the right paths', () => {
  assert.equal(files.length, 10);
  assert.ok(at('Jig.Domain/Order.cs'));
  assert.ok(at('Jig.Api/Orders/ListOrdersEndpoint.cs'));
  assert.ok(at('Jig.Infrastructure/OrderRepository.cs'));
});

test('the domain entity carries Id plus every field with its C# type', () => {
  const cs = at('Domain/Order.cs').text;
  assert.match(cs, /namespace Jig\.Domain;/);
  assert.match(cs, /public Guid Id \{ get; set; \}/);
  assert.match(cs, /public required string Reference \{ get; set; \}/);
  assert.match(cs, /public required decimal Total \{ get; set; \}/);
});

test('the domain entity references nothing outside Domain (DR0001)', () => {
  assert.doesNotMatch(at('Domain/Order.cs').text, /^using Jig\.(Application|Infrastructure|Api)/m);
});

test('the port gains a lookup for the unique field only', () => {
  const cs = at('IOrderRepository.cs').text;
  assert.match(cs, /Task<Order\?> GetByReferenceAsync\(string reference, CancellationToken ct\);/);
  assert.doesNotMatch(cs, /GetByTotalAsync/);
});

test('the service returns Conflict on a duplicate unique value', () => {
  const cs = at('OrderService.cs').text;
  assert.match(cs, /GetByReferenceAsync\(reference, ct\)/);
  assert.match(cs, /Error\.Conflict\(/);
  assert.match(cs, /Error\.NotFound\(/);
});

test('a slice with no unique field emits no lookup and no Conflict', () => {
  const plain = emitDotnet(validateSpec({
    name: 'Note', icon: 'lucideFile', fields: [{ name: 'body', type: 'string', label: 'Body' }],
  }), 'Jig');
  const port = plain.find((f) => f.path.endsWith('INoteRepository.cs'))!.text;
  const svc = plain.find((f) => f.path.endsWith('NoteService.cs'))!.text;
  assert.doesNotMatch(port, /GetBy\w+Async\(string/);
  assert.doesNotMatch(svc, /Error\.Conflict/);
});

test('the validator derives rules from the field spec', () => {
  const cs = at('SaveOrderValidator.cs').text;
  assert.match(cs, /RuleFor\(x => x\.Reference\)\.NotEmpty\(\);/);
  assert.doesNotMatch(cs, /EmailAddress/);
});

test('an email-format field validates as an email', () => {
  const withEmail = emitDotnet(validateSpec({
    name: 'Contact', icon: 'lucideUser',
    fields: [{ name: 'email', type: 'string', label: 'Email', format: 'email' }],
  }), 'Jig');
  assert.match(withEmail.find((f) => f.path.endsWith('SaveContactValidator.cs'))!.text,
    /RuleFor\(x => x\.Email\)\.NotEmpty\(\)\.EmailAddress\(\);/);
});

test('the product namespace is not hard-coded to Jig', () => {
  const cloned = emitDotnet(spec, 'AcmePortal');
  assert.match(cloned.find((f) => f.path.endsWith('Domain/Order.cs'))!.text, /namespace AcmePortal\.Domain;/);
});

test('endpoints route on the plural and carry the capability annotations', () => {
  assert.match(at('ListOrdersEndpoint.cs').text, /Get\("\/orders"\);/);
  assert.match(at('GetOrderEndpoint.cs').text, /Get\("\/orders\/\{id\}"\);/);
  assert.match(at('SaveOrderEndpoint.cs').text, /Post\("\/orders"\);/);
});

test('a boolean field emits no NotEmpty rule', () => {
  const withBool = emitDotnet(validateSpec({
    name: 'Task', icon: 'lucideCheck',
    fields: [{ name: 'active', type: 'boolean', label: 'Active' }],
  }), 'Jig');
  const cs = withBool.find((f) => f.path.endsWith('SaveTaskValidator.cs'))!.text;
  assert.doesNotMatch(cs, /NotEmpty/);
  assert.doesNotMatch(cs, /RuleFor/);
});

test('a mixed spec validates only the string and number fields, not the boolean one', () => {
  const mixed = emitDotnet(validateSpec({
    name: 'Task', icon: 'lucideCheck',
    fields: [
      { name: 'title', type: 'string', label: 'Title' },
      { name: 'priority', type: 'number', label: 'Priority' },
      { name: 'done', type: 'boolean', label: 'Done' },
    ],
  }), 'Jig');
  const cs = mixed.find((f) => f.path.endsWith('SaveTaskValidator.cs'))!.text;
  assert.match(cs, /RuleFor\(x => x\.Title\)\.NotEmpty\(\);/);
  assert.match(cs, /RuleFor\(x => x\.Priority\)\.NotEmpty\(\);/);
  assert.doesNotMatch(cs, /x\.Done/);
});

test('an all-boolean spec still emits a well-formed validator', () => {
  const allBool = emitDotnet(validateSpec({
    name: 'Flag', icon: 'lucideFlag',
    fields: [
      { name: 'enabled', type: 'boolean', label: 'Enabled' },
      { name: 'archived', type: 'boolean', label: 'Archived' },
    ],
  }), 'Jig');
  const cs = allBool.find((f) => f.path.endsWith('SaveFlagValidator.cs'))!.text;
  assert.match(cs, /public SaveFlagValidator\(\)\s*\{\s*\}/);
  assert.doesNotMatch(cs, /RuleFor/);
});

// The exemplar (UserRepository.cs) sorts by Name, and the design spec's classification
// table says {E}Repository.cs varies by "unique field, sort field (first field)". Sorting
// by Id renders every generated list in Guid order: arbitrary to a reader and reshuffling
// as rows are added. It compiles and it passes, which is what makes it worth a test.
test('the repository lists in first-field order, not Guid order', () => {
  // Infrastructure/, not the bare name: IOrderRepository.cs ends with it too.
  const cs = at('Infrastructure/OrderRepository.cs').text;
  assert.match(cs, /GetAllAsync\(CancellationToken ct\)\n\s+=> await _db\.Orders\.AsNoTracking\(\)\.OrderBy\(x => x\.Reference\)\.ToListAsync\(ct\);/);
  assert.doesNotMatch(cs, /OrderBy\(x => x\.Id\)/);
});

test('a boolean first field still produces a compiling sort', () => {
  const boolFirst = emitDotnet(validateSpec({
    name: 'Flag', icon: 'lucideFlag',
    fields: [
      { name: 'enabled', type: 'boolean', label: 'Enabled' },
      { name: 'title', type: 'string', label: 'Title' },
    ],
  }), 'Jig');
  assert.match(boolFirst.find((f) => f.path.endsWith('Infrastructure/FlagRepository.cs'))!.text, /OrderBy\(x => x\.Enabled\)/);
});

// The label lands inside a C# interpolated string, where a brace opens a hole and a
// double quote ends the literal. Both break the build, far from their cause.
test('a label with a quote or a brace is escaped for the C# interpolated conflict message', () => {
  const awkward = emitDotnet(validateSpec({
    name: 'Owner', icon: 'lucideUser',
    fields: [{ name: 'tag', type: 'string', label: 'The "{x}" tag', unique: true }],
  }), 'Jig');
  const cs = awkward.find((f) => f.path.endsWith('OwnerService.cs'))!.text;
  assert.ok(cs.includes(String.raw`$"The \"{{x}}\" tag {tag} is already in use."`), cs);
});
