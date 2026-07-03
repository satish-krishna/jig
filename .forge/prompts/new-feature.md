# Recipe: add a feature the Jig way

> Stub. The full walkthrough is written in Phase 6, once the `users` slice exists as the pattern to copy. The steps below are the skeleton it fills in.

Adding a feature means copying the `users` slice shape end to end, not inventing a new one.

1. **Discover first.** Run the discovery gate in `CLAUDE.md`: read `.forge/registry/CATALOG.md` for the area, then `workspace/symbol` for the concept. Reuse or extend before you create.
2. **Contract.** Add the operations to the operation registry in `frontend/src/app/contracts/`. Both `ROUTES` and `COMMANDS` must carry each operation; response types resolve to generated DTOs. See `docs/architecture/conduit.md`.
3. **Backend (TDD).** Endpoints with FluentValidation and the Result envelope, backed by EF Core. Tests first, unit and integration. See CONTRIBUTING.md.
4. **Rust (TDD).** Tauri commands whose `req`/`res` match the registry. Command tests first.
5. **Frontend (TDD).** ViewModel (signals) + repository + view, tested with a fake `Transport`. Build the form from a zod schema through the shared renderer. See `docs/architecture/forms.md`.
6. **Annotate and regenerate.** Give every reusable unit a capability block; run `npm run catalog`.
7. **Commit at green** with a Conventional Commits message scoped to the area.
