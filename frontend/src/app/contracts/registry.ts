import type { OperationName, Req } from './operations';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** How one operation maps onto an HTTP request. `path` is typed to that operation's request. */
export interface HttpRoute<K extends OperationName> {
  method: HttpMethod;
  path: (req: Req<K>) => string;
  hasBody: boolean;
}

/**
 * HTTP and IPC descriptors for every operation. The mapped types force every
 * OperationName to appear in both maps, so an operation added to the registry
 * cannot be forgotten on either wire: omit one and the build breaks.
 *
 * @capability contracts.transport-registry
 * @intent Compiler-enforced parity: every operation has both an HTTP route and an IPC command.
 * @reuse Add the operation to Operations, then its ROUTES and COMMANDS entry; omissions fail the build.
 */
export const ROUTES: { [K in OperationName]: HttpRoute<K> } = {
  'users.list': { method: 'GET', path: () => '/users', hasBody: false },
  'users.get': { method: 'GET', path: (req) => `/users/${req.id}`, hasBody: false },
  'users.save': { method: 'POST', path: () => '/users', hasBody: true },
};

/** The Tauri command name each operation invokes on the IPC wire. */
export const COMMANDS: { [K in OperationName]: string } = {
  'users.list': 'users_list',
  'users.get': 'users_get',
  'users.save': 'users_save',
};
