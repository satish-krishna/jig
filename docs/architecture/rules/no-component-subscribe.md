# no-component-subscribe

> Engine: `tools/lint/rules/no-component-subscribe.ts`.

## What it forbids

Any call to `.subscribe(...)` inside a class carrying a `@Component` decorator, in any tier. The rule walks up from the call to its nearest enclosing class via `classOf` and checks `hasDecorator(cls, 'Component')`; a match reports regardless of what the call is invoked on (`this.repo.list().subscribe(...)`, `this.x$.subscribe(...)`, and so on all match, because the check is on the method name, not on the receiver's type).

## Why

A component that subscribes to an Observable is doing the ViewModel's job: resolving asynchronous data and turning it into state the template can read synchronously. `Transport.request()` and every `Repository` method in this app return an `Observable`; the ViewModel is the layer that subscribes to it, unwraps `next`/`error` into signals, and the component reads those signals with no knowledge that an Observable, a subscription, or an unsubscribe concern ever existed. A component that subscribes directly reintroduces exactly the coupling and the manual lifecycle management (unsubscribe on destroy, race conditions between two loads) that the ViewModel exists to absorb once, in one tested place, instead of in every view.

`frontend/src/app/features/users/user-list.view-model.ts` subscribes twice — once in `load()`, once in `save()` — and `frontend/src/app/features/users/user-list.view.ts` never calls `.subscribe` at all. That is the shape to copy.

## Scope boundary: `@Component` only, not `ViewModel`-suffixed classes

The reference pattern this rule enforces would, in its complete form, also forbid a ViewModel from subscribing — a ViewModel is supposed to expose signals, and the natural end state has an even lower layer doing the actual Observable handling. This rule does **not** implement that half, and that is a deliberate scope cut, not an oversight:

`Transport.request()` returns an `Observable` (see `frontend/src/app/transport/transport.port.ts`), not a `Promise`. Every `Repository` method built on it returns an `Observable` in turn. That means every ViewModel in this app — today, `UserListViewModel`, and every one copied from it — **must** call `.subscribe` somewhere, because there is no other way to consume an `Observable` and assign its resolved value into a signal. Forbidding `.subscribe` in a `ViewModel`-suffixed class would make the rule unsatisfiable by the one layer whose entire job is to do exactly that.

This rule extends to ViewModels once the transport seam returns `Promise`s rather than `Observable`s — at that point a ViewModel would `await` instead of subscribing, and a `.subscribe` call inside a ViewModel would become the same defect it already is inside a component. That is a transport-layer redesign (`docs/architecture/conduit.md`), out of scope for this branch. Do not close the gap by rewriting `user-list.view-model.ts` to call `firstValueFrom(this.repo.list())` instead of `.subscribe({...})` — that passes a hypothetical stricter rule with a one-word swap while changing nothing about the architecture: the ViewModel would still be blocking on an Observable-shaped transport, just through a different API. The fix that actually closes the gap is the transport seam returning Promises, not a call-site substitution that hides the same shape from a broader rule.

## Accepted form

    // frontend/src/app/features/users/user-list.view-model.ts
    @Injectable()
    export class UserListViewModel {
      load(): void {
        this.repo.list().subscribe({ next: (users) => this.users.set(users) });
      }
    }

## Rejected form

    // a component
    @Component({ selector: 'app-x' })
    export class X {
      load(): void {
        this.repo.list().subscribe({ next: (users) => this.users.set(users) }); // belongs in a ViewModel
      }
    }

## Known blind spots

The check matches the method name `subscribe` on any member expression, regardless of the receiver's actual type — a component calling `.subscribe(...)` on something that is not an `Observable` (a hand-rolled object with an unrelated `subscribe` method) would still report. No such case exists in this app today. The rule also does not check for `.pipe(...).subscribe(...)` chains any differently — `.pipe` is not itself flagged, only the terminal `.subscribe`, which is the correct scope: piping operators is not the defect, resolving the pipeline inside a component is.
