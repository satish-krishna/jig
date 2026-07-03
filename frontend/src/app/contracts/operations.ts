import type { components } from './generated/api-types';

type Schemas = components['schemas'];

/**
 * Generated DTOs. Never hand-write these shapes; they come from the .NET API via
 * `npm run codegen`, so HTTP and IPC cannot disagree about a wire shape.
 */
export type UserDto = Schemas['UserResponse'];
export type SaveUserInput = Schemas['SaveUserRequest'];

/**
 * The operation registry: the single source of truth for every request and
 * response shape crossing the transport seam. Both transports key off this map,
 * so TypeScript forces parity and the contract cannot drift.
 *
 * @capability contracts.operation-registry
 * @intent One typed map of operations so HTTP and IPC cannot disagree about a shape.
 * @reuse Add an operation here first; response types must resolve to generated DTOs.
 * @since 0.1.0
 */
export interface Operations {
  'users.list': { req: void; res: UserDto[] };
  'users.get': { req: { id: string }; res: UserDto };
  'users.save': { req: SaveUserInput; res: UserDto };
}

export type OperationName = keyof Operations;
export type Req<K extends OperationName> = Operations[K]['req'];
export type Res<K extends OperationName> = Operations[K]['res'];
