import { Component, Directive, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArchive, lucideInbox, lucideLayoutGrid, lucidePlus, lucideSend, lucideSettings } from '@ng-icons/lucide';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * `HlmSidebarService` is `providedIn: 'root'`, so every `hlm-sidebar` on the
 * page would otherwise share one `open`/`variant` state — fine for a real app
 * with exactly one sidebar, wrong for four side-by-side demos. This directive
 * re-provides the service per demo so each one is independent, the same way a
 * real app's own root component scopes it once.
 */
@Directive({
  selector: '[sidebarDemoScope]',
  standalone: true,
  providers: [HlmSidebarService],
})
class SidebarDemoScope {}

/**
 * Sidebar usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-sidebar` is a large system (header/content/footer,
 * groups, menu, menu-sub, rail, trigger, inset) — every demo below uses
 * `collapsible="none"` on purpose. Any other value renders the desktop branch
 * with `position: fixed` sidebar-gap/container divs meant to dock to the real
 * viewport edge, which would break out of a showcase card entirely; `none`
 * renders the content directly as a plain flex column, which is what "keep
 * each example self-contained" requires here. The built-in `h-svh`/`w-(--sidebar-width)`
 * sizing is overridden by a `class` on `hlm-sidebar` itself — `classes()`
 * merges host-attribute classes last, so a later Tailwind class wins the same
 * utility group. Only 4 of the system's many pieces are shown; trigger, rail
 * and inset all depend on the fixed-position branch this page avoids.
 */
@Component({
  selector: 'app-sidebar-page',
  imports: [ComponentPage, Usage, HlmSidebarImports, NgIcon, SidebarDemoScope],
  providers: [provideIcons({ lucideInbox, lucideSend, lucideArchive, lucidePlus, lucideLayoutGrid, lucideSettings })],
  template: `
    <app-component-page slug="sidebar">
      <app-usage
        title="Structure: header, content, footer"
        note="collapsible=none renders the plain flex-column layout — no fixed positioning, no mobile sheet."
        [code]="codeStructure"
      >
        <div sidebarDemoScope class="h-80 w-64 overflow-hidden rounded-lg border">
          <hlm-sidebar collapsible="none" class="h-full w-full">
            <div hlmSidebarHeader>
              <span class="px-s text-sm font-semibold">Acme Inc</span>
            </div>
            <div hlmSidebarContent>
              <div hlmSidebarGroup>
                <div hlmSidebarGroupLabel>Workspace</div>
                <div hlmSidebarGroupContent>
                  <ul hlmSidebarMenu>
                    <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Overview</a></li>
                    <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Projects</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div hlmSidebarFooter>
              <span class="text-muted-foreground px-s text-xs">v1.0.0</span>
            </div>
          </hlm-sidebar>
        </div>
      </app-usage>

      <app-usage
        title="Menu items with icons and badges"
        note="hlm-sidebar-menu-badge is a sibling of the button, positioned by the button's own peer classes."
        [code]="codeIconsAndBadges"
      >
        <div sidebarDemoScope class="h-64 w-64 overflow-hidden rounded-lg border">
          <hlm-sidebar collapsible="none" class="h-full w-full">
            <div hlmSidebarContent>
              <div hlmSidebarGroup>
                <div hlmSidebarGroupLabel>Inbox</div>
                <div hlmSidebarGroupContent>
                  <ul hlmSidebarMenu>
                    <li hlmSidebarMenuItem>
                      <a hlmSidebarMenuButton href="#" isActive>
                        <ng-icon name="lucideInbox" />
                        <span>Inbox</span>
                      </a>
                      <span hlmSidebarMenuBadge>12</span>
                    </li>
                    <li hlmSidebarMenuItem>
                      <a hlmSidebarMenuButton href="#">
                        <ng-icon name="lucideSend" />
                        <span>Sent</span>
                      </a>
                    </li>
                    <li hlmSidebarMenuItem>
                      <a hlmSidebarMenuButton href="#">
                        <ng-icon name="lucideArchive" />
                        <span>Archive</span>
                      </a>
                      <span hlmSidebarMenuBadge>3</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </hlm-sidebar>
        </div>
      </app-usage>

      <app-usage
        title="State-driven: active item"
        note="isActive is bound to a real signal, flipped by (click) — not a hand-set attribute."
        [code]="codeState"
      >
        <div class="flex flex-col gap-s">
          <div sidebarDemoScope class="h-56 w-64 overflow-hidden rounded-lg border">
            <hlm-sidebar collapsible="none" class="h-full w-full">
              <div hlmSidebarContent>
                <div hlmSidebarGroup>
                  <div hlmSidebarGroupLabel>Navigate</div>
                  <div hlmSidebarGroupContent>
                    <ul hlmSidebarMenu>
                      @for (item of navItems; track item.id) {
                        <li hlmSidebarMenuItem>
                          <button
                            type="button"
                            hlmSidebarMenuButton
                            [isActive]="selected() === item.id"
                            (click)="selected.set(item.id)"
                          >
                            <span>{{ item.label }}</span>
                          </button>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </hlm-sidebar>
          </div>
          <p class="text-muted-foreground text-xs">Selected: {{ selected() }}</p>
        </div>
      </app-usage>

      <app-usage
        title="Composition: groups, a submenu, and a group action"
        note="Two groups split by hlmSidebarSeparator; Settings expands into a real hlmSidebarMenuSub."
        [code]="codeComposition"
      >
        <div sidebarDemoScope class="h-96 w-64 overflow-hidden rounded-lg border">
          <hlm-sidebar collapsible="none" class="h-full w-full">
            <div hlmSidebarContent>
              <div hlmSidebarGroup>
                <div hlmSidebarGroupLabel>Platform</div>
                <button hlmSidebarGroupAction aria-label="Add project">
                  <ng-icon name="lucidePlus" />
                </button>
                <div hlmSidebarGroupContent>
                  <ul hlmSidebarMenu>
                    <li hlmSidebarMenuItem>
                      <a hlmSidebarMenuButton href="#">
                        <ng-icon name="lucideLayoutGrid" />
                        <span>Dashboard</span>
                      </a>
                    </li>
                    <li hlmSidebarMenuItem>
                      <a hlmSidebarMenuButton href="#" isActive>
                        <ng-icon name="lucideSettings" />
                        <span>Settings</span>
                      </a>
                      <ul hlmSidebarMenuSub>
                        <li hlmSidebarMenuSubItem>
                          <a hlmSidebarMenuSubButton href="#">General</a>
                        </li>
                        <li hlmSidebarMenuSubItem>
                          <a hlmSidebarMenuSubButton href="#" isActive>Members</a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div hlmSidebarSeparator></div>
              <div hlmSidebarGroup>
                <div hlmSidebarGroupLabel>Support</div>
                <div hlmSidebarGroupContent>
                  <ul hlmSidebarMenu>
                    <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Help center</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </hlm-sidebar>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class SidebarPage {
  protected readonly navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'team', label: 'Team' },
  ];

  /** Drives the state-driven usage's active item. */
  protected readonly selected = signal('overview');

  protected readonly codeStructure = `<hlm-sidebar collapsible="none">
  <div hlmSidebarHeader><span>Acme Inc</span></div>
  <div hlmSidebarContent>
    <div hlmSidebarGroup>
      <div hlmSidebarGroupLabel>Workspace</div>
      <div hlmSidebarGroupContent>
        <ul hlmSidebarMenu>
          <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Overview</a></li>
          <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Projects</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div hlmSidebarFooter><span>v1.0.0</span></div>
</hlm-sidebar>`;

  protected readonly codeIconsAndBadges = `<li hlmSidebarMenuItem>
  <a hlmSidebarMenuButton href="#" isActive>
    <ng-icon name="lucideInbox" />
    <span>Inbox</span>
  </a>
  <span hlmSidebarMenuBadge>12</span>
</li>`;

  protected readonly codeState = `// isActive is bound to a real signal, set by (click) — not hand-set.
navItems = [{ id: 'overview', label: 'Overview' }, /* ... */];
selected = signal('overview');

<ul hlmSidebarMenu>
  @for (item of navItems; track item.id) {
    <li hlmSidebarMenuItem>
      <button hlmSidebarMenuButton [isActive]="selected() === item.id" (click)="selected.set(item.id)">
        <span>{{ item.label }}</span>
      </button>
    </li>
  }
</ul>`;

  protected readonly codeComposition = `<div hlmSidebarGroup>
  <div hlmSidebarGroupLabel>Platform</div>
  <button hlmSidebarGroupAction aria-label="Add project"><ng-icon name="lucidePlus" /></button>
  <div hlmSidebarGroupContent>
    <ul hlmSidebarMenu>
      <li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Dashboard</a></li>
      <li hlmSidebarMenuItem>
        <a hlmSidebarMenuButton href="#" isActive>Settings</a>
        <ul hlmSidebarMenuSub>
          <li hlmSidebarMenuSubItem><a hlmSidebarMenuSubButton href="#">General</a></li>
          <li hlmSidebarMenuSubItem><a hlmSidebarMenuSubButton href="#" isActive>Members</a></li>
        </ul>
      </li>
    </ul>
  </div>
</div>
<div hlmSidebarSeparator></div>
<div hlmSidebarGroup>
  <div hlmSidebarGroupLabel>Support</div>
  <div hlmSidebarGroupContent>
    <ul hlmSidebarMenu><li hlmSidebarMenuItem><a hlmSidebarMenuButton href="#">Help center</a></li></ul>
  </div>
</div>`;
}
