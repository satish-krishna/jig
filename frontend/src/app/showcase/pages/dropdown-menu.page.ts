import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideFilePlus, lucideLogOut, lucideMail, lucideMessageSquare, lucideSave, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Dropdown menu usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source (frontend/libs/ui/dropdown-menu): this is Angular CDK Menu
 * (`@angular/cdk/menu`), not the Brn dialog-style portal — the trigger's
 * `[hlmDropdownMenuTrigger]` input takes a `TemplateRef` (an `#menu` template
 * variable), and CdkMenuTrigger opens it into a CDK overlay appended to
 * `document.body`. That template binding is this component's equivalent of
 * the "named projection slot" trap: skip it and the trigger button renders
 * but has nothing to open. Checkbox/radio items are driven by the item's own
 * `checked` input and `triggered` output — never a hand-set `data-checked` —
 * confirmed against the "Radio group" example in the spartan docs, which
 * binds exactly this way.
 */
@Component({
  selector: 'app-dropdown-menu-page',
  imports: [ComponentPage, Usage, HlmDropdownMenuImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideBell, lucideFilePlus, lucideLogOut, lucideMail, lucideMessageSquare, lucideSave, lucideTrash2 })],
  template: `
    <app-component-page slug="dropdown-menu">
      <app-usage title="Account menu" note="A label, two grouped items and a disabled item." [code]="codeDefault">
        <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="accountMenu">Account</button>

        <ng-template #accountMenu>
          <hlm-dropdown-menu class="w-48">
            <hlm-dropdown-menu-group>
              <hlm-dropdown-menu-label>My Account</hlm-dropdown-menu-label>
              <button hlmDropdownMenuItem>Profile</button>
              <button hlmDropdownMenuItem>Billing</button>
              <button hlmDropdownMenuItem disabled>Team (coming soon)</button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem>
              <ng-icon name="lucideLogOut" />
              Log out
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="With icons and shortcuts"
        note="Icons lead each label; hlm-dropdown-menu-shortcut trails it. A destructive item gets its own color via variant."
        [code]="codeIcons"
      >
        <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="fileMenu">File</button>

        <ng-template #fileMenu>
          <hlm-dropdown-menu class="w-48">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideFilePlus" />
                New file
                <hlm-dropdown-menu-shortcut>⌘N</hlm-dropdown-menu-shortcut>
              </button>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideSave" />
                Save
                <hlm-dropdown-menu-shortcut>⌘S</hlm-dropdown-menu-shortcut>
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem variant="destructive">
              <ng-icon name="lucideTrash2" />
              Delete
              <hlm-dropdown-menu-shortcut>⌘⌫</hlm-dropdown-menu-shortcut>
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="Checkboxes, a radio group and a submenu"
        [note]="'Theme: ' + theme() + ' · status bar ' + (statusBar() ? 'on' : 'off') + ' — every check is a real signal.'"
        [code]="codeCheckRadioSub"
      >
        <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="viewMenu">View</button>

        <ng-template #viewMenu>
          <hlm-dropdown-menu class="w-56">
            <hlm-dropdown-menu-group>
              <hlm-dropdown-menu-label>Appearance</hlm-dropdown-menu-label>
              <button hlmDropdownMenuCheckbox [checked]="statusBar()" (triggered)="statusBar.set(!statusBar())">
                Status bar
                <hlm-dropdown-menu-checkbox-indicator />
              </button>
              <button hlmDropdownMenuCheckbox [checked]="minimap()" (triggered)="minimap.set(!minimap())">
                Minimap
                <hlm-dropdown-menu-checkbox-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <hlm-dropdown-menu-group>
              <hlm-dropdown-menu-label>Theme</hlm-dropdown-menu-label>
              <button hlmDropdownMenuRadio [checked]="theme() === 'system'" (triggered)="theme.set('system')">
                System
                <hlm-dropdown-menu-radio-indicator />
              </button>
              <button hlmDropdownMenuRadio [checked]="theme() === 'light'" (triggered)="theme.set('light')">
                Light
                <hlm-dropdown-menu-radio-indicator />
              </button>
              <button hlmDropdownMenuRadio [checked]="theme() === 'dark'" (triggered)="theme.set('dark')">
                Dark
                <hlm-dropdown-menu-radio-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="zoomMenu" align="start" side="right">
              Zoom
              <hlm-dropdown-menu-item-sub-indicator />
            </button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #zoomMenu>
          <hlm-dropdown-menu-sub class="w-32">
            <button hlmDropdownMenuItem>Zoom in</button>
            <button hlmDropdownMenuItem>Zoom out</button>
            <button hlmDropdownMenuItem>Reset zoom</button>
          </hlm-dropdown-menu-sub>
        </ng-template>
      </app-usage>

      <app-usage
        title="Composition: notification settings"
        [note]="'Email ' + (notifyEmail() ? 'on' : 'off') + ', SMS ' + (notifySms() ? 'on' : 'off') + '.'"
        [code]="codeComposition"
      >
        <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="notifyMenu">
          <ng-icon name="lucideBell" />
          Notifications
        </button>

        <ng-template #notifyMenu>
          <hlm-dropdown-menu class="w-56">
            <hlm-dropdown-menu-group>
              <hlm-dropdown-menu-label>Channels</hlm-dropdown-menu-label>
              <button hlmDropdownMenuCheckbox [checked]="notifyEmail()" (triggered)="notifyEmail.set(!notifyEmail())">
                <ng-icon name="lucideMail" />
                Email
                <hlm-dropdown-menu-checkbox-indicator />
              </button>
              <button hlmDropdownMenuCheckbox [checked]="notifySms()" (triggered)="notifySms.set(!notifySms())">
                <ng-icon name="lucideMessageSquare" />
                SMS
                <hlm-dropdown-menu-checkbox-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem>
              Mark all as read
              <hlm-dropdown-menu-shortcut>⌘⇧A</hlm-dropdown-menu-shortcut>
            </button>
            <button hlmDropdownMenuItem disabled>Snooze (no active alerts)</button>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem variant="destructive">
              <ng-icon name="lucideTrash2" />
              Clear all
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>
    </app-component-page>
  `,
})
export class DropdownMenuPage {
  protected readonly statusBar = signal(true);
  protected readonly minimap = signal(false);
  protected readonly theme = signal<'system' | 'light' | 'dark'>('system');
  protected readonly notifyEmail = signal(true);
  protected readonly notifySms = signal(false);

  protected readonly codeDefault = `<button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="accountMenu">Account</button>

<ng-template #accountMenu>
  <hlm-dropdown-menu class="w-48">
    <hlm-dropdown-menu-group>
      <hlm-dropdown-menu-label>My Account</hlm-dropdown-menu-label>
      <button hlmDropdownMenuItem>Profile</button>
      <button hlmDropdownMenuItem>Billing</button>
      <button hlmDropdownMenuItem disabled>Team (coming soon)</button>
    </hlm-dropdown-menu-group>
    <hlm-dropdown-menu-separator />
    <button hlmDropdownMenuItem>
      <ng-icon name="lucideLogOut" />
      Log out
    </button>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeIcons = `<button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="fileMenu">File</button>

<ng-template #fileMenu>
  <hlm-dropdown-menu class="w-48">
    <button hlmDropdownMenuItem>
      <ng-icon name="lucideFilePlus" />
      New file
      <hlm-dropdown-menu-shortcut>⌘N</hlm-dropdown-menu-shortcut>
    </button>
    <button hlmDropdownMenuItem variant="destructive">
      <ng-icon name="lucideTrash2" />
      Delete
      <hlm-dropdown-menu-shortcut>⌘⌫</hlm-dropdown-menu-shortcut>
    </button>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeCheckRadioSub = `// checked/triggered are real signal bindings, not hand-set attributes.
statusBar = signal(true);
theme = signal<'system' | 'light' | 'dark'>('system');

<button hlmDropdownMenuCheckbox [checked]="statusBar()" (triggered)="statusBar.set(!statusBar())">
  Status bar
  <hlm-dropdown-menu-checkbox-indicator />
</button>
<button hlmDropdownMenuRadio [checked]="theme() === 'dark'" (triggered)="theme.set('dark')">
  Dark
  <hlm-dropdown-menu-radio-indicator />
</button>
<button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="zoomMenu" side="right">
  Zoom
  <hlm-dropdown-menu-item-sub-indicator />
</button>

<ng-template #zoomMenu>
  <hlm-dropdown-menu-sub>
    <button hlmDropdownMenuItem>Zoom in</button>
    <button hlmDropdownMenuItem>Zoom out</button>
  </hlm-dropdown-menu-sub>
</ng-template>`;

  protected readonly codeComposition = `<button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="notifyMenu">
  <ng-icon name="lucideBell" />
  Notifications
</button>

<ng-template #notifyMenu>
  <hlm-dropdown-menu class="w-56">
    <hlm-dropdown-menu-group>
      <hlm-dropdown-menu-label>Channels</hlm-dropdown-menu-label>
      <button hlmDropdownMenuCheckbox [checked]="notifyEmail()" (triggered)="notifyEmail.set(!notifyEmail())">
        <ng-icon name="lucideMail" />
        Email
        <hlm-dropdown-menu-checkbox-indicator />
      </button>
    </hlm-dropdown-menu-group>
    <hlm-dropdown-menu-separator />
    <button hlmDropdownMenuItem>Mark all as read</button>
    <button hlmDropdownMenuItem disabled>Snooze (no active alerts)</button>
    <hlm-dropdown-menu-separator />
    <button hlmDropdownMenuItem variant="destructive">
      <ng-icon name="lucideTrash2" />
      Clear all
    </button>
  </hlm-dropdown-menu>
</ng-template>`;
}
