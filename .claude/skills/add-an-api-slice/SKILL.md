---
name: add-an-api-slice
description: Use when adding or changing anything in the .NET API — a new endpoint, a use-case, a persistence port, an EF Core repository, a validator, or a DTO the frontend will consume. Covers generating the CRUD layers rather than writing them, the four-project layering (Domain, Application, Infrastructure, Api), the Result envelope that expected failures travel in, and the codegen handoff. Reach for this on "add an endpoint", "new API route", "add a use-case", "persist X", "add a validator", "FastEndpoints", "EF Core", "Result<T>", or before creating any file under services/api/.
---

# Add an API slice

## Where you are

This is the .NET half of `.claude/skills/add-a-feature/SKILL.md`. Nothing downstream of it — the contract, the ViewModel, the screen — can be written until `npm run codegen` has run against the endpoints. Finish here, run codegen, then hand off; do not reach ahead into the frontend from this skill.

## Do not hand-write the CRUD layers

`npm run slice` emits the domain entity, the use-case with its persistence port, the EF Core repository, the list/get/save endpoints, the validator, the mapper, and both test files — then registers all of it in `ApplicationModule`, `InfrastructureModule` and the DbContext, builds, and runs codegen. See `.claude/skills/add-a-feature/SKILL.md`.

Come here for what it does not emit: behavior beyond create/read/list, a rule a validator has to enforce, an endpoint with a shape of its own.

## Discover first

The CLAUDE.md prime directive, for this layer:

1. Read `.bob/registry/CATALOG.md` for the `api.*` capability prefix — the .NET half of the catalog, and the fastest way to see what use-cases, ports, and endpoints already exist.
2. LSP-search the concept via workspace-symbol before reaching for grep.
3. Reuse or extend what already exists; a second implementer of the same capability is a defect, not a shortcut.
4. If you still create something that overlaps, record why in an ADR under `.bob/adr/`.

## The shape to copy

The `users` slice is the exemplar, and it is what the generator emits: `services/api/src/Jig.Domain/User.cs` outward through `services/api/src/Jig.Application/UserService.cs`, `services/api/src/Jig.Infrastructure/UserRepository.cs`, and `services/api/src/Jig.Api/Users/GetUserEndpoint.cs`. Read the slice you already have rather than inventing a shape.

"Repository" is overloaded across this codebase's two halves. Here, in the .NET slice, a repository is the real pattern: a persistence port over an aggregate, sitting behind `IUserRepository` and implemented in Infrastructure. That is not the frontend's `UserOperations` facade, which speaks operations over a transport, not persistence over an aggregate — do not let the shared word collapse the two.

## The sequence (TDD)

For behavior the generator did not emit. Red-green-refactor at each of the two boundaries this slice crosses — the use-case boundary and the endpoint boundary.

**1.** Failing unit test first, in the shape of `services/api/tests/Jig.Application.Tests/UserServiceTests.cs`, exercising the use-case against a FakeItEasy double of the persistence port.
**2.** `dotnet test services/api/Jig.sln --nologo -v q` — see it fail.
**3.** Write the use-case, returning `Result<T>`, plus whatever the domain and the port need.
**4.** See it pass.
**5.** Failing integration test against the FastEndpoints test host on in-memory SQLite, in the shape of the tests under `services/api/tests/`.
**6.** Write the endpoint deriving from `ResultEndpoint`, the validator, the mapper, the repository method.
**7.** See it pass.
**8.** `npm run codegen` so the frontend DTOs regenerate from the new or changed endpoint.

**Assert the `Result` envelope, not a thrown exception, for every expected failure at both levels.** An expected failure is a value here; exceptions are for the unexpected.

Extend the generated test classes rather than starting parallel ones. `.bob/adr/0015-generated-slices-satisfy-tdd-at-the-generator.md` covers why generated tests arrive green and are not rewritten.

## What the hooks will say

`guard-ruleset` denies edits to `services/api/src/Directory.Build.props` and to the analyzer's layer map outright. A denial means the layer dependency you just wrote is wrong — fix the dependency, not the guard. See `.bob/adr/0009-architecture-rules-are-compiler-errors.md` for why this is a compiler-enforced gate rather than a convention.

## Rules that bite here

The Roslyn layer rules fire on a compile, not a lint pass, so they catch a wrong dependency the moment the slice builds: `docs/architecture/rules/DR0001.md`, `docs/architecture/rules/DR0002.md`, `docs/architecture/rules/DR0003.md`.

## Before you commit

Annotate the persistence port and the use-case with the C# XML doc form — `<capability>`, `<intent>`, `<reuse>` — then `npm run catalog`, then `npm run verify`. Commit only at green.
