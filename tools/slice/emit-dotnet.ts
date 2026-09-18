// .NET production emitters for the vertical-slice generator. Ten pure functions, one per
// C# file, each reproducing the shape of the `users` reference slice (services/api/src/Jig.*)
// with the product namespace and the spec's own names substituted in. No disk access here —
// the CLI (a later task) decides where these EmittedFile entries land.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { CS_TYPE, pascalField, uniqueField } from './csharp.ts';

/** "A" or "An", by the first sound of the noun that follows. Entity names are ordinary
 * English nouns (Order, Item, Address, ...), so a vowel-letter check is good enough. */
function articleFor(word: string): 'A' | 'An' {
  return /^[aeiou]/i.test(word) ? 'An' : 'A';
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Domain/{E}.cs — shape source: Jig.Domain/User.cs
// ---------------------------------------------------------------------------

function emitEntity(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const props = spec.fields
    .map((f) => `    public required ${CS_TYPE[f.type]} ${pascalField(f.name)} { get; set; }`)
    .join('\n');
  return {
    path: `services/api/src/${product}.Domain/${n.pascal}.cs`,
    text: `namespace ${product}.Domain;

/// <summary>${articleFor(n.camel)} ${n.camel}.</summary>
public sealed class ${n.pascal}
{
    public Guid Id { get; set; }
${props}
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Application/I{E}Repository.cs — shape source: IUserRepository.cs
// ---------------------------------------------------------------------------

function emitRepositoryPort(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const unique = uniqueField(spec);
  const lookupLine = unique
    ? `    Task<${n.pascal}?> GetBy${pascalField(unique.name)}Async(${CS_TYPE[unique.type]} ${unique.name}, CancellationToken ct);\n`
    : '';
  return {
    path: `services/api/src/${product}.Application/I${n.pascal}Repository.cs`,
    text: `using ${product}.Domain;

namespace ${product}.Application;

/// <summary>Persistence port for ${n.camelPlural}. The application depends on this abstraction;
/// Infrastructure supplies the EF Core implementation.</summary>
/// <capability>api.${n.kebab}-repository-port</capability>
/// <intent>The use-case layer owns the persistence contract it needs, not the database.</intent>
/// <reuse>Depend on I${n.pascal}Repository from application services; implement it in Infrastructure only.</reuse>
public interface I${n.pascal}Repository
{
    Task<IReadOnlyList<${n.pascal}>> GetAllAsync(CancellationToken ct);
    Task<${n.pascal}?> GetByIdAsync(Guid id, CancellationToken ct);
${lookupLine}    Task<${n.pascal}> UpsertAsync(${n.pascal} ${n.camel}, CancellationToken ct);
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Application/{E}Service.cs — shape source: UserService.cs
// ---------------------------------------------------------------------------

function emitService(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const unique = uniqueField(spec);
  const saveParams = spec.fields.map((f) => `${CS_TYPE[f.type]} ${f.name}`).join(', ');
  const assignExisting = spec.fields.map((f) => `            current.${pascalField(f.name)} = ${f.name};`).join('\n');
  const newFields = spec.fields.map((f) => `${pascalField(f.name)} = ${f.name}`).join(', ');

  const conflictCheck = unique
    ? `        var by${pascalField(unique.name)} = await _repo.GetBy${pascalField(unique.name)}Async(${unique.name}, ct);
        if (by${pascalField(unique.name)} is not null && by${pascalField(unique.name)}.Id != id)
            return Error.Conflict($"${unique.label} {${unique.name}} is already in use.");

`
    : '';

  return {
    path: `services/api/src/${product}.Application/${n.pascal}Service.cs`,
    text: `using ${product}.Domain;

namespace ${product}.Application;

/// <summary>The ${n.camel} use-cases: list, get, and save. Returns Result envelopes so
/// expected failures travel as data, not exceptions.</summary>
/// <capability>api.${n.kebab}-service</capability>
/// <intent>One cohesive place for the ${n.camel} use-case logic, independent of transport and database.</intent>
/// <reuse>Inject ${n.pascal}Service into endpoints; it speaks I${n.pascal}Repository, never EF Core directly.</reuse>
public sealed class ${n.pascal}Service
{
    private readonly I${n.pascal}Repository _repo;

    public ${n.pascal}Service(I${n.pascal}Repository repo) => _repo = repo;

    public async Task<Result<IReadOnlyList<${n.pascal}>>> ListAsync(CancellationToken ct)
        => Result<IReadOnlyList<${n.pascal}>>.Success(await _repo.GetAllAsync(ct));

    public async Task<Result<${n.pascal}>> GetAsync(Guid id, CancellationToken ct)
    {
        var ${n.camel} = await _repo.GetByIdAsync(id, ct);
        return ${n.camel} is null ? Error.NotFound($"${n.pascal} {id} was not found.") : ${n.camel};
    }

    public async Task<Result<${n.pascal}>> SaveAsync(Guid? id, ${saveParams}, CancellationToken ct)
    {
${conflictCheck}        ${n.pascal} ${n.camel};
        if (id is Guid existingId)
        {
            var current = await _repo.GetByIdAsync(existingId, ct);
            if (current is null)
                return Error.NotFound($"${n.pascal} {existingId} was not found.");
${assignExisting}
            ${n.camel} = current;
        }
        else
        {
            ${n.camel} = new ${n.pascal} { Id = Guid.NewGuid(), ${newFields} };
        }

        return await _repo.UpsertAsync(${n.camel}, ct);
    }
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/{E}Contracts.cs — shape source: UserContracts.cs
// ---------------------------------------------------------------------------

function emitContracts(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  // Non-nullable reference types (string) need an initializer to avoid a nullability
  // warning; value types (decimal, bool) do not, matching how UserResponse handles Name/Email.
  const prop = (f: FieldSpec) =>
    `    public ${CS_TYPE[f.type]} ${pascalField(f.name)} { get; set; }${f.type === 'string' ? ' = "";' : ''}`;
  const responseProps = spec.fields.map(prop).join('\n');
  const saveProps = spec.fields.map(prop).join('\n');

  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/${n.pascal}Contracts.cs`,
    text: `namespace ${product}.Api.${n.pascalPlural};

/// <summary>The ${n.camel} shape returned on the wire. This is the DTO OpenAPI describes and
/// the frontend generates its TypeScript type from, so client and API cannot disagree about it.</summary>
public sealed class ${n.pascal}Response
{
    public Guid Id { get; set; }
${responseProps}
}

/// <summary>Route request for ${n.opPrefix}.get.</summary>
public sealed class Get${n.pascal}Request
{
    public Guid Id { get; set; }
}

/// <summary>Body request for ${n.opPrefix}.save. A null Id means create; a set Id means update.</summary>
public sealed class Save${n.pascal}Request
{
    public Guid? Id { get; set; }
${saveProps}
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/List{Es}Endpoint.cs — shape source: ListUsersEndpoint.cs
// ---------------------------------------------------------------------------

function emitListEndpoint(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/List${n.pascalPlural}Endpoint.cs`,
    text: `using FastEndpoints;
using ${product}.Application;

namespace ${product}.Api.${n.pascalPlural};

/// <summary>${n.opPrefix}.list — GET ${n.route}. Returns every ${n.camel}.</summary>
public sealed class List${n.pascalPlural}Endpoint : EndpointWithoutRequest<IEnumerable<${n.pascal}Response>>
{
    private readonly ${n.pascal}Service _${n.camelPlural};

    public List${n.pascalPlural}Endpoint(${n.pascal}Service ${n.camelPlural}) => _${n.camelPlural} = ${n.camelPlural};

    public override void Configure()
    {
        Get("${n.route}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await _${n.camelPlural}.ListAsync(ct);
        await Send.OkAsync(result.Value!.Select(x => x.ToResponse()), ct);
    }
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/Get{E}Endpoint.cs — shape source: GetUserEndpoint.cs
// ---------------------------------------------------------------------------

function emitGetEndpoint(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Get${n.pascal}Endpoint.cs`,
    text: `using ${product}.Application;

namespace ${product}.Api.${n.pascalPlural};

/// <summary>${n.opPrefix}.get — GET ${n.route}/{id}. Returns one ${n.camel} or 404.</summary>
public sealed class Get${n.pascal}Endpoint : ResultEndpoint<Get${n.pascal}Request, ${n.pascal}Response>
{
    private readonly ${n.pascal}Service _${n.camelPlural};

    public Get${n.pascal}Endpoint(${n.pascal}Service ${n.camelPlural}) => _${n.camelPlural} = ${n.camelPlural};

    public override void Configure()
    {
        Get("${n.route}/{id}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Get${n.pascal}Request req, CancellationToken ct)
        => await SendResultAsync(await _${n.camelPlural}.GetAsync(req.Id, ct), x => x.ToResponse(), ct);
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/Save{E}Endpoint.cs — shape source: SaveUserEndpoint.cs
// ---------------------------------------------------------------------------

function emitSaveEndpoint(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const saveArgs = spec.fields.map((f) => `req.${pascalField(f.name)}`).join(', ');
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Save${n.pascal}Endpoint.cs`,
    text: `using ${product}.Application;

namespace ${product}.Api.${n.pascalPlural};

/// <summary>${n.opPrefix}.save — POST ${n.route}. Creates (null Id) or updates ${articleFor(n.camel).toLowerCase()} ${n.camel}.</summary>
public sealed class Save${n.pascal}Endpoint : ResultEndpoint<Save${n.pascal}Request, ${n.pascal}Response>
{
    private readonly ${n.pascal}Service _${n.camelPlural};

    public Save${n.pascal}Endpoint(${n.pascal}Service ${n.camelPlural}) => _${n.camelPlural} = ${n.camelPlural};

    public override void Configure()
    {
        Post("${n.route}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Save${n.pascal}Request req, CancellationToken ct)
        => await SendResultAsync(await _${n.camelPlural}.SaveAsync(req.Id, ${saveArgs}, ct), x => x.ToResponse(), ct);
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/Save{E}Validator.cs — shape source: SaveUserValidator.cs
// ---------------------------------------------------------------------------

function emitValidator(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  // NotEmpty() compares a value type against its default, and default(bool) is false — so a
  // boolean field would emit a rule that rejects an unchecked checkbox on every save. Booleans
  // have no meaningful presence rule, so they get no RuleFor line at all.
  const rules = spec.fields
    .filter((f) => f.type !== 'boolean')
    .map((f) => `        RuleFor(x => x.${pascalField(f.name)}).NotEmpty()${f.format === 'email' ? '.EmailAddress()' : ''};`)
    .join('\n');
  const body = rules ? `${rules}\n` : '';
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Save${n.pascal}Validator.cs`,
    text: `using FastEndpoints;
using FluentValidation;

namespace ${product}.Api.${n.pascalPlural};

/// <summary>Request-shape validation for ${n.opPrefix}.save. Runs before the handler; a failure
/// returns 400 with the field errors. Business rules (uniqueness) live in ${n.pascal}Service.</summary>
public sealed class Save${n.pascal}Validator : Validator<Save${n.pascal}Request>
{
    public Save${n.pascal}Validator()
    {
${body}    }
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/{E}Mapping.cs — shape source: UserMapping.cs
// ---------------------------------------------------------------------------

function emitMapping(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const assigns = spec.fields.map((f) => `        ${pascalField(f.name)} = ${n.camel}.${pascalField(f.name)},`).join('\n');
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/${n.pascal}Mapping.cs`,
    text: `using ${product}.Domain;

namespace ${product}.Api.${n.pascalPlural};

/// <summary>Maps the ${n.pascal} domain entity to its wire DTO. The one place that shape crossing happens.</summary>
internal static class ${n.pascal}Mapping
{
    public static ${n.pascal}Response ToResponse(this ${n.pascal} ${n.camel}) => new()
    {
        Id = ${n.camel}.Id,
${assigns}
    };
}
`,
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Infrastructure/{E}Repository.cs — shape source: UserRepository.cs
// ---------------------------------------------------------------------------

function emitRepository(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  const unique = uniqueField(spec);
  const lookupMethod = unique
    ? `
    public Task<${n.pascal}?> GetBy${pascalField(unique.name)}Async(${CS_TYPE[unique.type]} ${unique.name}, CancellationToken ct)
        => _db.${n.pascalPlural}.AsNoTracking().FirstOrDefaultAsync(x => x.${pascalField(unique.name)} == ${unique.name}, ct);
`
    : '';
  const assignExisting = spec.fields.map((f) => `            existing.${pascalField(f.name)} = ${n.camel}.${pascalField(f.name)};`).join('\n');

  return {
    path: `services/api/src/${product}.Infrastructure/${n.pascal}Repository.cs`,
    text: `using ${product}.Application;
using ${product}.Domain;
using Microsoft.EntityFrameworkCore;

namespace ${product}.Infrastructure;

/// <summary>EF Core implementation of the ${n.camel} persistence port.</summary>
/// <capability>api.${n.kebab}-repository</capability>
/// <intent>The only place that touches EF Core for ${n.camelPlural}; the application never sees a DbContext.</intent>
/// <reuse>Registered for I${n.pascal}Repository by AddInfrastructure; do not new it up directly.</reuse>
public sealed class ${n.pascal}Repository : I${n.pascal}Repository
{
    private readonly ${product}DbContext _db;

    public ${n.pascal}Repository(${product}DbContext db) => _db = db;

    public async Task<IReadOnlyList<${n.pascal}>> GetAllAsync(CancellationToken ct)
        => await _db.${n.pascalPlural}.AsNoTracking().OrderBy(x => x.Id).ToListAsync(ct);

    public Task<${n.pascal}?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.${n.pascalPlural}.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
${lookupMethod}
    public async Task<${n.pascal}> UpsertAsync(${n.pascal} ${n.camel}, CancellationToken ct)
    {
        var existing = await _db.${n.pascalPlural}.FirstOrDefaultAsync(x => x.Id == ${n.camel}.Id, ct);
        if (existing is null)
        {
            _db.${n.pascalPlural}.Add(${n.camel});
        }
        else
        {
${assignExisting}
        }

        await _db.SaveChangesAsync(ct);
        return existing ?? ${n.camel};
    }
}
`,
  };
}

/**
 * Emit the ten C# files that make up the .NET half of a vertical slice: the Domain
 * entity, the Application port and service, the six Api files (contracts, three
 * endpoints, validator, mapper), and the Infrastructure repository. `product` is the
 * .NET root namespace (read from the .csproj by the caller) — nothing here hard-codes it.
 */
export function emitDotnet(spec: SliceSpec, product: string): EmittedFile[] {
  const n = deriveNames(spec);
  return [
    emitEntity(spec, n, product),
    emitRepositoryPort(spec, n, product),
    emitService(spec, n, product),
    emitContracts(spec, n, product),
    emitListEndpoint(spec, n, product),
    emitGetEndpoint(spec, n, product),
    emitSaveEndpoint(spec, n, product),
    emitValidator(spec, n, product),
    emitMapping(spec, n, product),
    emitRepository(spec, n, product),
  ];
}
