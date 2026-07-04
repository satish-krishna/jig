import { Injectable, inject, signal } from '@angular/core';
import type { SaveUserInput, UserDto } from '../../contracts';
import type { AppError } from '../../transport';
import { UserRepository } from '../../repositories/user.repository';

/**
 * ViewModel for the users slice. Exposes signals only; the View binds to them and
 * never touches a repository or transport. Depends on UserRepository, which speaks
 * operations, so this class is identical whether the wire is IPC or HTTP.
 *
 * This is the reference ViewModel: copy its shape for new features. It is not a
 * catalog capability because ViewModels are feature-specific, not reused.
 */
@Injectable()
export class UserListViewModel {
  private readonly repo = inject(UserRepository);

  readonly users = signal<UserDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);

  openForm(): void { this.formOpen.set(true); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repo.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  save(input: SaveUserInput): void {
    this.error.set(null);
    this.saving.set(true);
    this.repo.save(input).subscribe({
      next: () => { this.saving.set(false); this.formOpen.set(false); this.load(); },
      error: (err: AppError) => { this.saving.set(false); this.error.set(err); },
    });
  }
}
