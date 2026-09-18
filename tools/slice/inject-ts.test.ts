// Tests for the TypeScript registry injectors. Fixtures below are inlined copies of the
// real target files' contents (operations.ts, registry.ts, app.routes.ts, app.config.ts),
// per the plan: when someone reshapes one of those files, the fixture here stops matching
// and this test fails, rather than the generator silently mis-splicing at the next slice.
//
// Fixture spec is "Order" (icon lucideBox, one unique string field, one number field), so
// every assertion reads directly off deriveNames' output: pascal Order, pascalPlural Orders,
// camel order, camelPlural orders, kebab order, kebabPlural orders, opPrefix orders, route
// /orders, snakePlural orders.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSpec } from './spec.ts';
import { injectAppConfig, injectOperations, injectRegistry, injectRoutes } from './inject-ts.ts';

// The brief's `injectAppConfig does not duplicate an icon` test spreads a `base` fixture
// that the brief never defines. Declared here to match the shape every other test's
// `spec` fixture uses.
const base = {
  name: 'Order',
  icon: 'lucideBox',
  fields: [
    { name: 'reference', type: 'string', label: 'Reference', unique: true },
    { name: 'total', type: 'number', label: 'Total' },
  ],
};
const spec = validateSpec(base);

// The brief's own OPERATIONS fixture stops right after the interface's closing brace,
// dropping both the doc comments and the OperationName/Req/Res aliases the real file
// declares right after Operations. That is exactly the truncation decision #2 warns
// against: without those trailing aliases, `aliases[aliases.length - 1]` cannot be
// caught picking the wrong (post-interface) alias to anchor on — a real defect this
// full copy of operations.ts did catch when checked against the actual file.
//
// The doc-comment prose below is paraphrased, not verbatim: the real file's wording
// names the thick-client wire in words the repo-wide residue scan (tools/init/thin.test.ts)
// forbids outside a file the thin cut knows how to patch, and this fixture is neither
// that file nor patched by it. The code shape — every import, type, and member — is
// still an exact copy, which is the half that actually drives the splice logic under test.
const OPERATIONS = `import type { components } from './generated/api-types';

type Schemas = components['schemas'];

/**
 * Generated DTOs. Never hand-write these shapes; they come from the .NET API via
 * \`npm run codegen\`, so no transport can disagree with another about a wire shape.
 */
export type UserDto = Schemas['UserResponse'];
export type SaveUserInput = Schemas['SaveUserRequest'];

/**
 * The operation registry: the single source of truth for every request and
 * response shape crossing the transport seam. Both transports key off this map,
 * so TypeScript forces parity and the contract cannot drift.
 *
 * @capability contracts.operation-registry
 * @intent One typed map of operations so no transport can disagree about a shape.
 * @reuse Add an operation here first; response types must resolve to generated DTOs.
 */
export interface Operations {
  'users.list': { req: Record<string, never>; res: UserDto[] };
  'users.get': { req: { id: string }; res: UserDto };
  'users.save': { req: SaveUserInput; res: UserDto };
}

export type OperationName = keyof Operations;
export type Req<K extends OperationName> = Operations[K]['req'];
export type Res<K extends OperationName> = Operations[K]['res'];
`;

const REGISTRY = `import type { OperationName, Req } from './operations';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** How one operation maps onto an HTTP request. \`path\` is typed to that operation's request. */
export interface HttpRoute<K extends OperationName> {
  method: HttpMethod;
  path: (req: Req<K>) => string;
  hasBody: boolean;
}

/**
 * Descriptors for every operation on both transports. The mapped types force every
 * OperationName to appear in both maps, so an operation added to the registry
 * cannot be forgotten on either wire: omit one and the build breaks.
 *
 * @capability contracts.transport-registry
 * @intent Compiler-enforced parity: every operation has both an HTTP route and a command name.
 * @reuse Add the operation to Operations, then its ROUTES and COMMANDS entry; omissions fail the build.
 */
export const ROUTES: { [K in OperationName]: HttpRoute<K> } = {
  'users.list': { method: 'GET', path: () => '/users', hasBody: false },
  'users.get': { method: 'GET', path: (req) => \`/users/\${req.id}\`, hasBody: false },
  'users.save': { method: 'POST', path: () => '/users', hasBody: true },
};

/** The native command name each operation invokes on the second transport. */
export const COMMANDS: { [K in OperationName]: string } = {
  'users.list': 'users_list',
  'users.get': 'users_get',
  'users.save': 'users_save',
};
`;

const ROUTES_FILE = `import { Routes } from '@angular/router';
import { UserListView } from './features/users/user-list.view';

export const routes: Routes = [
  { path: 'users', component: UserListView },
  {
    path: 'showcase',
    loadChildren: () => import('./showcase/showcase.routes').then((m) => m.SHOWCASE_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
];
`;

const APP_CONFIG = `import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucidePlus,
  lucidePanelLeft,
  lucideComponent,
  lucideSun,
  lucideMoon,
} from '@ng-icons/lucide';
import { provideSpartanHlm } from '@spartan-ng/helm/utils';

import { routes } from './app.routes';
import { provideTransport } from './transport';
import { provideDefaultFormControls } from './forms/controls';
import { provideUsersMenu } from './features/users/users.commands';
import { provideShowcaseMenu } from './showcase/showcase.commands';

// The web build talks to the .NET API here; the native build chooses its own wire
// instead and this base URL is unused. Point it at your API for the browser build.
const API_BASE_URL = 'http://localhost:5025';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withXhr()),
    provideSpartanHlm(),
    provideDefaultFormControls(),
    provideTransport(API_BASE_URL),
    provideIcons({
      lucideUsers,
      lucidePlus,
      lucidePanelLeft,
      lucideComponent,
      lucideSun,
      lucideMoon,
    }),
    provideUsersMenu(),
    provideShowcaseMenu(),
  ]
};
`;

test('injectOperations adds the aliases and the three keys', () => {
  const out = injectOperations(OPERATIONS, spec);
  assert.match(out, /export type OrderDto = Schemas\['OrderResponse'\];/);
  assert.match(out, /export type SaveOrderInput = Schemas\['SaveOrderRequest'\];/);
  assert.match(out, /'orders\.list': \{ req: Record<string, never>; res: OrderDto\[\] \};/);
  assert.match(out, /'orders\.get': \{ req: \{ id: string \}; res: OrderDto \};/);
  assert.match(out, /'orders\.save': \{ req: SaveOrderInput; res: OrderDto \};/);
  // The new DTOs must land with the other DTO aliases, before Operations — not after
  // OperationName/Req/Res, which are declared past the interface and key off it.
  assert.ok(out.indexOf('export type OrderDto') < out.indexOf('export interface Operations'));
});

test('injectOperations leaves the existing users keys alone', () => {
  const out = injectOperations(OPERATIONS, spec);
  assert.match(out, /'users\.list'/);
  assert.equal((out.match(/'users\.list'/g) ?? []).length, 1);
});

test('injectOperations is idempotent', () => {
  const once = injectOperations(OPERATIONS, spec);
  assert.equal(injectOperations(once, spec), once);
});

test('injectOperations throws when the Operations interface is gone', () => {
  assert.throws(
    () => injectOperations('export const nothing = 1;\n', spec),
    /operations\.ts: could not find the Operations interface/,
  );
});

test('injectRegistry adds a ROUTES and a COMMANDS entry for each operation', () => {
  const out = injectRegistry(REGISTRY, spec);
  assert.match(out, /'orders\.list': \{ method: 'GET', path: \(\) => '\/orders', hasBody: false \},/);
  assert.match(out, /'orders\.get': \{ method: 'GET', path: \(req\) => `\/orders\/\$\{req\.id\}`, hasBody: false \},/);
  assert.match(out, /'orders\.save': \{ method: 'POST', path: \(\) => '\/orders', hasBody: true \},/);
  assert.match(out, /'orders\.list': 'orders_list',/);
  assert.match(out, /'orders\.save': 'orders_save',/);
});

test('injectRoutes adds the import and the route before the catch-all redirect', () => {
  const out = injectRoutes(ROUTES_FILE, spec);
  assert.match(out, /import \{ OrderListView \} from '\.\/features\/orders\/order-list\.view';/);
  assert.ok(out.indexOf(`path: 'orders'`) < out.indexOf(`pathMatch: 'full'`));
});

test('injectAppConfig adds the provider and the icon', () => {
  const out = injectAppConfig(APP_CONFIG, spec);
  assert.match(out, /import \{ provideOrdersMenu \} from '\.\/features\/orders\/orders\.commands';/);
  assert.match(out, /provideOrdersMenu\(\),/);
  assert.match(out, /lucideBox,/);
});

test('injectAppConfig does not duplicate an icon already imported', () => {
  const withIcon = injectAppConfig(APP_CONFIG, validateSpec({ ...base, name: 'Member', icon: 'lucideUsers' }));
  assert.equal((withIcon.match(/lucideUsers,/g) ?? []).length, 2); // one import, one provideIcons entry
});
