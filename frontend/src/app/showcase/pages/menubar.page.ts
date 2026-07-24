import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideFile, lucideFolder, lucideSave, lucideSettings, lucideTrash } from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmMenubarImports } from '@spartan-ng/helm/menubar';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Menubar usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source (frontend/libs/ui/menubar): `HlmMenubarImports` supplies
 * only `HlmMenubar` (the bar) and `HlmMenubarTrigger` (a `button` hosting
 * `CdkMenuItem` + `CdkMenuTrigger`) — the dropdown panel underneath each
 * trigger is the SAME `hlm-dropdown-menu` the dropdown-menu component uses,
 * wired through the identical `[hlmMenubarTrigger]="menu"` → `#menu`
 * ng-template binding. Skip that binding and the trigger button renders with
 * nothing to open. Each panel opens into the CDK overlay under
 * `document.body`, same as dropdown-menu and context-menu.
 */
@Component({
  selector: 'app-menubar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmMenubarImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideCircleHelp, lucideFile, lucideFolder, lucideSave, lucideSettings, lucideTrash })],
  template: `
    <app-component-page slug="menubar">
      <app-usage title="Basic" note="A File menu and an Edit menu, each a plain item list." [code]="codeDefault">
        <hlm-menubar>
          <button [hlmMenubarTrigger]="fileMenu">File</button>
          <button [hlmMenubarTrigger]="editMenu">Edit</button>
        </hlm-menubar>

        <ng-template #fileMenu>
          <hlm-dropdown-menu sideOffset="2">
            <button hlmDropdownMenuItem>New Tab</button>
            <button hlmDropdownMenuItem>New Window</button>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem>Print</button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #editMenu>
          <hlm-dropdown-menu sideOffset="2">
            <button hlmDropdownMenuItem>Cut</button>
            <button hlmDropdownMenuItem>Copy</button>
            <button hlmDropdownMenuItem>Paste</button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="With icons and shortcuts"
        note="Each item leads with an icon; New File trails with its shortcut."
        [code]="codeIcons"
      >
        <hlm-menubar>
          <button [hlmMenubarTrigger]="iconFileMenu">File</button>
        </hlm-menubar>

        <ng-template #iconFileMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-48">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideFile" />
                New File
                <hlm-dropdown-menu-shortcut>⌘N</hlm-dropdown-menu-shortcut>
              </button>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideFolder" />
                Open Folder
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem>
              <ng-icon name="lucideSave" />
              Save
              <hlm-dropdown-menu-shortcut>⌘S</hlm-dropdown-menu-shortcut>
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="Checkboxes and a radio group"
        [note]="'Full URLs ' + (fullUrls() ? 'shown' : 'hidden') + ' · profile ' + profile() + '.'"
        [code]="codeCheckRadio"
      >
        <hlm-menubar>
          <button [hlmMenubarTrigger]="viewMenu">View</button>
          <button [hlmMenubarTrigger]="profilesMenu">Profiles</button>
        </hlm-menubar>

        <ng-template #viewMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-56">
            <button hlmDropdownMenuCheckbox [checked]="bookmarksBar()" (triggered)="bookmarksBar.set(!bookmarksBar())">
              Bookmarks Bar
              <hlm-dropdown-menu-checkbox-indicator />
            </button>
            <button hlmDropdownMenuCheckbox [checked]="fullUrls()" (triggered)="fullUrls.set(!fullUrls())">
              Full URLs
              <hlm-dropdown-menu-checkbox-indicator />
            </button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #profilesMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-40">
            <button hlmDropdownMenuRadio [checked]="profile() === 'andy'" (triggered)="profile.set('andy')">
              Andy
              <hlm-dropdown-menu-radio-indicator />
            </button>
            <button hlmDropdownMenuRadio [checked]="profile() === 'benoit'" (triggered)="profile.set('benoit')">
              Benoit
              <hlm-dropdown-menu-radio-indicator />
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="Composition: a small app menubar"
        [note]="'Word wrap ' + (wordWrap() ? 'on' : 'off') + '.'"
        [code]="codeComposition"
      >
        <hlm-menubar>
          <button [hlmMenubarTrigger]="appFileMenu">File</button>
          <button [hlmMenubarTrigger]="appViewMenu">View</button>
          <button [hlmMenubarTrigger]="appHelpMenu">Help</button>
        </hlm-menubar>

        <ng-template #appFileMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-48">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideFile" />
                New File
                <hlm-dropdown-menu-shortcut>⌘N</hlm-dropdown-menu-shortcut>
              </button>
              <button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="openRecentMenu" align="start" side="right">
                Open Recent
                <hlm-dropdown-menu-item-sub-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem disabled>Close Window</button>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem variant="destructive">
              <ng-icon name="lucideTrash" />
              Delete File
            </button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #openRecentMenu>
          <hlm-dropdown-menu-sub class="w-44">
            <button hlmDropdownMenuItem>report.docx</button>
            <button hlmDropdownMenuItem>budget.xlsx</button>
          </hlm-dropdown-menu-sub>
        </ng-template>

        <ng-template #appViewMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-48">
            <button hlmDropdownMenuCheckbox [checked]="wordWrap()" (triggered)="wordWrap.set(!wordWrap())">
              <ng-icon name="lucideSettings" />
              Word Wrap
              <hlm-dropdown-menu-checkbox-indicator />
            </button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #appHelpMenu>
          <hlm-dropdown-menu sideOffset="2" class="w-40">
            <button hlmDropdownMenuItem>
              <ng-icon name="lucideCircleHelp" />
              Documentation
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>
    </app-component-page>
  `,
})
export class MenubarPage {
  protected readonly fullUrls = signal(false);
  protected readonly bookmarksBar = signal(true);
  protected readonly profile = signal<'andy' | 'benoit'>('benoit');
  protected readonly wordWrap = signal(false);

  protected readonly codeDefault = `<hlm-menubar>
  <button [hlmMenubarTrigger]="fileMenu">File</button>
  <button [hlmMenubarTrigger]="editMenu">Edit</button>
</hlm-menubar>

<ng-template #fileMenu>
  <hlm-dropdown-menu sideOffset="2">
    <button hlmDropdownMenuItem>New Tab</button>
    <button hlmDropdownMenuItem>New Window</button>
    <hlm-dropdown-menu-separator />
    <button hlmDropdownMenuItem>Print</button>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeIcons = `<hlm-menubar>
  <button [hlmMenubarTrigger]="fileMenu">File</button>
</hlm-menubar>

<ng-template #fileMenu>
  <hlm-dropdown-menu sideOffset="2" class="w-48">
    <button hlmDropdownMenuItem>
      <ng-icon name="lucideFile" />
      New File
      <hlm-dropdown-menu-shortcut>⌘N</hlm-dropdown-menu-shortcut>
    </button>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeCheckRadio = `// checked/triggered bind to real signals; nothing is hand-set.
fullUrls = signal(false);
profile = signal<'andy' | 'benoit'>('benoit');

<button hlmDropdownMenuCheckbox [checked]="fullUrls()" (triggered)="fullUrls.set(!fullUrls())">
  Full URLs
  <hlm-dropdown-menu-checkbox-indicator />
</button>
<button hlmDropdownMenuRadio [checked]="profile() === 'andy'" (triggered)="profile.set('andy')">
  Andy
  <hlm-dropdown-menu-radio-indicator />
</button>`;

  protected readonly codeComposition = `<hlm-menubar>
  <button [hlmMenubarTrigger]="appFileMenu">File</button>
  <button [hlmMenubarTrigger]="appViewMenu">View</button>
  <button [hlmMenubarTrigger]="appHelpMenu">Help</button>
</hlm-menubar>

<ng-template #appFileMenu>
  <hlm-dropdown-menu sideOffset="2" class="w-48">
    <button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="openRecentMenu" side="right">
      Open Recent
      <hlm-dropdown-menu-item-sub-indicator />
    </button>
    <button hlmDropdownMenuItem disabled>Close Window</button>
    <button hlmDropdownMenuItem variant="destructive">Delete File</button>
  </hlm-dropdown-menu>
</ng-template>

<ng-template #openRecentMenu>
  <hlm-dropdown-menu-sub>
    <button hlmDropdownMenuItem>report.docx</button>
  </hlm-dropdown-menu-sub>
</ng-template>`;
}
