// .NET test emitters for the vertical-slice generator. Two pure functions, one per C# test
// file, reproducing the shape of the users reference slice's tests (services/api/tests/
// Jig.Application.Tests/UserServiceTests.cs and Jig.Api.Tests/UsersEndpointTests.cs) with the
// product namespace and the spec's own names substituted in. No disk access here — the CLI
// (a later task) decides where these EmittedFile entries land, and the endpoint test consumes
// the ApiFixture that already exists in every clone rather than emitting its own copy.
//
// CS_TYPE, pascalField, and uniqueField are duplicated from emit-dotnet.ts rather than
// imported: each is a two- or three-line lookup, and importing them would couple this file's
// public surface to emit-dotnet.ts's internals for no shared benefit today. Worth revisiting
// if a third emitter needs the same helpers.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';

/** C# type for each spec field type, matching CS_TYPE in emit-dotnet.ts. */
const CS_TYPE: Record<FieldSpec['type'], string> = { string: 'string', number: 'decimal', boolean: 'bool' };

/** camelCase field name -> PascalCase C# property name, e.g. "reference" -> "Reference". */
function pascalField(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The spec's one unique field, if it has one. validateSpec already guarantees at most one. */
function uniqueField(spec: SliceSpec): FieldSpec | undefined {
  return spec.fields.find((f) => f.unique === true);
}

/**
 * A source-ready C# literal for a field's sample value: a quoted string, a decimal literal,
 * or a boolean keyword. `variant` distinguishes two records in the same test. An email-format
 * field gets a syntactically valid address, because the emitted Save{E}Validator applies
 * .EmailAddress() to it and would otherwise reject the fixture.
 */
function sample(f: FieldSpec, variant: 0 | 1): string {
  if (f.type === 'number') return `${variant + 1}m`;
  if (f.type === 'boolean') return variant === 0 ? 'true' : 'false';
  if (f.format === 'email') return variant === 0 ? '"a@x.io"' : '"b@x.io"';
  return variant === 0 ? '"a"' : '"b"';
}

/**
 * An interpolated C# string literal that embeds a fresh Guid, so a value the app enforces as
 * unique never collides across endpoint test methods, which all share one ApiFixture database.
 */
function uniqueSample(f: FieldSpec): string {
  return f.format === 'email' ? '$"a-{Guid.NewGuid():N}@x.io"' : '$"a-{Guid.NewGuid():N}"';
}

// ---------------------------------------------------------------------------
// services/api/tests/{P}.Application.Tests/{E}ServiceTests.cs
// shape source: Jig.Application.Tests/UserServiceTests.cs
// ---------------------------------------------------------------------------

function emitServiceTests(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const unique = uniqueField(spec);
  const assertField = spec.fields[0];

  // Object-initializer fragment for every field at one sample variant, e.g. "Reference = "a", Total = 1m".
  const fieldInit = (variant: 0 | 1) =>
    spec.fields.map((f) => `${pascalField(f.name)} = ${sample(f, variant)}`).join(', ');
  // Positional argument list matching SaveAsync's generated signature, in field order.
  const saveArgs = (variant: 0 | 1) => spec.fields.map((f) => sample(f, variant)).join(', ');

  // The emitted SaveAsync checks the unique lookup before anything else (see emit-dotnet.ts's
  // conflictCheck), so every SaveAsync call needs it stubbed once a unique field exists.
  const uniqueStubNoConflict = unique
    ? `        A.CallTo(() => _repo.GetBy${pascalField(unique.name)}Async(A<${CS_TYPE[unique.type]}>._, A<CancellationToken>._)).Returns((${n.pascal}?)null);\n`
    : '';

  const facts: string[] = [
    `    [Fact]
    public async Task ListAsync_returns_all_${n.camelPlural}_as_success()
    {
        var ${n.camelPlural} = new List<${n.pascal}> { new() { Id = Guid.NewGuid(), ${fieldInit(0)} } };
        A.CallTo(() => _repo.GetAllAsync(A<CancellationToken>._)).Returns(${n.camelPlural});

        var result = await Sut().ListAsync(CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(${n.camelPlural});
    }`,
    `    [Fact]
    public async Task GetAsync_unknown_id_returns_NotFound()
    {
        A.CallTo(() => _repo.GetByIdAsync(A<Guid>._, A<CancellationToken>._)).Returns((${n.pascal}?)null);

        var result = await Sut().GetAsync(Guid.NewGuid(), CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.NotFound);
    }`,
    `    [Fact]
    public async Task GetAsync_known_id_returns_${n.camel}()
    {
        var ${n.camel} = new ${n.pascal} { Id = Guid.NewGuid(), ${fieldInit(1)} };
        A.CallTo(() => _repo.GetByIdAsync(${n.camel}.Id, A<CancellationToken>._)).Returns(${n.camel});

        var result = await Sut().GetAsync(${n.camel}.Id, CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(${n.camel});
    }`,
    `    [Fact]
    public async Task SaveAsync_new_${n.camel}_creates_and_returns_it()
    {
${uniqueStubNoConflict}        A.CallTo(() => _repo.UpsertAsync(A<${n.pascal}>._, A<CancellationToken>._))
            .ReturnsLazily((${n.pascal} x, CancellationToken _) => x);

        var result = await Sut().SaveAsync(null, ${saveArgs(0)}, CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value!.Id.ShouldNotBe(Guid.Empty);
        result.Value.${pascalField(assertField.name)}.ShouldBe(${sample(assertField, 0)});
        A.CallTo(() => _repo.UpsertAsync(A<${n.pascal}>.That.Matches(x => x.${pascalField(assertField.name)} == ${sample(assertField, 0)}), A<CancellationToken>._))
            .MustHaveHappenedOnceExactly();
    }`,
  ];

  // The Conflict outcome only exists when SaveAsync has a uniqueness check to trigger it.
  if (unique) {
    facts.push(`    [Fact]
    public async Task SaveAsync_duplicate_${unique.name}_returns_Conflict()
    {
        var other = new ${n.pascal} { Id = Guid.NewGuid(), ${fieldInit(1)} };
        A.CallTo(() => _repo.GetBy${pascalField(unique.name)}Async(${sample(unique, 1)}, A<CancellationToken>._)).Returns(other);

        var result = await Sut().SaveAsync(null, ${saveArgs(1)}, CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.Conflict);
        A.CallTo(() => _repo.UpsertAsync(A<${n.pascal}>._, A<CancellationToken>._)).MustNotHaveHappened();
    }`);
  }

  facts.push(`    [Fact]
    public async Task SaveAsync_update_of_unknown_id_returns_NotFound()
    {
${uniqueStubNoConflict}        A.CallTo(() => _repo.GetByIdAsync(A<Guid>._, A<CancellationToken>._)).Returns((${n.pascal}?)null);

        var result = await Sut().SaveAsync(Guid.NewGuid(), ${saveArgs(1)}, CancellationToken.None);

        result.IsSuccess.ShouldBeFalse();
        result.Error!.Kind.ShouldBe(ErrorKind.NotFound);
    }`);

  return {
    path: `services/api/tests/${product}.Application.Tests/${n.pascal}ServiceTests.cs`,
    text: `using FakeItEasy;
using Shouldly;
using ${product}.Domain;

namespace ${product}.Application.Tests;

public class ${n.pascal}ServiceTests
{
    private readonly I${n.pascal}Repository _repo = A.Fake<I${n.pascal}Repository>();
    private ${n.pascal}Service Sut() => new(_repo);

${facts.join('\n\n')}
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/tests/{P}.Api.Tests/{Es}EndpointTests.cs
// shape source: Jig.Api.Tests/UsersEndpointTests.cs (consumes the shared ApiFixture)
// ---------------------------------------------------------------------------

function emitEndpointTests(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const unique = uniqueField(spec);
  // A validator rule only exists for non-boolean fields (emit-dotnet.ts's emitValidator), so
  // the 400-on-invalid-body test only applies when at least one such field exists.
  const hasValidatedField = spec.fields.some((f) => f.type !== 'boolean');
  const roundtripField = spec.fields[0];

  // The unique field, if any, gets a Guid-embedded value so repeated factory calls across
  // endpoint tests sharing one ApiFixture database never collide on it by accident.
  const factoryProps = spec.fields
    .map((f) => `${f.name} = ${f === unique && f.type === 'string' ? uniqueSample(f) : sample(f, 0)}`)
    .join(', ');

  const facts: string[] = [
    `    [Fact]
    public async Task list_returns_200()
    {
        var res = await _client.GetAsync("${n.route}");
        res.StatusCode.ShouldBe(HttpStatusCode.OK);
    }`,
    `    [Fact]
    public async Task save_then_get_roundtrips_the_${n.camel}()
    {
        var post = await _client.PostAsJsonAsync("${n.route}", New${n.pascal}());
        post.StatusCode.ShouldBe(HttpStatusCode.OK);
        var created = await post.Content.ReadFromJsonAsync<${n.pascal}Response>();
        created!.Id.ShouldNotBe(Guid.Empty);

        var get = await _client.GetAsync($"${n.route}/{created.Id}");
        get.StatusCode.ShouldBe(HttpStatusCode.OK);
        var fetched = await get.Content.ReadFromJsonAsync<${n.pascal}Response>();
        fetched!.${pascalField(roundtripField.name)}.ShouldBe(created.${pascalField(roundtripField.name)});
    }`,
  ];

  if (hasValidatedField) {
    const invalidProps = spec.fields
      .map((f) => `${f.name} = ${f.type === 'boolean' ? 'false' : f.type === 'number' ? '0m' : '""'}`)
      .join(', ');
    facts.push(`    [Fact]
    public async Task save_with_invalid_body_returns_400()
    {
        var res = await _client.PostAsJsonAsync("${n.route}", new { ${invalidProps} });
        res.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }`);
  }

  facts.push(`    [Fact]
    public async Task get_unknown_id_returns_404()
    {
        var res = await _client.GetAsync($"${n.route}/{Guid.NewGuid()}");
        res.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }`);

  // The Conflict outcome, like on the service side, only exists when there is a unique field
  // to violate.
  if (unique) {
    const otherFields = spec.fields.filter((f) => f !== unique);
    const dupProps = (variant: 0 | 1) =>
      [...otherFields.map((f) => `${f.name} = ${sample(f, variant)}`), unique.name].join(', ');
    const uniqueLiteral = unique.type === 'string' ? uniqueSample(unique) : sample(unique, 0);
    facts.push(`    [Fact]
    public async Task save_duplicate_${unique.name}_returns_409()
    {
        var ${unique.name} = ${uniqueLiteral};
        (await _client.PostAsJsonAsync("${n.route}", new { ${dupProps(0)} })).EnsureSuccessStatusCode();

        var res = await _client.PostAsJsonAsync("${n.route}", new { ${dupProps(1)} });
        res.StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }`);
  }

  return {
    path: `services/api/tests/${product}.Api.Tests/${n.pascalPlural}EndpointTests.cs`,
    text: `using System.Net;
using System.Net.Http.Json;
using Shouldly;
using ${product}.Api.${n.pascalPlural};

namespace ${product}.Api.Tests;

public class ${n.pascalPlural}EndpointTests : IClassFixture<ApiFixture>
{
    private readonly HttpClient _client;

    public ${n.pascalPlural}EndpointTests(ApiFixture app) => _client = app.Client;

    private static object New${n.pascal}() => new { ${factoryProps} };

${facts.join('\n\n')}
}
`,
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
