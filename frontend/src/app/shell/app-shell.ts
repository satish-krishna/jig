import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { MenuService } from '../menu';
import { ThemeService } from '../theme/theme.service';
import { WIRE } from '../transport';
import { SidebarNavItem } from './sidebar-nav-item';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // uses the global .hlm-shell* classes
  imports: [RouterOutlet, NgIcon, HlmButtonImports, SidebarNavItem],
  template: `
    <div class="hlm-shell" [attr.data-collapsed]="collapsed()">
      <aside class="hlm-sidebar">
        <div class="hlm-sidebar__header">
          <span class="hlm-sidebar__brand-mark">J</span>
          <span class="hlm-sidebar__brand-name">jig</span>
        </div>
        <nav class="hlm-sidebar__body" data-region="sidebar">
          @for (cmd of sidebar(); track cmd.id) {
            <app-sidebar-nav-item [command]="cmd" />
          }
        </nav>
        <div class="hlm-sidebar__footer"></div>
      </aside>

      <header class="hlm-shell__header">
        <button hlmBtn variant="ghost" size="icon" (click)="toggle()" aria-label="Toggle sidebar">
          <ng-icon name="lucidePanelLeft" />
        </button>
        <span class="grow"></span>
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
        <div data-region="header" style="display: contents">
          @for (cmd of header(); track cmd.id) {
            <button hlmBtn size="sm" [disabled]="!cmd.canExecute()" (click)="cmd.execute()">
              @if (cmd.icon; as icon) { <ng-icon [name]="icon" /> }
              {{ cmd.label }}
            </button>
          }
        </div>
      </header>

      <main class="hlm-shell__main">
        <router-outlet />
      </main>

      <footer class="hlm-shell__footer">jig{{ wire ? ' · ' + wire : '' }}</footer>
    </div>
  `,
})
export class AppShell {
  private readonly menu = inject(MenuService);
  protected readonly wire = inject(WIRE, { optional: true });
  protected readonly theme = inject(ThemeService);
  protected readonly sidebar = this.menu.items('sidebar');
  protected readonly header = this.menu.items('header');
  protected readonly collapsed = signal(false);
  protected toggle(): void { this.collapsed.update((v) => !v); }
}
