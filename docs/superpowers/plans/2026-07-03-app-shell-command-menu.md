# App-shell layout + command-driven menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare `<main><router-outlet/></main>` shell with the jig-design full-width app shell (header, collapsible sidebar, content, footer) whose menu items are driven by a runtime-registered, region-keyed command system.

**Architecture:** A `MenuService` keyed by region (`sidebar` | `header`) holds `Command` objects and exposes them as signals. Navigation is a `Command` that wraps the Angular Router (URL stays the source of truth; active state is `computed(router.url)`). The shell components render commands per region. The `users` slice contributes one nav command (app-wide) and one action command (`NewUserCommand`, active only while the users view is mounted).

**Tech Stack:** Angular 22 (standalone, signals), spartan-ng helm (`@spartan-ng/helm/*` → `frontend/libs/ui/*`), `@ng-icons/lucide`, Tailwind v4, vitest.

## Global Constraints

- TDD red-green: no production line before a failing test demands it. Specs are vitest, run with `npm --prefix frontend test`.
- Feature-branch workflow; work lands on `feat/app-shell-command-menu`. Commits are Conventional Commits with scope in `[transport, forms, contracts, api, shell, catalog, tools, repo]` — use `shell`. Commit body lines ≤100 chars. Every commit ends with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Copy rules (jig-design): sentence case; product/code identifiers stay lowercase (`users`, `jig`). No emoji in UI.
- Icons: `@ng-icons/lucide` names only (e.g. `lucideUsers`, `lucidePlus`, `lucidePanelLeft`); rendered `<ng-icon [name]="…"/>` via `NgIcon` from `@ng-icons/core`. This spartan version (`@spartan-ng/cli` 1.0.4) has no `hlm-icon` wrapper — use `ng-icon` directly (the button CSS styles `[&_ng-icon]` descendants automatically). Do not hand-draw glyphs.
- Discover before build: reuse `libs/ui` helm; generate new helm via `@spartan-ng/cli`, never hand-roll.
- The catalog under `.bob/registry/` is generated. If a new reusable unit is annotated, run `npm run catalog` before committing (the pre-commit hook checks freshness).
- Gate before final done: `npm run verify` green.

---

## File Structure

- `frontend/src/styles.css` — MODIFY: add shell sizing tokens; import the ported shell layout CSS.
- `frontend/src/app/shell/shell.layout.css` — CREATE: ported app-shell + sidebar CSS (from the design system `layout.css`).
- `frontend/src/app/shell/app-shell.ts` — CREATE: the shell grid component (header/sidebar/main/footer), `ViewEncapsulation.None`.
- `frontend/src/app/shell/sidebar-nav-item.ts` — CREATE: renders one sidebar-region `Command`, active from `router.url`.
- `frontend/src/app/menu/command.ts` — CREATE: `Command` interface + `Region` type.
- `frontend/src/app/menu/navigate-command.ts` — CREATE: `navigateCommand(...)` factory.
- `frontend/src/app/menu/menu.service.ts` — CREATE: `MenuService` (register/items, DestroyRef auto-dispose).
- `frontend/src/app/menu/index.ts` — CREATE: barrel export.
- `frontend/src/app/features/users/users.commands.ts` — CREATE: `provideUsersMenu()` (nav, app-wide) + `NewUserCommand` factory (action, view-scoped).
- `frontend/src/app/features/users/user-list.view-model.ts` — MODIFY: add `formOpen`/`saving` signals + `openForm()`.
- `frontend/src/app/features/users/user-list.view.ts` — MODIFY: gate the form on `formOpen()`, register `NewUserCommand` on the view's `DestroyRef`.
- `frontend/src/app/app.ts` / `app.html` — MODIFY: render `<app-shell>` around the outlet.
- `frontend/src/app/app.routes.ts` — MODIFY: `/users` path + `'' → /users` redirect.
- `frontend/src/app/app.config.ts` — MODIFY: `provideIcons({...})`, `provideUsersMenu()`.
- Test files colocated: `*.spec.ts` next to each unit.

---

## Task 1: Icon dependency, sizing tokens, ported shell CSS

**Files:**
- Modify: `frontend/package.json` (via install)
- Modify: `frontend/src/styles.css`
- Create: `frontend/src/app/shell/shell.layout.css`

**Interfaces:**
- Produces: `@ng-icons/lucide` icon names rendered via `NgIcon` from `@ng-icons/core` (no `hlm-icon` wrapper in this spartan version), CSS classes `.hlm-shell`, `.hlm-shell__header`, `.hlm-shell__main`, `.hlm-shell__footer`, `.hlm-sidebar*`, `.hlm-nav__item[data-active]`, and tokens `--sidebar-width`, `--sidebar-width-collapsed`, `--header-height`, `--footer-height`, `--content-max`.

- [ ] **Step 1: Install the icon libraries**

Run (needs network — already done in the first attempt; skip if `@ng-icons/*` are present in `package.json`):
```bash
cd frontend
npm i @ng-icons/core @ng-icons/lucide
```
Expected: `@ng-icons/core` and `@ng-icons/lucide` in `package.json` dependencies. Do NOT run `@spartan-ng/cli add icon` — `@spartan-ng/cli` 1.0.4 has no `icon` primitive; this spartan version uses `<ng-icon>` from `@ng-icons/core` directly. Icons render as `<ng-icon [name]="…"/>` with `provideIcons({...})` at the app config.

- [ ] **Step 2: Add the shell sizing tokens**

In `frontend/src/styles.css`, inside the `:root { … }` block (after the `--sidebar-ring` line), add:
```css
--sidebar-width: 15rem;
--sidebar-width-collapsed: 3.25rem;
--header-height: 3rem;
--footer-height: 2.25rem;
--content-max: 26rem;
```

- [ ] **Step 3: Create the ported shell layout CSS**

Create `frontend/src/app/shell/shell.layout.css` with the app-shell + sidebar rules from `.claude/skills/jig-design/css/layout.css` (the `.hlm-shell*`, `.hlm-sidebar*`, `.hlm-nav__*`, and `.hlm-centered*` blocks — copy verbatim; they already key off the `--sidebar-*` tokens and the sizing tokens added in Step 2).

- [ ] **Step 4: Import the shell CSS globally**

In `frontend/src/styles.css`, append at end of file:
```css
@import './app/shell/shell.layout.css';
```

- [ ] **Step 5: Verify the build compiles**

Run: `npm --prefix frontend run build`
Expected: build succeeds; no unknown-token or missing-import errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/styles.css frontend/src/app/shell/shell.layout.css
git commit -m "feat(shell): add icon deps, shell sizing tokens, ported layout css"
```

---

## Task 2: Command interface + navigateCommand

**Files:**
- Create: `frontend/src/app/menu/command.ts`
- Create: `frontend/src/app/menu/navigate-command.ts`
- Test: `frontend/src/app/menu/navigate-command.spec.ts`

**Interfaces:**
- Produces: `interface Command { readonly id: string; readonly label: string; readonly icon?: string; readonly canExecute: Signal<boolean>; execute(): void | Promise<void>; }`, `type Region = 'sidebar' | 'header'`, and `navigateCommand(opts: { id: string; label: string; icon?: string; route: string }): Command`.
- Consumes: `Router` from `@angular/router`, `signal` from `@angular/core`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/menu/navigate-command.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { runInInjectionContext } from '@angular/core';
import { navigateCommand } from './navigate-command';

describe('navigateCommand', () => {
  it('navigates to the route on execute and is always executable', async () => {
    const navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: { navigate } }],
    });
    const cmd = TestBed.runInInjectionContext(() =>
      navigateCommand({ id: 'nav-users', label: 'users', icon: 'lucideUsers', route: '/users' }),
    );
    expect(cmd.id).toBe('nav-users');
    expect(cmd.canExecute()).toBe(true);
    await cmd.execute();
    expect(navigate).toHaveBeenCalledWith(['/users']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- navigate-command`
Expected: FAIL — cannot find module `./navigate-command`.

- [ ] **Step 3: Write the interface and factory**

Create `frontend/src/app/menu/command.ts`:
```ts
import type { Signal } from '@angular/core';

export type Region = 'sidebar' | 'header';

/** The only shape the menu system knows. Navigation and actions both implement it. */
export interface Command {
  readonly id: string;
  readonly label: string;
  /** Registered @ng-icons/lucide name, e.g. 'lucideUsers'. */
  readonly icon?: string;
  /** Reactive: the menu re-renders when this flips. */
  readonly canExecute: Signal<boolean>;
  execute(): void | Promise<void>;
}
```

Create `frontend/src/app/menu/navigate-command.ts`:
```ts
import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Command } from './command';

/**
 * A navigation menu item as a Command that WRAPS the Router. It does not
 * reimplement routing: execute() delegates to router.navigate, and active
 * highlighting is derived from router.url by the sidebar, not stored here.
 */
export function navigateCommand(opts: {
  id: string;
  label: string;
  icon?: string;
  route: string;
}): Command {
  const router = inject(Router);
  return {
    id: opts.id,
    label: opts.label,
    icon: opts.icon,
    canExecute: signal(true),
    execute: async () => {
      // Discard router.navigate's Promise<boolean>; Command.execute is Promise<void>.
      await router.navigate([opts.route]);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- navigate-command`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/menu/command.ts frontend/src/app/menu/navigate-command.ts frontend/src/app/menu/navigate-command.spec.ts
git commit -m "feat(shell): add Command interface and navigateCommand router adapter"
```

---

## Task 3: MenuService

**Files:**
- Create: `frontend/src/app/menu/menu.service.ts`
- Create: `frontend/src/app/menu/index.ts`
- Test: `frontend/src/app/menu/menu.service.spec.ts`

**Interfaces:**
- Consumes: `Command`, `Region` from `./command`.
- Produces: `class MenuService { register(region: Region, command: Command): void; items(region: Region): Signal<readonly Command[]>; }` provided in root. `register` auto-unregisters on the caller's `DestroyRef`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/menu/menu.service.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { MenuService } from './menu.service';
import type { Command } from './command';

const cmd = (id: string): Command => ({ id, label: id, canExecute: signal(true), execute: () => {} });

describe('MenuService', () => {
  it('registers into a region and excludes other regions', () => {
    const svc = TestBed.inject(MenuService);
    TestBed.runInInjectionContext(() => {
      svc.register('sidebar', cmd('a'));
      svc.register('header', cmd('b'));
    });
    expect(svc.items('sidebar')().map((c) => c.id)).toEqual(['a']);
    expect(svc.items('header')().map((c) => c.id)).toEqual(['b']);
  });

  it('auto-unregisters when the caller DestroyRef fires', () => {
    const svc = TestBed.inject(MenuService);
    @Component({ standalone: true, template: '' })
    class Host {
      constructor() { svc.register('header', cmd('scoped')); }
    }
    const fixture = TestBed.createComponent(Host);
    expect(svc.items('header')().map((c) => c.id)).toEqual(['scoped']);
    fixture.destroy();
    expect(svc.items('header')()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- menu.service`
Expected: FAIL — cannot find module `./menu.service`.

- [ ] **Step 3: Write the service**

Create `frontend/src/app/menu/menu.service.ts`:
```ts
import { DestroyRef, Injectable, inject, signal, type Signal } from '@angular/core';
import type { Command, Region } from './command';

/**
 * Region-keyed registry of Commands. The "header menu" is the 'header' region;
 * there is no separate class. register() ties the command's lifetime to the
 * caller's DestroyRef, so a feature that unmounts drops its contributions
 * automatically — no manual unregister in ngOnDestroy.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly regions: Record<Region, ReturnType<typeof signal<readonly Command[]>>> = {
    sidebar: signal<readonly Command[]>([]),
    header: signal<readonly Command[]>([]),
  };

  register(region: Region, command: Command): void {
    const bucket = this.regions[region];
    bucket.update((cmds) => [...cmds, command]);
    inject(DestroyRef).onDestroy(() => {
      bucket.update((cmds) => cmds.filter((c) => c !== command));
    });
  }

  items(region: Region): Signal<readonly Command[]> {
    return this.regions[region].asReadonly();
  }
}
```

Create `frontend/src/app/menu/index.ts`:
```ts
export type { Command, Region } from './command';
export { navigateCommand } from './navigate-command';
export { MenuService } from './menu.service';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test -- menu.service`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/menu/menu.service.ts frontend/src/app/menu/menu.service.spec.ts frontend/src/app/menu/index.ts
git commit -m "feat(shell): add region-keyed MenuService with DestroyRef auto-dispose"
```

---

## Task 4: Sidebar nav item + app-shell components (rendering from MenuService)

**Files:**
- Create: `frontend/src/app/shell/sidebar-nav-item.ts`
- Create: `frontend/src/app/shell/app-shell.ts`
- Test: `frontend/src/app/shell/app-shell.spec.ts`

**Interfaces:**
- Consumes: `MenuService`, `Command` from `../menu`; `Router`, `RouterOutlet` from `@angular/router`; `HlmButton`/`HlmButtonImports` from `@spartan-ng/helm/button`; `NgIcon` from `@ng-icons/core` (no helm icon wrapper in this spartan version).
- Produces: `AppShell` (selector `app-shell`) and `SidebarNavItem` (selector `app-sidebar-nav-item`, input `command: Command`).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/shell/app-shell.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { AppShell } from './app-shell';
import { MenuService } from '../menu';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers, lucidePlus, lucidePanelLeft } from '@ng-icons/lucide';

describe('AppShell', () => {
  it('renders header commands as buttons and sidebar commands as nav items', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideIcons({ lucideUsers, lucidePlus, lucidePanelLeft })],
    });
    const svc = TestBed.inject(MenuService);
    const injector = TestBed.inject(EnvironmentInjector);
    const executed: string[] = [];
    runInInjectionContext(injector, () => {
      svc.register('sidebar', { id: 'nav-users', label: 'users', icon: 'lucideUsers', canExecute: signal(true), execute: () => { executed.push('nav'); } });
      svc.register('header', { id: 'new-user', label: 'new user', icon: 'lucidePlus', canExecute: signal(false), execute: () => { executed.push('new'); } });
    });
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('users');
    expect(text).toContain('new user');
    const headerBtn = fixture.nativeElement.querySelector('[data-region="header"] button') as HTMLButtonElement;
    expect(headerBtn.disabled).toBe(true); // canExecute() === false
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- app-shell`
Expected: FAIL — cannot find module `./app-shell`.

- [ ] **Step 3: Write SidebarNavItem**

Create `frontend/src/app/shell/sidebar-nav-item.ts`:
```ts
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import type { Command } from '../menu';

@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgIcon],
  template: `
    <button
      class="hlm-nav__item"
      [attr.data-active]="active()"
      [disabled]="!command().canExecute()"
      (click)="command().execute()"
    >
      @if (command().icon; as icon) {
        <ng-icon class="hlm-nav__icon" [name]="icon" />
      }
      <span class="hlm-nav__label">{{ command().label }}</span>
    </button>
  `,
})
export class SidebarNavItem {
  readonly command = input.required<Command>();
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  // Active state is DERIVED from the URL, never stored. This is the guardrail:
  // the sidebar highlight can never disagree with the address bar.
  protected readonly active = computed(() => this.url().startsWith('/' + this.command().id.replace(/^nav-/, '')));
}
```

Note: active-match uses the command id convention `nav-<segment>`; the users nav command is `nav-users` → matches `/users`. If a future command needs a different rule, pass an explicit matcher.

- [ ] **Step 4: Write AppShell**

Create `frontend/src/app/shell/app-shell.ts`:
```ts
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { MenuService } from '../menu';
import { SidebarNavItem } from './sidebar-nav-item';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None, // uses the global .hlm-shell* classes
  imports: [RouterOutlet, NgIcon, HlmButtonImports, SidebarNavItem],
  template: `
    <div class="hlm-shell" [attr.data-collapsed]="collapsed()">
      <aside class="hlm-sidebar">
        <div class="hlm-sidebar__header">
          <span class="hlm-sidebar__brand-mark">J</span>
          <span class="hlm-sidebar__brand-name">jig</span>
        </div>
        <nav class="hlm-sidebar__body" data-region="sidebar">
          @for (cmd of sidebar(); track cmd.id) {
            <app-sidebar-nav-item [command]="cmd" />
          }
        </nav>
        <div class="hlm-sidebar__footer"></div>
      </aside>

      <header class="hlm-shell__header">
        <button hlmBtn variant="ghost" size="icon" (click)="toggle()" aria-label="Toggle sidebar">
          <ng-icon name="lucidePanelLeft" />
        </button>
        <span class="grow"></span>
        <!-- data-region scopes to the looped buttons only, so the toggle button
             above is not mistaken for a header command. display:contents is layout-neutral. -->
        <div data-region="header" style="display: contents">
          @for (cmd of header(); track cmd.id) {
            <button hlmBtn size="sm" [disabled]="!cmd.canExecute()" (click)="cmd.execute()">
              @if (cmd.icon; as icon) { <ng-icon [name]="icon" /> }
              {{ cmd.label }}
            </button>
          }
        </div>
      </header>

      <main class="hlm-shell__main">
        <router-outlet />
      </main>

      <footer class="hlm-shell__footer">jig</footer>
    </div>
  `,
})
export class AppShell {
  private readonly menu = inject(MenuService);
  protected readonly sidebar = this.menu.items('sidebar');
  protected readonly header = this.menu.items('header');
  protected readonly collapsed = signal(false);
  protected toggle(): void { this.collapsed.update((v) => !v); }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix frontend test -- app-shell`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shell/sidebar-nav-item.ts frontend/src/app/shell/app-shell.ts frontend/src/app/shell/app-shell.spec.ts
git commit -m "feat(shell): render header actions and sidebar nav from MenuService"
```

---

## Task 5: Wire the app + the users slice; routes; verify

**Files:**
- Modify: `frontend/src/app/app.ts`, `frontend/src/app/app.html`
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/app.config.ts`
- Create: `frontend/src/app/features/users/users.commands.ts`
- Test: `frontend/src/app/features/users/users.commands.spec.ts`
- Modify: `frontend/src/app/features/users/user-list.view-model.ts`
- Modify: `frontend/src/app/features/users/user-list.view.ts`

**Interfaces:**
- Consumes: `MenuService`, `navigateCommand`, `Command` from `../../menu`; `UserListViewModel`.
- Produces: `provideUsersMenu(): EnvironmentProviders` (registers the users nav command app-wide), `newUserCommand(vm: UserListViewModel): Command`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/features/users/users.commands.spec.ts`:
```ts
import { signal } from '@angular/core';
import { newUserCommand } from './users.commands';
import type { UserListViewModel } from './user-list.view-model';

describe('newUserCommand', () => {
  it('opens the form on execute and is disabled while saving', () => {
    const saving = signal(false);
    const openForm = vi.fn();
    const vm = { saving, openForm } as unknown as UserListViewModel;
    const cmd = newUserCommand(vm);
    expect(cmd.id).toBe('new-user');
    expect(cmd.canExecute()).toBe(true);
    cmd.execute();
    expect(openForm).toHaveBeenCalled();
    saving.set(true);
    expect(cmd.canExecute()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test -- users.commands`
Expected: FAIL — cannot find module `./users.commands`.

- [ ] **Step 3: Add ViewModel state**

In `frontend/src/app/features/users/user-list.view-model.ts`, add to the class (after `error`):
```ts
  readonly formOpen = signal(false);
  readonly saving = signal(false);

  openForm(): void { this.formOpen.set(true); }
```
And in `save`, wrap the flight in `saving`:
```ts
  save(input: SaveUserInput): void {
    this.error.set(null);
    this.saving.set(true);
    this.repo.save(input).subscribe({
      next: () => { this.saving.set(false); this.formOpen.set(false); this.load(); },
      error: (err: AppError) => { this.saving.set(false); this.error.set(err); },
    });
  }
```

- [ ] **Step 4: Write the users commands**

Create `frontend/src/app/features/users/users.commands.ts`:
```ts
import { computed, inject } from '@angular/core';
import { provideAppInitializer, type EnvironmentProviders } from '@angular/core';
import { MenuService, navigateCommand, type Command } from '../../menu';
import { UserListViewModel } from './user-list.view-model';

/** The users slice's action command: opens the create form, disabled mid-save. */
export function newUserCommand(vm: UserListViewModel): Command {
  return {
    id: 'new-user',
    label: 'new user',
    icon: 'lucidePlus',
    canExecute: computed(() => !vm.saving()),
    execute: () => vm.openForm(),
  };
}

/**
 * Registers the users NAV command app-wide (it must be reachable from anywhere,
 * so it lives for the app's lifetime — provideAppInitializer runs in the root
 * injection context). The ACTION command is registered view-scoped in the view.
 */
export function provideUsersMenu(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(MenuService).register(
      'sidebar',
      navigateCommand({ id: 'nav-users', label: 'users', icon: 'lucideUsers', route: '/users' }),
    );
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix frontend test -- users.commands`
Expected: PASS.

- [ ] **Step 6: Register the action command in the view and gate the form**

In `frontend/src/app/features/users/user-list.view.ts`: import `inject`, `MenuService`, `newUserCommand`; in the constructor register the action command (auto-disposes with the view), and gate the form on `formOpen()`:
```ts
// add to imports from '@angular/core': inject
// add: import { MenuService } from '../../menu';
//      import { newUserCommand } from './users.commands';

// class body:
constructor() {
  const menu = inject(MenuService);
  menu.register('header', newUserCommand(this.vm));
}
```
Template change: wrap the form so it only shows when open:
```html
@if (vm.formOpen()) {
  <app-user-form (saved)="onSaved($event)" />
}
```

- [ ] **Step 7: Add routes**

Replace `frontend/src/app/app.routes.ts`:
```ts
import { Routes } from '@angular/router';
import { UserListView } from './features/users/user-list.view';

export const routes: Routes = [
  { path: 'users', component: UserListView },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];
```

- [ ] **Step 8: Mount the shell and register the nav command**

Replace `frontend/src/app/app.html`:
```html
<app-shell />
```
In `frontend/src/app/app.ts`, change imports from `[RouterOutlet]` to `[AppShell]` and import `AppShell` from `./shell/app-shell`.
In `frontend/src/app/app.config.ts`, add to `providers`:
```ts
import { provideIcons } from '@ng-icons/core';
import { lucideUsers, lucidePlus, lucidePanelLeft } from '@ng-icons/lucide';
import { provideUsersMenu } from './features/users/users.commands';
// …
provideIcons({ lucideUsers, lucidePlus, lucidePanelLeft }),
provideUsersMenu(),
```

- [ ] **Step 9: Update the existing app spec**

`frontend/src/app/app.spec.ts` currently asserts the bare outlet. Update it to provide `provideRouter([])` and `provideIcons({ lucideUsers, lucidePlus, lucidePanelLeft })` and assert the shell renders (`.hlm-shell` present). Run: `npm --prefix frontend test -- app.spec` → Expected: PASS.

- [ ] **Step 10: Full gate + visual check**

Run: `npm run verify`
Expected: build, all tests, catalog freshness green.
Then `npm run dev`, open `http://localhost:4200/` — expect: redirect to `/users`, the full shell (sidebar with active `users` item, header with a `new user` button, footer). Click `new user` → the form appears. Navigate away and back → header button lifecycle correct, sidebar highlight tracks the URL.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app/app.ts frontend/src/app/app.html frontend/src/app/app.routes.ts frontend/src/app/app.config.ts frontend/src/app/app.spec.ts frontend/src/app/features/users/
git commit -m "feat(shell): mount app shell, wire users nav and new-user commands, add routes"
```

---

## Self-review notes (author)

- **Spec coverage:** full-width shell (Task 1 CSS + Task 4 components); one Command interface (Task 2); runtime register + DestroyRef dispose (Task 3); region-keyed single service (Task 3); nav wraps Router, active from URL (Task 2 + Task 4 SidebarNavItem); `@ng-icons/lucide` path (Task 1); two users commands only (Task 5). All covered.
- **Two decisions made during planning, beyond the spec letter — flag for review:** (1) nav command lifetime is app-wide via `provideAppInitializer`, action command is view-scoped — so `new user` only appears on `/users`; (2) `NewUserCommand` drives new `formOpen`/`saving` signals on the ViewModel, and the form is now hidden until opened (previously always visible).
- **Type consistency:** `Command` shape identical across tasks; `newUserCommand(vm)` and `navigateCommand(opts)` signatures match their call sites; icon names (`lucideUsers`/`lucidePlus`/`lucidePanelLeft`) provided in both the app config and the specs that render icons.
