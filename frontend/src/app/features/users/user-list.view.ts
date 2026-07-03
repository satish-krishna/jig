import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import type { SaveUserInput } from '../../contracts';
import { SchemaForm } from '../../forms/schema-form';
import { userFormSchema } from './user-form.schema';
import { UserListViewModel } from './user-list.view-model';

/**
 * The users slice view. Binds only to the ViewModel's signals and the shared
 * form renderer. It has no idea a transport, a wire, or a repository exists.
 * This is the reference view to copy for a new feature.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SchemaForm],
  providers: [UserListViewModel],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <section class="users">
      <h1>Users</h1>

      <app-schema-form [schema]="schema" submitLabel="Add user" (submitted)="onSubmit($event)" />

      @if (vm.loading()) {
        <p class="status">Loading...</p>
      }
      @if (vm.error(); as err) {
        <p class="error" role="alert">{{ err.message }}</p>
      }

      <ul class="user-list">
        @for (user of vm.users(); track user.id) {
          <li>{{ user.name }} · {{ user.email }}</li>
        } @empty {
          <li class="empty">No users yet.</li>
        }
      </ul>
    </section>
  `,
})
export class UserListView implements OnInit {
  protected readonly vm = inject(UserListViewModel);
  protected readonly schema = userFormSchema;

  ngOnInit(): void {
    this.vm.load();
  }

  onSubmit(value: Record<string, unknown>): void {
    this.vm.save(value as SaveUserInput);
  }
}
