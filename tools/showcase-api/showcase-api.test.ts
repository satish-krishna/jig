import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApi, parseFile, render } from './showcase-api.ts';

/**
 * One fixture per shape a member's type can take, because the parser is a regex
 * and every defect so far has been a shape it could not express. These run
 * against parseFile rather than libs/ui on purpose: pinning them to a real
 * spartan component would make a spartan upgrade fail a test about our parser.
 *
 * Reverting the regex to its `[^>]*?` version fails four of them — nested,
 * arrow-function, inferred, and the swallow guard. The other four (plain, union,
 * multi-argument, multi-line) pass under BOTH versions, so they catch no
 * bug that has happened. They are here as a shape inventory for whoever rewrites
 * this regex next, which is a different job from catching the last regression,
 * and worth keeping only as long as they stay this cheap.
 */
const source = (members: string) => `
@Component({ selector: 'app-thing' })
export class Thing {
${members}
}`;

const typeOf = (members: string, name: string) =>
  parseFile(source(members))[0].members.find((m) => m.name === name)?.type;

// The parser is two regexes over generated TypeScript, and its first run shipped
// a real defect: the alias lookahead ran past its own statement and duplicated
// aria-label across every ARIA input. These tests exist so that class of bug
// fails here rather than in a rendered API table nobody reads closely.

test('extracts a component, its selector, and its members', () => {
  const api = buildApi();
  const checkbox = api['checkbox'];

  assert.ok(checkbox, 'checkbox missing from the generated API');
  const hlm = checkbox.find((c) => c.className === 'HlmCheckbox');
  assert.ok(hlm, 'HlmCheckbox class not found');
  assert.equal(hlm.selector, 'hlm-checkbox');

  const names = hlm.members.map((m) => m.name);
  assert.ok(names.includes('checked'), 'checked input missing');
  assert.ok(names.includes('inputId'), 'inputId input missing');
});

test('prefers the alias over the property name, because that is what a consumer binds', () => {
  const hlm = buildApi()['checkbox'].find((c) => c.className === 'HlmCheckbox')!;
  const names = hlm.members.map((m) => m.name);

  // declared as `userClass = input(..., { alias: 'class' })`
  assert.ok(names.includes('class'), "expected the alias 'class'");
  assert.ok(!names.includes('userClass'), 'leaked the internal property name');
});

test('does not read the NEXT member alias — the bug the first version shipped', () => {
  for (const [slug, classes] of Object.entries(buildApi())) {
    for (const cls of classes) {
      const names = cls.members.map((m) => m.kind + ':' + m.name);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      assert.deepEqual(dupes, [], `${slug}/${cls.className} has duplicate members: ${dupes.join(', ')}`);
    }
  }
});

test('distinguishes inputs, outputs and models', () => {
  const hlm = buildApi()['checkbox'].find((c) => c.className === 'HlmCheckbox')!;
  const kind = (name: string) => hlm.members.find((m) => m.name === name)?.kind;

  assert.equal(kind('checked'), 'input');
  assert.equal(kind('checkedChange'), 'output');
  assert.equal(kind('indeterminate'), 'model');
});

test('marks required inputs as required', () => {
  const api = buildApi();
  const required = Object.values(api)
    .flat()
    .flatMap((c) => c.members)
    .filter((m) => m.required);

  // input.required<T>() is used across the set; if none is detected the flag is dead
  assert.ok(required.length > 0, 'no required member detected anywhere');
});

test('covers the whole vendored set rather than a sample', () => {
  const api = buildApi();
  assert.ok(Object.keys(api).length > 50, `expected the full set, got ${Object.keys(api).length}`);
});

test('covers app-authored components too, not only the vendored set', () => {
  const cls = buildApi()['schema-form']?.find((c) => c.className === 'SchemaForm');

  assert.ok(cls, 'SchemaForm missing — the app source root is not being read');
  assert.equal(cls.selector, 'app-schema-form');
});

test('parses a nested generic, which no generated helm source happens to use', () => {
  const cls = buildApi()['schema-form'].find((c) => c.className === 'SchemaForm')!;
  const schema = cls.members.find((m) => m.name === 'schema');

  // input.required<z.ZodObject<z.ZodRawShape>>() — the inner `>` ended the match
  // in the first version, silently dropping the component's only required input.
  assert.ok(schema, 'the schema input was dropped');
  assert.equal(schema.required, true);
  assert.equal(schema.type, 'z.ZodObject<z.ZodRawShape>');
});

test('parses a member whose type is inferred rather than written', () => {
  const cls = buildApi()['schema-form'].find((c) => c.className === 'SchemaForm')!;

  // `input('Save')` carries no <T>; requiring one skipped the member entirely.
  assert.ok(
    cls.members.some((m) => m.name === 'submitLabel'),
    'submitLabel was dropped for having no explicit generic',
  );
});

test('reads outputs off an app component', () => {
  const cls = buildApi()['schema-form'].find((c) => c.className === 'SchemaForm')!;
  const submitted = cls.members.find((m) => m.name === 'submitted');

  assert.equal(submitted?.kind, 'output');
});

test('shape: a plain generic', () => {
  assert.equal(typeOf(`  readonly label = input<string>('x');`, 'label'), 'string');
});

test('shape: a nested generic closes on its own bracket, not the inner one', () => {
  const members = `  readonly lookup = input<Map<string, ReadonlyArray<number>>>();`;

  assert.equal(typeOf(members, 'lookup'), 'Map<string, ReadonlyArray<number>>');
});

test('shape: an arrow-function type, whose => used to end the match early', () => {
  const members = `  readonly format = input<(value: Date) => string>();`;

  assert.equal(typeOf(members, 'format'), '(value: Date) => string');
});

test('shape: a union is kept whole rather than cut at the first member', () => {
  const members = `  readonly size = input<'sm' | 'md' | 'lg'>('md');`;

  assert.equal(typeOf(members, 'size'), "'sm' | 'md' | 'lg'");
});

test('shape: a multi-argument generic, as the transform inputs use', () => {
  const members = `  readonly disabled = input<boolean, BooleanInput>(false, { transform: booleanAttribute });`;

  assert.equal(typeOf(members, 'disabled'), 'boolean, BooleanInput');
});

test('shape: an inferred type reports unknown instead of dropping the member', () => {
  assert.equal(typeOf(`  readonly submitLabel = input('Save');`, 'submitLabel'), 'unknown');
});

test('shape: a generic broken across lines', () => {
  const members = `  readonly config = input<{
    retries: number;
  }>();`;

  assert.match(typeOf(members, 'config') ?? '', /retries: number/);
});

test('one member never swallows the next, whatever their shapes', () => {
  const members = [
    `  readonly plain = input('Save');`,
    `  readonly generic = input<string>('x');`,
    `  readonly nested = input<Partial<Record<string, number>>>();`,
    `  readonly changed = output<void>();`,
  ].join('\n');
  const parsed = parseFile(source(members))[0].members;

  assert.deepEqual(
    parsed.map((m) => m.name),
    ['plain', 'generic', 'nested', 'changed'],
  );
  assert.deepEqual(
    parsed.map((m) => m.type),
    ['unknown', 'string', 'Partial<Record<string, number>>', 'void'],
  );
});

test('renders a file that declares its own generated-ness', () => {
  const out = render({ button: [{ className: 'HlmButton', selector: 'button[hlmBtn]', members: [] }] });

  assert.match(out, /GENERATED by tools\/showcase-api/);
  assert.match(out, /do not edit/i);
  assert.match(out, /HlmButton/);
});
