// .NET production emitters for the vertical-slice generator. Ten pure functions, one per
// C# file, each reproducing the shape of the `users` reference slice (services/api/src/Jig.*)
// with the product namespace and the spec's own names substituted in. The text lives in
// tools/slice/templates/dotnet/, and this file builds the models that fill it. No disk
// access here — the CLI (a later task) decides where these EmittedFile entries land.

import type { EmittedFile, FieldSpec, SliceNames, SliceSpec } from './spec.ts';
import { deriveNames } from './spec.ts';
import { CS_TYPE, pascalField, uniqueField } from './csharp.ts';
import { interpolatedString } from './literal.ts';
import { articleFor, label } from './naming.ts';
import { renderTemplate } from './render.ts';

// ---------------------------------------------------------------------------
// services/api/src/{P}.Domain/{E}.cs — shape source: Jig.Domain/User.cs
// ---------------------------------------------------------------------------

interface EntityModel {
  product: string;
  article: string;
  noun: string;
  pascal: string;
  props: { type: string; name: string }[];
}

function entityModel(spec: SliceSpec, n: SliceNames, product: string): EntityModel {
  return {
    product,
    article: articleFor(label(n.kebab)),
    noun: label(n.kebab),
    pascal: n.pascal,
    props: spec.fields.map((f) => ({ type: CS_TYPE[f.type], name: pascalField(f.name) })),
  };
}

function emitEntity(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Domain/${n.pascal}.cs`,
    text: renderTemplate('dotnet/entity.cs.ejs', entityModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Application/I{E}Repository.cs — shape source: IUserRepository.cs
// ---------------------------------------------------------------------------

interface RepositoryPortModel extends SliceNames {
  product: string;
  lookup: { property: string; type: string; param: string } | null;
}

function repositoryPortModel(spec: SliceSpec, n: SliceNames, product: string): RepositoryPortModel {
  const unique = uniqueField(spec);
  return {
    ...n,
    product,
    lookup: unique
      ? { property: pascalField(unique.name), type: CS_TYPE[unique.type], param: unique.name }
      : null,
  };
}

function emitRepositoryPort(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Application/I${n.pascal}Repository.cs`,
    text: renderTemplate('dotnet/repository-port.cs.ejs', repositoryPortModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Application/{E}Service.cs — shape source: UserService.cs
// ---------------------------------------------------------------------------

interface ServiceModel extends SliceNames {
  product: string;
  saveParams: { type: string; name: string }[];
  assignExisting: { property: string; param: string }[];
  newFields: { property: string; param: string }[];
  conflictCheck: { property: string; param: string; message: string } | null;
}

function serviceModel(spec: SliceSpec, n: SliceNames, product: string): ServiceModel {
  const unique = uniqueField(spec);
  const fieldAssignments = spec.fields.map((f) => ({ property: pascalField(f.name), param: f.name }));
  return {
    ...n,
    product,
    saveParams: spec.fields.map((f) => ({ type: CS_TYPE[f.type], name: f.name })),
    assignExisting: fieldAssignments,
    newFields: fieldAssignments,
    conflictCheck: unique
      ? {
          property: pascalField(unique.name),
          param: unique.name,
          message: `${interpolatedString(unique.label)} {${unique.name}} is already in use.`,
        }
      : null,
  };
}

function emitService(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Application/${n.pascal}Service.cs`,
    text: renderTemplate('dotnet/service.cs.ejs', serviceModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/{E}Contracts.cs — shape source: UserContracts.cs
// ---------------------------------------------------------------------------

interface ContractsModel extends SliceNames {
  product: string;
  responseProps: { type: string; name: string; initializer: string }[];
  saveProps: { type: string; name: string; initializer: string }[];
}

function contractsModel(spec: SliceSpec, n: SliceNames, product: string): ContractsModel {
  // Non-nullable reference types (string) need an initializer to avoid a nullability
  // warning; value types (decimal, bool) do not, matching how UserResponse handles Name/Email.
  const prop = (f: FieldSpec) => ({
    type: CS_TYPE[f.type],
    name: pascalField(f.name),
    initializer: f.type === 'string' ? ' = "";' : '',
  });
  const props = spec.fields.map(prop);

  return {
    ...n,
    product,
    responseProps: props,
    saveProps: props,
  };
}

function emitContracts(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/${n.pascal}Contracts.cs`,
    text: renderTemplate('dotnet/contracts.cs.ejs', contractsModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/List{Es}Endpoint.cs — shape source: ListUsersEndpoint.cs
// services/api/src/{P}.Api/{Es}/Get{E}Endpoint.cs — shape source: GetUserEndpoint.cs
// ---------------------------------------------------------------------------

interface EndpointModel extends SliceNames {
  product: string;
}

function endpointModel(n: SliceNames, product: string): EndpointModel {
  return {
    ...n,
    product,
  };
}

function emitListEndpoint(n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/List${n.pascalPlural}Endpoint.cs`,
    text: renderTemplate('dotnet/list-endpoint.cs.ejs', endpointModel(n, product)),
  };
}

function emitGetEndpoint(n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Get${n.pascal}Endpoint.cs`,
    text: renderTemplate('dotnet/get-endpoint.cs.ejs', endpointModel(n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/Save{E}Endpoint.cs — shape source: SaveUserEndpoint.cs
// ---------------------------------------------------------------------------

interface SaveEndpointModel extends SliceNames {
  product: string;
  article: string;
  noun: string;
  saveArgs: string[];
}

function saveEndpointModel(spec: SliceSpec, n: SliceNames, product: string): SaveEndpointModel {
  return {
    ...n,
    product,
    article: articleFor(label(n.kebab)).toLowerCase(),
    noun: label(n.kebab),
    saveArgs: spec.fields.map((f) => pascalField(f.name)),
  };
}

function emitSaveEndpoint(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Save${n.pascal}Endpoint.cs`,
    text: renderTemplate('dotnet/save-endpoint.cs.ejs', saveEndpointModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/Save{E}Validator.cs — shape source: SaveUserValidator.cs
// ---------------------------------------------------------------------------

interface ValidatorModel extends SliceNames {
  product: string;
  rules: { property: string; suffix: string }[];
}

function validatorModel(spec: SliceSpec, n: SliceNames, product: string): ValidatorModel {
  // NotEmpty() compares a value type against its default: default(bool) is false and
  // default(decimal) is 0, so on either it rejects ordinary data (an unchecked checkbox, a
  // zero quantity) that the emitted zod schema accepts. Presence is already enforced by the
  // non-nullable request property, so only a string field gets a rule.
  const rules = spec.fields
    .filter((f) => f.type === 'string')
    .map((f) => ({
      property: pascalField(f.name),
      suffix: f.format === 'email' ? '.EmailAddress()' : '',
    }));

  return {
    ...n,
    product,
    rules,
  };
}

function emitValidator(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/Save${n.pascal}Validator.cs`,
    text: renderTemplate('dotnet/validator.cs.ejs', validatorModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Api/{Es}/{E}Mapping.cs — shape source: UserMapping.cs
// ---------------------------------------------------------------------------

interface MappingModel extends SliceNames {
  product: string;
  assigns: { property: string; value: string }[];
}

function mappingModel(spec: SliceSpec, n: SliceNames, product: string): MappingModel {
  return {
    ...n,
    product,
    assigns: spec.fields.map((f) => ({
      property: pascalField(f.name),
      value: `${n.camel}.${pascalField(f.name)}`,
    })),
  };
}

function emitMapping(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Api/${n.pascalPlural}/${n.pascal}Mapping.cs`,
    text: renderTemplate('dotnet/mapping.cs.ejs', mappingModel(spec, n, product)),
  };
}

// ---------------------------------------------------------------------------
// services/api/src/{P}.Infrastructure/{E}Repository.cs — shape source: UserRepository.cs
// ---------------------------------------------------------------------------

interface RepositoryModel extends SliceNames {
  product: string;
  sortKey: string;
  lookupMethod: { property: string; type: string; param: string } | null;
  assignExisting: { property: string }[];
}

function repositoryModel(spec: SliceSpec, n: SliceNames, product: string): RepositoryModel {
  const unique = uniqueField(spec);
  // The exemplar sorts by its first field, and so does the native store. The EF Core SQLite
  // provider cannot translate ORDER BY on a decimal and throws at query time, so the sort
  // runs in memory after the load; GetAllAsync loads every row regardless. A string sorts
  // ordinally: the default comparer is culture-aware, and the native store compares bytes.
  // (UTF-16 ordinal and UTF-8 byte order agree everywhere but supplementary-plane characters
  // against U+E000-U+FFFF, which is not worth a custom comparer in a template.)
  const first = spec.fields[0];
  const sortKey = `x => x.${pascalField(first.name)}${first.type === 'string' ? ', StringComparer.Ordinal' : ''}`;

  return {
    ...n,
    product,
    sortKey,
    lookupMethod: unique
      ? {
          property: pascalField(unique.name),
          type: CS_TYPE[unique.type],
          param: unique.name,
        }
      : null,
    assignExisting: spec.fields.map((f) => ({ property: pascalField(f.name) })),
  };
}

function emitRepository(spec: SliceSpec, n: SliceNames, product: string): EmittedFile {
  return {
    path: `services/api/src/${product}.Infrastructure/${n.pascal}Repository.cs`,
    text: renderTemplate('dotnet/repository.cs.ejs', repositoryModel(spec, n, product)),
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
    emitListEndpoint(n, product),
    emitGetEndpoint(n, product),
    emitSaveEndpoint(spec, n, product),
    emitValidator(spec, n, product),
    emitMapping(spec, n, product),
    emitRepository(spec, n, product),
  ];
}
