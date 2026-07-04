import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import type { Command } from '../menu';

@Component({
  selector: 'app-sidebar-nav-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgIcon],
  template: `
    <button
      class="hlm-nav__item"
      [attr.data-active]="active()"
      [disabled]="!command().canExecute()"
      (click)="command().execute()"
    >
      @if (command().icon; as icon) {
        <ng-icon class="hlm-nav__icon" [name]="icon" />
      }
      <span class="hlm-nav__label">{{ command().label }}</span>
    </button>
  `,
})
export class SidebarNavItem {
  readonly command = input.required<Command>();
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  // Active state is DERIVED from the URL, never stored. This is the guardrail:
  // the sidebar highlight can never disagree with the address bar.
  // CAVEAT: match is a URL prefix check (startsWith), correct for the single
  // nav-users case today and keeps a parent active on its child routes, but it
  // is NOT segment-bounded — a future nav id sharing a prefix (e.g. 'nav-user'
  // vs '/users') needs an explicit matcher instead of relying on startsWith.
  protected readonly active = computed(() => this.url().startsWith('/' + this.command().id.replace(/^nav-/, '')));
}
