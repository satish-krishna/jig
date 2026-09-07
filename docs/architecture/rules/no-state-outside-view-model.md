# no-state-outside-view-model

> Engine: `tools/lint/rules/no-state-outside-view-model.ts`.

## What it forbids

A container component — a file under `frontend/src/app/features/**` or `frontend/src/app/shell/**`, per the `tierOf` helper in `tools/lint/ast.ts` — whose class carries a `@Component` decorator and declares a class property initialized with `signal(...)`, `linkedSignal(...)`, or `form(...)`. Those three calls are the ways this codebase creates state it owns; declaring one directly on a container is the container skipping its ViewModel.

The rule bails out immediately outside the container tier: `create()` returns `{}` when `tierOf(context.filename) !== 'container'`. A presentational component (a showcase page, `forms/schema-form.ts`, `app.ts`) is allowed to own its own state — it has no ViewModel to delegate to, and does not need one.

## Why

The MVVM boundary this branch enforces puts screen state in a component-provided ViewModel: a plain `@Injectable()` class with no root-level `providedIn`, instantiated per-component through `providers: [XViewModel]`. The ViewModel is unit-testable with zero DOM, and the View becomes a thin binding layer that reads `vm.someSignal()`. A container that declares `signal(...)` on itself has state living in the one place in the stack that cannot be tested without rendering a component and cannot be reused if the same state is ever needed by a sibling view.

`frontend/src/app/features/users/user-list.view-model.ts` is the reference shape: every signal the users slice needs — `users`, `loading`, `error`, `formOpen`, `saving` — lives there, and `frontend/src/app/features/users/user-list.view.ts` only reads them.

## `computed` is deliberately never flagged, in any tier

The reference rule this is derived from flags `computed` alongside `signal`. This rule does not, and that is not a weakening — read the exclusion literally, not as "this rule got softer than the model it copies":

`computed` is not flagged. A `computed` is derived by definition: when it derives from owned state, the owning `signal` is already reported, and reporting both is two errors for one defect — the same once-per-defect call this rule already makes for a `form` and its backing model (see below). When it derives from `input()` or `toSignal()`, it is view logic sitting exactly where it belongs. Two files in this repo confirm it: `sidebar-nav-item.ts` holds one `computed` over an `input()` and a `toSignal()`, and `forms/schema-form.ts` is built entirely from `input`, `output` and `computed`. Under the literal reference rule both would need ViewModels holding no state.

`input.required()` and `toSignal(...)` are never in the owned-state set either, for the same reason: they convert a value the component already receives (a component input, or an existing Observable) into a signal. They do not create screen state; they reshape a value that came from somewhere else.

## A `form()` and its backing model signal are one defect, not two

A container that builds a signal-forms form directly — `readonly model = signal(...); readonly form = form(this.model, ...)` — is a single MVVM violation: the whole form belongs in a ViewModel, not just half of it. The rule tracks which property name each `form(...)` call's first argument refers to (`this.model` -> `model`) and skips reporting that specific property. It still reports the `form(...)` property itself, and it still reports any *other* signal in the same class that the form does not back — the exemption is precise, not "any signal in a class that also happens to have a form."

`frontend/src/app/features/users/user-form.ts` is the live example: line 51's `form(this.model, ...)` reports, and line 50's `model = signal({...})` — the form's own backing model — does not.

## Accepted form

    // frontend/src/app/features/users/user-list.view-model.ts
    @Injectable()
    export class UserListViewModel {
      readonly users = signal<UserDto[]>([]);
      readonly loading = signal(false);
    }

    // frontend/src/app/features/users/user-list.view.ts
    @Component({ providers: [UserListViewModel] })
    export class UserListView {
      protected readonly vm = inject(UserListViewModel);
    }

## Rejected form

    // a container component
    @Component({ selector: 'app-x' })
    export class X {
      readonly users = signal<UserDto[]>([]); // belongs in a ViewModel
    }

## Known blind spots

The owned-state set is a fixed identifier list (`signal`, `linkedSignal`, `form`); a call reached through a namespace import or a local alias (`import * as core from '@angular/core'; core.signal(0)`) does not match `init.callee?.name` and is invisible to this rule. The backing-model exemption for `form()` only recognizes a first argument that is a bare identifier or a `this.<name>` member expression — a form built from a freshly-constructed object literal, or from a signal defined in a different file, gets no exemption and the `form()` call still reports on its own, which is correct but means the backing signal (if any) is reported too in that shape.
