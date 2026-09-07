# no-unprovided-view-model

> Engine: `tools/lint/rules/no-unprovided-view-model.ts`.

## What it forbids

A `@Component` class that calls `inject(XViewModel)` — where `XViewModel` is an identifier ending in `ViewModel` — without listing that same identifier in its own `@Component({ providers: [...] })` array. The check walks up from the `inject(...)` call to its enclosing class via `classOf`, reads that class's `@Component` metadata, and looks for the injected name in the `providers` array literal.

## Why

This is the other half of the scoping `no-root-provided-view-model` protects from the opposite direction. A component-scoped ViewModel (one with no `providedIn: 'root'`, per that rule) only resolves correctly if the component that injects it also provides it: Angular's DI walks up the injector tree from the component, and without a `providers: [XViewModel]` entry on the component itself, `inject(XViewModel)` either resolves to whatever ancestor happens to provide one (silently sharing an instance nobody intended to share) or throws at runtime if none exists. Both outcomes defeat the point of a component-scoped ViewModel, and neither is caught by TypeScript — `inject()` type-checks fine regardless of what `providers` says.

`frontend/src/app/features/users/user-list.view.ts` is the reference shape: `providers: [UserListViewModel]` sits directly alongside `protected readonly vm = inject(UserListViewModel);` in the same class.

## Accepted form

    // frontend/src/app/features/users/user-list.view.ts
    @Component({
      selector: 'app-user-list',
      providers: [UserListViewModel],
    })
    export class UserListView {
      protected readonly vm = inject(UserListViewModel);
    }

## Rejected form

    @Component({ selector: 'app-x' }) // no providers entry
    export class X {
      protected readonly vm = inject(XViewModel);
    }

## Known blind spots

The `providers` array check matches a bare identifier element only (`providers: [XViewModel]`); a `providers` entry written as a provider object (`{ provide: XViewModel, useClass: XViewModel }`) or reached through a spread would not match and the rule would report a false positive on an otherwise-correct component. No such case exists in this app today — the one ViewModel in the reference slice uses the bare form. The rule also does not check that the provided class and the injected class are the same declaration, only that their names match; a shadowed or re-exported identifier with the same name would pass. This mirrors the identifier-name matching `componentImports` already uses for `imports` array entries elsewhere in this rule set.
