# no-root-provided-view-model

> Engine: `tools/lint/rules/no-root-provided-view-model.ts`.

## What it forbids

Any class whose name ends in `ViewModel` that carries `@Injectable({ providedIn: 'root', ... })`. The check reads the `@Injectable` decorator metadata via `decoratorMetadata` and looks for a `providedIn` property whose literal value is `'root'`; it fires on that property node.

## Why

A ViewModel in this app is scoped to the component that opens it: `frontend/src/app/features/users/user-list.view.ts` declares `providers: [UserListViewModel]` and Angular creates one `UserListViewModel` instance per `UserListView` instance. That scoping is the point — if two `UserListView`s were ever on screen at once (a list and a detail pane, say), each gets its own `loading`/`error`/`users` signals with no risk of one view's load clobbering the other's.

`providedIn: 'root'` makes the class an application-wide singleton instead: every injector resolves to the same one instance. A root-provided ViewModel reintroduces the shared-mutable-state problem the ViewModel pattern exists to avoid, just one layer removed from the component. It also breaks the reference shape's own file: `no-unprovided-view-model` expects the consuming component to list the ViewModel in its own `providers` array, and a root-provided class does not need one there, which would make the two rules point in opposite directions for the same class.

A plain service — `MenuService`, `ThemeService`, anything not named `*ViewModel` — is exactly what `providedIn: 'root'` is for, and this rule has no opinion on it: the check gates on the class name first.

## Accepted form

    // frontend/src/app/features/users/user-list.view-model.ts
    @Injectable()
    export class UserListViewModel { /* ... */ }

## Rejected form

    @Injectable({ providedIn: 'root' })
    export class UserListViewModel { /* ... */ }

## Known blind spots

The check is a class-name suffix (`ViewModel`), the same convention `no-unprovided-view-model` and `no-component-subscribe`'s doc rely on. A class actually built as a ViewModel but not named with the suffix is invisible to this rule, and a class merely named `*ViewModel` that is not one (unlikely, but not impossible) would be flagged if it ever carried `providedIn: 'root'`. The `providedIn` check matches only a string literal `'root'`; a value built from a variable or a template literal would not match `prop.value?.type !== 'Literal'` and would pass through unflagged. No such case exists in this app today.
