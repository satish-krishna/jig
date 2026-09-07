import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { MenuService } from '../menu';
import { ThemeService } from '../theme/theme.service';
import { AppShellViewModel } from './app-shell.view-model';
import { SidebarNavItem } from './sidebar-nav-item';

@Component({
  selector: 'app-shell',
  encapsulation: ViewEncapsulation.None, // uses the global .hlm-shell* classes
  imports: [RouterOutlet, NgIcon, HlmButtonImports, SidebarNavItem],
  providers: [AppShellViewModel],
  template: `
    <div class="hlm-shell" [attr.data-collapsed]="vm.collapsed()">
      <aside class="hlm-sidebar">
        <nav class="hlm-sidebar__body" data-region="sidebar">
          @for (cmd of sidebar(); track cmd.id) {
            <app-sidebar-nav-item [command]="cmd" />
          }
        </nav>
        <!-- The collapse control lives with the thing it collapses. It stays
             reachable in the rail: a toggle that collapses itself out of reach
             would be a one-way door. -->
        <div class="hlm-sidebar__footer">
          <button hlmBtn variant="ghost" size="icon" (click)="vm.toggle()" aria-label="Toggle sidebar">
            <ng-icon name="lucidePanelLeft" />
          </button>
        </div>
      </aside>

      <header class="hlm-shell__header">
        <!-- Brand belongs to the app, not to the nav — and in the header it no
             longer disappears when the sidebar collapses to a rail. -->
        <span class="hlm-brand">
          <span class="hlm-brand__mark">J</span>
          <span class="hlm-brand__name">jig</span>
        </span>
        <!-- The header's second grid column. Its contents are a single inline
             run of controls, which is what flex is for. -->
        <div class="flex items-center gap-m">
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            (click)="theme.toggle()"
            [attr.aria-label]="'Switch to ' + (theme.mode() === 'dark' ? 'light' : 'dark') + ' mode'"
            data-testid="theme-toggle"
          >
            <ng-icon [name]="theme.mode() === 'dark' ? 'lucideSun' : 'lucideMoon'" />
          </button>
          <div data-region="header" class="contents">
            @for (cmd of header(); track cmd.id) {
              <button hlmBtn size="sm" [disabled]="!cmd.canExecute()" (click)="cmd.execute()">
                @if (cmd.icon; as icon) { <ng-icon [name]="icon" /> }
                {{ cmd.label }}
              </button>
            }
          </div>
        </div>
      </header>

      <main class="hlm-shell__main">
        <router-outlet />
      </main>

      <footer class="hlm-shell__footer">jig{{ vm.wire ? ' · ' + vm.wire : '' }}</footer>
    </div>
  `,
})
export class AppShell {
  private readonly menu = inject(MenuService);
  protected readonly vm = inject(AppShellViewModel);
  protected readonly theme = inject(ThemeService);
  protected readonly sidebar = this.menu.items('sidebar');
  protected readonly header = this.menu.items('header');
}
