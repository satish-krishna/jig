import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { UserForm } from './user-form';
import type { UserFormModel } from './user-form.schema';
import { UserListViewModel } from './user-list.view-model';

/**
 * The users slice view. Binds only to the ViewModel's signals and the form
 * component. It has no idea a transport, a wire, or a repository exists.
 * This is the reference view to copy for a new feature.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UserForm],
  providers: [UserListViewModel],
  template: `
    <section class="users">
      <h1>Users</h1>

      <app-user-form (saved)="onSaved($event)" />

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

  ngOnInit(): void {
    this.vm.load();
  }

  onSaved(value: UserFormModel): void {
    this.vm.save(value);
  }
}
