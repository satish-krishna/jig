import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SaveUserInput, UserDto } from '../contracts';
import { Transport } from '../transport';

/**
 * The user repository: speaks operations, never URLs or command names. Identical
 * across both wires because it only ever talks to the Transport port.
 *
 * @capability repositories.user
 * @intent Domain-facing user data access that is oblivious to HTTP vs IPC.
 * @reuse Inject UserRepository from ViewModels; copy this shape for new feature repositories.
 * @since 0.1.0
 */
@Injectable({ providedIn: 'root' })
export class UserRepository {
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
