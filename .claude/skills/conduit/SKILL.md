---
name: conduit
description: Design a single transport abstraction so an Angular frontend runs unchanged over both Tauri IPC (invoke) and HTTP to a remote API. Use this whenever the user is building a Tauri desktop app plus a web build from one Angular codebase, or asks how to make an MVVM/repository layer agnostic to the wire (IPC vs HTTP), how to swap transports at bootstrap, how to keep View/ViewModel/Model constant while communication varies, or how to stop transport details from leaking into domain code. Reach for this even when the user only says "abstract the protocol", "one frontend two backends", "dual transport", or "make invoke and HttpClient interchangeable".
---

# Conduit: one frontend, two wires

## The core idea

A Tauri app and a web app built from the same Angular codebase talk to different worlds. The desktop shell reaches a local Rust core through `invoke` (IPC). The web build reaches a remote .NET API over HTTP. Left alone, that difference smears across the whole app: repositories know about URLs, ViewModels branch on `isTauri()`, error handling forks in two. The point of Conduit is to push that entire difference down to one seam, a transport port that speaks in logical operations, so everything above it stays identical no matter which wire is underneath.

The port is the only object in the system that knows two worlds exist. View, ViewModel, Model, and repositories never find out. That is the whole win, and every rule below exists to protect it.

## When this applies

Reach for Conduit when all of these hold: one Angular codebase, two runtime contexts (Tauri shell and browser), and a domain layer that should not care which is active. If there is only ever HTTP, this is over-engineering, a plain `HttpClient` service is correct. If the two worlds share almost no operations, Conduit still helps for the shared subset but do not force the divergent parts through it (see Asymmetry 3).

## Architecture

```mermaid
flowchart TD
    View["View (template + bindings)"] --> VM["ViewModel (signals)"]
    VM --> Repo["Repository (operation calls)"]
    Repo --> Norm["NormalizingTransport (decorator)"]
    Norm --> Port["Transport port (abstract)"]
    Port -. isTauri picks one at bootstrap .-> Http["HttpTransport to .NET API"]
    Port -. .-> Ipc["IpcTransport to Rust commands"]

    subgraph Constant["constant across both contexts"]
        View
        VM
        Repo
    end
    subgraph Swapped["chosen once at bootstrap"]
        Http
        Ipc
    end
```

## Build order

Build in this sequence. Each step depends only on the ones above it, so the abstraction stays honest.

### 1. One typed operation registry

This is the single source of truth for every request and response shape. Both transports key off it, so TypeScript forces both to cover the same operations and the contract cannot drift.

```ts
// contracts/operations.ts
export interface Operations {
  'users.get':  { req: { id: string };      res: User };
  'users.list': { req: { page: number };    res: Page<User> };
  'users.save': { req: { user: UserInput };  res: User };
}
export type OperationKey = keyof Operations;
```

If the project generates TypeScript from OpenAPI, the `res` types here are the generated response DTOs. Both transports reference the same ones, so HTTP and IPC cannot disagree about a shape.

### 2. The transport port

An abstract class, which doubles as its own Angular DI token. It returns Observables so the HTTP world (`HttpClient`) and the Promise world (`invoke`) look identical to every caller.

```ts
// transport/transport.port.ts
export abstract class Transport {
  abstract request<K extends OperationKey>(
    op: K,
    payload: Operations[K]['req'],
  ): Observable<Operations[K]['res']>;
}
```

### 3. Two transports, same keys

Each transport maps a logical operation onto its native form: HTTP carries a route table, IPC carries a command table. Both are `Record<OperationKey, ...>`, so leaving an operation out is a compile error.

```ts
// transport/http.transport.ts
type Route = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: (r: any) => string;
  body?: (r: any) => unknown;
  query?: (r: any) => Record<string, any>;
};

const ROUTES: Record<OperationKey, Route> = {
  'users.get':  { method: 'GET',  path: r => `/users/${r.id}` },
  'users.list': { method: 'GET',  path: () => `/users`, query: r => ({ page: r.page }) },
  'users.save': { method: 'POST', path: () => `/users`, body: r => r.user },
};

@Injectable()
export class HttpTransport extends Transport {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  request<K extends OperationKey>(op: K, payload: Operations[K]['req']) {
    const r = ROUTES[op];
    return this.http.request<Operations[K]['res']>(
      r.method, `${this.base}${r.path(payload)}`,
      { body: r.body?.(payload), params: r.query?.(payload) as any },
    );
  }
}
```

```ts
// transport/ipc.transport.ts
import { invoke, InvokeArgs } from '@tauri-apps/api/core';

const COMMANDS: Record<OperationKey, string> = {
  'users.get':  'get_user',
  'users.list': 'list_users',
  'users.save': 'save_user',
};

@Injectable()
export class IpcTransport extends Transport {
  request<K extends OperationKey>(op: K, payload: Operations[K]['req']) {
    return from(invoke<Operations[K]['res']>(COMMANDS[op], payload as InvokeArgs));
  }
}
```

The Rust command side that these map onto is in `references/rust-command-side.md`. Read it when wiring the desktop backend so the `res` shapes line up with the generated OpenAPI DTOs.

### 4. Normalize failure at one seam (do not skip this)

The two transports fail in completely different shapes. `HttpClient` throws `HttpErrorResponse` with status codes and runs through interceptors. A rejected `invoke` throws whatever string or serialized value the Rust command returned, with no interceptor path at all. If those leak upward, every ViewModel grows two error branches and the abstraction is already broken. Wrap the chosen transport in a decorator that folds both into one app error type, and put any uniform retry or logging here too.

```ts
// transport/normalizing.transport.ts
@Injectable()
export class NormalizingTransport extends Transport {
  constructor(private inner: Transport) { super(); }
  request<K extends OperationKey>(op: K, payload: Operations[K]['req']) {
    return this.inner.request(op, payload).pipe(
      catchError(e => throwError(() => toAppError(op, e))),
    );
  }
}
```

### 5. Pick the wire once, at bootstrap

The entire "which world" decision collapses to one factory. Let Angular construct both concrete transports so their own injected dependencies wire up, choose with v2's `isTauri()` rather than sniffing `window`, then wrap the choice in the normalizer so cross-cutting behavior lives in exactly one place.

```ts
// transport/provide-transport.ts
import { isTauri } from '@tauri-apps/api/core';

export function provideTransport(): EnvironmentProviders {
  return makeEnvironmentProviders([
    HttpTransport,
    IpcTransport,
    {
      provide: Transport,
      useFactory: () => new NormalizingTransport(
        isTauri() ? inject(IpcTransport) : inject(HttpTransport),
      ),
    },
  ]);
}
```

### 6. Everything above speaks operations

Repositories call operations, never URLs or command names.

```ts
@Injectable({ providedIn: 'root' })
export class UserRepository {
  private transport = inject(Transport);
  get(id: string)       { return this.transport.request('users.get',  { id }); }
  list(page: number)    { return this.transport.request('users.list', { page }); }
  save(user: UserInput) { return this.transport.request('users.save', { user }); }
}
```

ViewModels depend only on repositories and expose signals. The View has no idea any of this exists.

```ts
@Injectable()
export class UserListViewModel {
  private repo = inject(UserRepository);
  readonly users   = signal<User[]>([]);
  readonly loading = signal(false);

  load(page = 1) {
    this.loading.set(true);
    this.repo.list(page).subscribe(p => {
      this.users.set(p.items);
      this.loading.set(false);
    });
  }
}
```

## The three asymmetries you must design for

The skeleton is clean but three real differences between the wires will leak if ignored. Handle each at the seam, never above it.

1. **Errors.** Covered in build step 4. The non-negotiable rule: no `HttpErrorResponse` and no raw `invoke` rejection may reach a repository or ViewModel. If either type is caught above the normalizer, the abstraction has failed.

2. **Auth.** Over HTTP you attach a bearer token, best done in an `HttpInterceptor` so it stays out of domain code. Over IPC there is usually no token to attach: the Rust core holds the real credential and the local origin is already trusted. The port hides this, which is correct. The rule that keeps it correct: token logic lives inside the HTTP transport or its interceptor, never in a repository, or the coupling you removed comes straight back.

3. **Native-only capabilities.** The desktop shell almost always grows operations the web build has no equivalent for: tray control, file watching, reading local config. Do not cram these into the shared `Operations` map with a "throws on HTTP" stub, because that converts a compile-time guarantee into a runtime surprise. Keep the shared map for genuinely symmetric domain calls only. Put native-only features behind a separate capability service that is simply not provided in the web bootstrap. ViewModels that need it inject it; ones that do not never see it. The shared port stays a real contract instead of a leaky one.

## Smells that mean the pattern is breaking

- `isTauri()` or any `window` check anywhere above the bootstrap factory.
- A URL string or a Tauri command name appearing in a repository or ViewModel.
- A `catch` block above the normalizer that inspects `.status` or a Rust error string.
- An operation in the shared registry that one transport implements as "throw". That belongs in a capability service instead.
- The two transports referencing different response types for the same operation. They must both point at the one registry entry.

## Checklist before calling it done

- Every `OperationKey` is present in both `ROUTES` and `COMMANDS` (compiler enforces this; do not suppress the error).
- Both transports resolve to the registry's `res` type, ideally the generated OpenAPI DTO.
- The normalizer wraps whichever transport the factory selected, and it is the only error-shaping seam.
- Auth attachment exists only on the HTTP side.
- No shared operation is a stub on either wire; native-only work lives in a capability service absent from the web bootstrap.
- View, ViewModel, and Model compile and run unchanged regardless of which transport is provided.
