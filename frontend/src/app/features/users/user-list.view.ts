import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MenuService } from '../../menu';
import { UserForm } from './user-form';
import type { UserFormModel } from './user-form.schema';
import { UserListViewModel } from './user-list.view-model';
import { newUserCommand } from './users.commands';

/**
 * The users slice view. Binds only to the ViewModel's signals and the form
 * component. It has no idea a transport, a wire, or a repository exists.
 * This is the reference view to copy for a new feature.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserForm],
  providers: [UserListViewModel],
  template: `
    <section class="users">
      <h1>Users</h1>

      @if (vm.formOpen()) {
        <app-user-form (saved)="onSaved($event)" />
      }

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

  constructor() {
    const menu = inject(MenuService);
    menu.register('header', newUserCommand(this.vm));
  }

  ngOnInit(): void {
    this.vm.load();
  }

  onSaved(value: UserFormModel): void {
    this.vm.save(value);
  }
}
