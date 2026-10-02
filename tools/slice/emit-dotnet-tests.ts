// .NET test emitters for the vertical-slice generator. Two pure functions, one per C# test
// file, reproducing the shape of the users reference slice's tests (services/api/tests/
// Jig.Application.Tests/UserServiceTests.cs and Jig.Api.Tests/UsersEndpointTests.cs) with the
// product namespace and the spec's own names substituted in. No disk access here — the CLI
// (a later task) decides where these EmittedFile entries land, and the endpoint test consumes
// the ApiFixture that already exists in every clone rather than emitting its own copy.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { CS_TYPE, pascalField, uniqueField } from './csharp.ts';
import { renderTemplate } from './render.ts';

/**
 * A source-ready C# literal for a field's sample value: a quoted string, a decimal literal,
 * or a boolean keyword. `variant` distinguishes two records in the same test. An email-format
 * field gets a syntactically valid address, because the emitted Save{E}Validator applies
 * .EmailAddress() to it and would otherwise reject the fixture.
 */
function sample(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return `${variant + 1}m`;
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? '"alpha@x.io"' : '"bravo@x.io"';
  return variant === 0 ? '"alpha"' : '"bravo"';
}

/**
 * A C# literal for a unique field's sample value, distinct per call site: `slot` 0 is the
 * factory's value, `slot` 1 is the duplicate test's shared value. ApiFixture shares one
 * database across every [Fact] in the class, so the two facts that actually insert a row (the
 * roundtrip fact via the factory, and the duplicate-value fact) must not pick the same value
 * for a field the app enforces as unique, or one of them fails unpredictably. A string field
 * gets a fresh Guid at runtime, which is unique regardless of slot; a number field gets a fixed
 * literal offset by slot, since a compile-time constant is enough — no run-time randomness is
 * needed to keep two source locations apart. validateSpec rejects a unique boolean field, so
 * this function never has to make one distinct.
 */
function uniqueSample(f: FieldSpec, slot: 0 | 1): string {
  if (f.type === 'number') return `${9001 + slot}m`;
  return f.format === 'email' ? '$"alpha-{Guid.NewGuid():N}@x.io"' : '$"alpha-{Guid.NewGuid():N}"';
}

// ---------------------------------------------------------------------------
// services/api/tests/{P}.Application.Tests/{E}ServiceTests.cs
// shape source: Jig.Application.Tests/UserServiceTests.cs
// ---------------------------------------------------------------------------

interface ServiceTestsModel {
  product: string;
  pascal: string;
  camelPlural: string;
  camel: string;
  fieldInit0: string;
  fieldInit1: string;
  saveArgs0: string;
  saveArgs1: string;
  assertFieldProperty: string;
  assertFieldValue: string;
  unique: boolean;
  uniqueName: string;
  uniquePropertyName: string;
  uniqueCsType: string;
  uniqueSampleVariant1: string;
}

function serviceTestsModel(spec: SliceSpec, n: SliceNames, product: string): ServiceTestsModel {
  const unique = uniqueField(spec);
  const assertField = spec.fields[0];

  // Object-initializer fragment for every field at one sample variant, e.g. "Reference = "alpha", Total = 1m".
  const fieldInit = (variant: 0 | 1) =>
    spec.fields.map((f) => `${pascalField(f.name)} = ${sample(f, variant)}`).join(', ');
  // Positional argument list matching SaveAsync's generated signature, in field order.
  const saveArgs = (variant: 0 | 1) => spec.fields.map((f) => sample(f, variant)).join(', ');

  return {
    product,
    pascal: n.pascal,
    camelPlural: n.camelPlural,
    camel: n.camel,
    fieldInit0: fieldInit(0),
    fieldInit1: fieldInit(1),
    saveArgs0: saveArgs(0),
    saveArgs1: saveArgs(1),
    assertFieldProperty: pascalField(assertField.name),
    assertFieldValue: sample(assertField, 0),
    unique: !!unique,
    uniqueName: unique?.name || '',
    uniquePropertyName: unique ? pascalField(unique.name) : '',
    uniqueCsType: unique ? CS_TYPE[unique.type] : '',
    uniqueSampleVariant1: unique ? sample(unique, 1) : '',
  };
}

function emitServiceTests(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/tests/${product}.Application.Tests/${n.pascal}ServiceTests.cs`,
    text: renderTemplate('dotnet-tests/service-tests.cs.ejs', serviceTestsModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/tests/{P}.Api.Tests/{Es}EndpointTests.cs
// shape source: Jig.Api.Tests/UsersEndpointTests.cs (consumes the shared ApiFixture)
// ---------------------------------------------------------------------------

interface EndpointTestsModel {
  product: string;
  pascalPlural: string;
  pascal: string;
  camel: string;
  route: string;
  factoryProps: string;
  roundtripField: string;
  hasValidatedField: boolean;
  invalidProps: string;
  emailFacts: { name: string; props: string }[];
  unique: boolean;
  uniqueName: string;
  uniqueLiteral: string;
  dupProps0: string;
  dupProps1: string;
}

function endpointTestsModel(spec: SliceSpec, n: SliceNames, product: string): EndpointTestsModel {
  const unique = uniqueField(spec);
  // Mirrors emit-dotnet.ts's emitValidator rule-emission predicate (`f.type === 'string'`):
  // a validator rule only exists for a string field, so the 400-on-invalid-body test only
  // applies when at least one such field exists. This is not a new structural branch — it
  // tracks the one Task 2 already made in the production code being tested.
  const hasValidatedField = spec.fields.some((f) => f.type === 'string');
  const roundtripField = spec.fields[0];

  // The unique field, if any, gets its slot-0 value here so it cannot collide with the
  // duplicate test's slot-1 value across facts sharing one ApiFixture database.
  const factoryProps = spec.fields
    .map((f) => `${f.name} = ${f === unique ? uniqueSample(f, 0) : sample(f, 0)}`)
    .join(', ');

  // Invalid props for the bad-request test: boolean→false, number→0m, string→""
  const invalidProps = spec.fields
    .map((f) => `${f.name} = ${f.type === 'boolean' ? 'false' : f.type === 'number' ? '0m' : '""'}`)
    .join(', ');

  // Email field malformed tests: one per email field
  const emailFacts = spec.fields
    .filter((f) => f.format === 'email')
    .map((emailField) => {
      const malformedProps = spec.fields
        .map((f) => `${f.name} = ${f === emailField ? '"not-an-email"' : sample(f, 0)}`)
        .join(', ');
      return { name: emailField.name, props: malformedProps };
    });

  // Duplicate field test props
  let dupProps0 = '';
  let dupProps1 = '';
  if (unique) {
    const otherFields = spec.fields.filter((f) => f !== unique);
    // The unique field's own entry has no "= value": it is the projection-initializer shorthand
    // `new { x }`, which C# treats as `new { x = x }` against the local variable declared below.
    dupProps0 = [...otherFields.map((f) => `${f.name} = ${sample(f, 0)}`), unique.name].join(', ');
    dupProps1 = [...otherFields.map((f) => `${f.name} = ${sample(f, 1)}`), unique.name].join(', ');
  }

  return {
    product,
    pascalPlural: n.pascalPlural,
    pascal: n.pascal,
    camel: n.camel,
    route: n.route,
    factoryProps,
    roundtripField: pascalField(roundtripField.name),
    hasValidatedField,
    invalidProps,
    emailFacts,
    unique: !!unique,
    uniqueName: unique?.name || '',
    uniqueLiteral: unique ? uniqueSample(unique, 1) : '',
    dupProps0,
    dupProps1,
  };
}

function emitEndpointTests(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/tests/${product}.Api.Tests/${n.pascalPlural}EndpointTests.cs`,
    text: renderTemplate('dotnet-tests/endpoint-tests.cs.ejs', endpointTestsModel(spec, n, product)),
  };
}

/**
 * Emit the two C# test files that accompany a generated slice: the Application-layer use-case
 * tests (FakeItEasy double of the repository port) and the Api-layer endpoint tests (FastEndpoints
 * test host on in-memory SQLite, via the shared ApiFixture). `product` is the .NET root
 * namespace — nothing here hard-codes it.
 */
export function emitDotnetTests(spec: SliceSpec, product: string): EmittedFile[] {
  const n = deriveNames(spec);
  return [emitServiceTests(spec, n, product), emitEndpointTests(spec, n, product)];
}
