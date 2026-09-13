import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SaveUserInput, UserDto } from '../contracts';
import { Transport } from '../transport';

/**
 * The user operations facade: speaks operations, never URLs or command names. Identical
 * across both wires because it only ever talks to the Transport port.
 *
 * @capability operations.user
 * @intent Domain-facing user data access that is oblivious to HTTP vs IPC.
 * @reuse Inject UserOperations from ViewModels; copy this shape for new feature facades.
 */
@Injectable({ providedIn: 'root' })
export class UserOperations {
  private readonly transport = inject(Transport);

  list(): Observable<UserDto[]> {
    return this.transport.request('users.list', {});
  }

  get(id: string): Observable<UserDto> {
    return this.transport.request('users.get', { id });
  }

  save(user: SaveUserInput): Observable<UserDto> {
    return this.transport.request('users.save', user);
  }
}
