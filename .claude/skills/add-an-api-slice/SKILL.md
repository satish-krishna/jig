---
name: add-an-api-slice
description: Use when adding or changing anything in the .NET API — a new endpoint, a use-case, a persistence port, an EF Core repository, a validator, or a DTO the frontend will consume. Covers the four-project layering (Domain, Application, Infrastructure, Api), the Result envelope that expected failures travel in, the FastEndpoints shapes to copy, and the integration-test host. Reach for this on "add an endpoint", "new API route", "add a use-case", "persist X", "add a validator", "FastEndpoints", "EF Core", "Result<T>", or before creating any file under services/api/.
---

# Add an API slice

## Where you are

This is step 1 of `.claude/skills/add-a-feature/SKILL.md`: the .NET slice, built domain outward to the endpoint. Nothing downstream of it exists yet — the frontend contract, the ViewModel, the screen — because none of it can be written until `npm run codegen` has run against the endpoint you are about to build. Finish this slice, run codegen, then hand off to the next spoke; do not reach ahead into the frontend from here.

## Discover first

The CLAUDE.md prime directive, for this layer:

1. Read `.bob/registry/CATALOG.md` for the `api.*` capability prefix — that is the .NET half of the catalog, and the fastest way to see what use-cases, ports, and endpoints already exist.
2. LSP-search the concept via workspace-symbol before reaching for grep.
3. Reuse or extend what already exists; a second implementer of the same capability is a defect, not a shortcut.
4. If you still create something that overlaps, record why in an ADR under `.bob/adr/`.

## Copy this

The `users` slice is the exemplar for every layer below. Copy its shape rather than inventing a new one:

- Domain entity: `services/api/src/Jig.Domain/User.cs`
- Application use-case: `services/api/src/Jig.Application/UserService.cs`
- Application persistence port: `services/api/src/Jig.Application/IUserRepository.cs`
- Infrastructure EF Core implementation: `services/api/src/Jig.Infrastructure/UserRepository.cs`
- Infrastructure DB context: `services/api/src/Jig.Infrastructure/JigDbContext.cs`
- Api endpoint: `services/api/src/Jig.Api/Users/GetUserEndpoint.cs`
- Api validator: `services/api/src/Jig.Api/Users/SaveUserValidator.cs`
- Api mapper: `services/api/src/Jig.Api/Users/UserMapping.cs`

"Repository" is overloaded across this codebase's two halves. Here, in the .NET slice, a repository is the real pattern: a persistence port over an aggregate, sitting behind `IUserRepository` and implemented in Infrastructure. That is not the same thing as the frontend's `UserOperations` facade, which speaks operations over a transport, not persistence over an aggregate — do not let the shared word collapse the two.

## The sequence (TDD)

Red-green-refactor, at each of the two boundaries this slice crosses: the use-case boundary and the endpoint boundary.

**1.** Write the failing unit test first, in the shape of `services/api/tests/Jig.Application.Tests/UserServiceTests.cs`, exercising the use-case against a FakeItEasy double of the persistence port.
**2.** Run `dotnet test services/api/Jig.sln --nologo -v q` and see it fail.
**3.** Add the domain entity.
**4.** Add the application use-case, returning `Result<T>`, and the persistence port it needs.
**5.** Run the test again and see it pass.
**6.** Write the failing integration test against the FastEndpoints test host on in-memory SQLite, in the shape of the tests under `services/api/tests/`.
**7.** Add the EF Core repository implementation, the endpoint deriving from `ResultEndpoint`, the validator, and the mapper.
**8.** Run the integration test again and see it pass.
**9.** Run `npm run codegen` so the frontend DTOs regenerate from the new or changed endpoint.

Assert the `Result` envelope, not a thrown exception, for every expected failure at both levels.

## What the hooks will say

`guard-ruleset` denies edits to `services/api/src/Directory.Build.props` and to the analyzer's layer map outright. A denial means the layer dependency you just wrote is wrong — fix the dependency, not the guard. See `.bob/adr/0009-architecture-rules-are-compiler-errors.md` for why this is a compiler-enforced gate rather than a convention.

## Rules that bite here

The Roslyn layer rules fire on a compile, not a lint pass, so they catch a wrong dependency the moment the slice builds: `docs/architecture/rules/DR0001.md`, `docs/architecture/rules/DR0002.md`, `docs/architecture/rules/DR0003.md`.

## Before you commit

Annotate the persistence port and the use-case with the C# XML doc form — `<capability>`, `<intent>`, `<reuse>` — then run `npm run catalog` so the annotation surfaces in `.bob/registry/CATALOG.md`, then `npm run verify` for the full gate. Commit only at green.
