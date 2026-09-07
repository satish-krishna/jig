# no-feature-inject-data

> Engine: `tools/lint/rules/no-feature-inject-data.ts`.

## What it forbids

Any file that declares a `@Component` class and also has an `ImportDeclaration` whose source matches `/\/(repositories|transport)(\/|$)/` — that is, an import path containing a `repositories/` or `transport/` path segment. The rule collects candidate import nodes as it walks the file and a separate visitor tracks whether any class in the file carries `@Component`; the two are reconciled in `Program:exit`, and the candidate imports are reported only when the file actually declares a component. A file with a matching import but no `@Component` class — a ViewModel, a repository itself, a plain helper — reports nothing.

## Why

A component reaches data through its ViewModel. The View should not know a transport or a repository exists at all — not import one, not inject one, not have an opinion on whether the wire is IPC or HTTP. `repositories/` and `transport/` are this app's only two data-access seams (`docs/architecture/conduit.md`), so a path check against those two folders is exact in both directions: it catches `inject(WIRE)` from `../transport` (a raw transport handle, not even a repository) the way a `*Service`/`*Repository` naming heuristic would not, since `WIRE` carries neither suffix, and it does not catch `MenuService` or `ThemeService`, which are UI-tier registries that happen to end in `Service` but hold no data-access code.

### Why the two-pass structure, not a report-on-every-match import visitor

A single `ImportDeclaration` visitor that reports immediately on every matching import is wrong: it cannot yet know whether the file it is looking at is a component or a ViewModel, because ESLint visits nodes in document order and an import always sits above the class that uses it. `frontend/src/app/features/users/user-list.view-model.ts` imports `UserRepository` legitimately — that import is the entire point of the ViewModel layer — and an immediate-report visitor would flag it exactly as hard as it flags a component doing the same thing. Deferring the report to `Program:exit`, once the whole file (and therefore every class in it) has been visited, is what lets the rule tell the two cases apart.

### This rule absorbs `no-presentational-inject`

An earlier design considered a `src/app/ui/` split with two inverted rules: one forbidding data imports in `ui/`, another forbidding UI-only imports in `features/`. This app has no such split — presentational components live in `showcase/`, `forms/`, and alongside `app.ts`, and the tier that actually matters for this check is not presentational-vs-container but component-vs-not. So there is one rule, one predicate (does this file declare a `@Component` and import a data path), applied to every component regardless of tier — a showcase page importing a repository directly would be caught by this rule exactly as a feature component would.

## Accepted form

    // frontend/src/app/features/users/user-list.view-model.ts
    import { UserRepository } from '../../repositories/user.repository';

    @Injectable()
    export class UserListViewModel {
      private readonly repo = inject(UserRepository);
    }

## Rejected form

    // frontend/src/app/shell/app-shell.ts
    import { WIRE } from '../transport';

    @Component({ selector: 'app-shell' })
    export class AppShell {
      protected readonly wire = inject(WIRE, { optional: true });
    }

## Known blind spots

The path check is a regex over the import specifier string, not a resolved module path: an import that reaches a repository or transport module through an intermediate re-export whose own specifier does not contain `repositories` or `transport` (a barrel file at some other path) would not match. It also reports the whole file's matching imports once every candidate is collected, not per-class — a file with two component classes and one data import reports the import once, attributed to the import node itself, not once per component class that might use it. No file in this app declares two components, so this has not mattered in practice.
