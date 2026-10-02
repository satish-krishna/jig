import { Component, OnInit, inject } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmTypographyImports } from '@spartan-ng/helm/typography';
import { MenuService } from '../../menu';
import { UserForm } from './user-form';
import type { UserFormModel } from './user-form.schema';
import { UserListViewModel } from './user-list.view-model';
import { newUserCommand } from './users.commands';

/**
 * The users slice view. Binds only to the ViewModel's signals and the form
 * component. It has no idea a transport or a repository exists.
 */
@Component({
  selector: 'app-user-list',
  imports: [UserForm, HlmTypographyImports, HlmAlertImports],
  providers: [UserListViewModel],
  template: `
    <section class="grid gap-m">
      <h1 hlmH3>Users</h1>

      @if (vm.formOpen()) {
        <app-user-form (saved)="onSaved($event)" />
      }

      @if (vm.loading()) {
        <p hlmMuted>Loading...</p>
      }
      @if (vm.error(); as err) {
        <div hlmAlert variant="destructive">
          <p hlmAlertDescription>{{ err.message }}</p>
        </div>
      }

      <ul hlmUl>
        @for (user of vm.users(); track user.id) {
          <li>{{ user.name }} · {{ user.email }}</li>
        } @empty {
          <li hlmMuted>No users yet.</li>
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
