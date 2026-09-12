# Recipe: add a feature the Jig way

Adding a feature means copying the `users` slice shape end to end, not inventing a new one. Every step below points at the reference file to copy. Work test-first, and commit at a green gate.

## 0. Discover first

Run the discovery gate from `CLAUDE.md`: read `.bob/registry/CATALOG.md` for the area, then `workspace/symbol` for the concept. Reuse or extend an existing capability before creating a new one. Creating something that overlaps an existing capability is a defect; record an ADR if you must.

## 1. Contract

Add the operations to the registry in `frontend/src/app/contracts/operations.ts` (the `Operations` interface) and their HTTP route and IPC command to `frontend/src/app/contracts/registry.ts` (`ROUTES` and `COMMANDS`). The mapped types force both wires to cover every operation. Response types must resolve to generated DTOs, so define the shapes on the API first (step 2) and run `npm run codegen`.

See `docs/architecture/conduit.md`.

## 2. Backend (TDD)

Copy the `users` backend:

- Domain entity in `services/api/src/Jig.Domain` (like `User.cs`).
- Application use-cases in `services/api/src/Jig.Application` returning `Result<T>` (like `UserService.cs`), with a persistence port (like `IUserRepository.cs`). Unit-test with FakeItEasy doubles first (like `UserServiceTests.cs`).
- Infrastructure implementation with EF Core (like `UserRepository.cs`, `JigDbContext.cs`).
- Endpoints in `services/api/src/Jig.Api` deriving from `ResultEndpoint` (like `GetUserEndpoint.cs`), a validator (like `SaveUserValidator.cs`), and a mapper (like `UserMapping.cs`). Integration-test through the FastEndpoints test host against in-memory SQLite (like `UsersEndpointTests.cs`).

Then `npm run codegen` so the frontend DTOs regenerate.

<!-- thick:start -->
## 3. Rust (TDD)

Add commands whose `req`/`res` match the registry in `apps/desktop/src-tauri/src/commands.rs`, delegating to a store like `users.rs`. Write the store tests first; keep the commands thin. Register the commands in `src/lib.rs`.

<!-- thick:end -->
## 4. Frontend (TDD)

- Repository in `frontend/src/app/repositories` that speaks operations only (like `user.repository.ts`).
- ViewModel exposing signals (like `user-list.view-model.ts`), tested with a fake `Transport` (like `user-list.view-model.spec.ts`).
- A zod schema for any form (like `user-form.schema.ts`); the model type is `z.infer`. Render it through the shared `SchemaForm`; never hand-wire `FormControl`s. See `docs/architecture/forms.md`.
- A view that binds only to the ViewModel and the renderer (like `user-list.view.ts`), wired into `app.routes.ts`.

## 5. Annotate and regenerate

Give every new reusable unit a capability block in its doc comment (see CONTRIBUTING.md), then run `npm run catalog`.

## 6. Commit at green

Run `npm run verify`. When it is green, commit with a Conventional Commits message scoped to the area (`transport`, `forms`, `contracts`, `api`, `shell`, `catalog`, `tools`, `repo`).
