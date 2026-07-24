import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClipboardPaste, lucideCopy, lucidePencil, lucideScissors, lucideShare, lucideTrash } from '@ng-icons/lucide';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Context menu usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source (frontend/libs/ui/context-menu): `HlmContextMenuTrigger`
 * hosts `CdkContextMenuTrigger`, which listens for the native `contextmenu`
 * event (right-click / long-press), not `click` — every trigger below is
 * opened in its spec with a dispatched `contextmenu` event. The panel itself
 * is the SAME `hlm-dropdown-menu` component dropdown-menu uses (see
 * `HlmContextMenuImports` — it exports only the trigger directive), wired
 * through the identical `[hlmContextMenuTrigger]="menu"` → `#menu` ng-template
 * binding, so the same "trigger has nothing to open without it" trap applies.
 */
@Component({
  selector: 'app-context-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmContextMenuImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideClipboardPaste, lucideCopy, lucidePencil, lucideScissors, lucideShare, lucideTrash })],
  template: `
    <app-component-page slug="context-menu">
      <app-usage title="Basic" note="Right-click (or long-press) the dashed box." [code]="codeDefault">
        <div
          [hlmContextMenuTrigger]="basicMenu"
          class="flex aspect-video w-full min-w-3xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          Right click here
        </div>

        <ng-template #basicMenu>
          <hlm-dropdown-menu>
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem>Back</button>
              <button hlmDropdownMenuItem disabled>Forward</button>
              <button hlmDropdownMenuItem>Reload</button>
            </hlm-dropdown-menu-group>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="With icons and shortcuts"
        note="Editor-style edit actions, each with an icon and a keyboard shortcut."
        [code]="codeIcons"
      >
        <div
          [hlmContextMenuTrigger]="editMenu"
          class="flex aspect-video w-full min-w-3xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          Right click here
        </div>

        <ng-template #editMenu>
          <hlm-dropdown-menu class="w-40">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideCopy" />
                Copy
                <hlm-dropdown-menu-shortcut>⌘C</hlm-dropdown-menu-shortcut>
              </button>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideScissors" />
                Cut
                <hlm-dropdown-menu-shortcut>⌘X</hlm-dropdown-menu-shortcut>
              </button>
              <button hlmDropdownMenuItem>
                <ng-icon name="lucideClipboardPaste" />
                Paste
                <hlm-dropdown-menu-shortcut>⌘V</hlm-dropdown-menu-shortcut>
              </button>
            </hlm-dropdown-menu-group>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>

      <app-usage
        title="Checkboxes, a radio group and a submenu"
        [note]="'Full URLs ' + (fullUrls() ? 'shown' : 'hidden') + ' · sort by ' + sortBy() + '.'"
        [code]="codeCheckRadioSub"
      >
        <div
          [hlmContextMenuTrigger]="viewMenu"
          class="flex aspect-video w-full min-w-3xs items-center justify-center rounded-xl border border-dashed text-sm"
        >
          Right click here
        </div>

        <ng-template #viewMenu>
          <hlm-dropdown-menu class="w-56">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuCheckbox [checked]="fullUrls()" (triggered)="fullUrls.set(!fullUrls())">
                Show full URLs
                <hlm-dropdown-menu-checkbox-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <hlm-dropdown-menu-group>
              <hlm-dropdown-menu-label>Sort by</hlm-dropdown-menu-label>
              <button hlmDropdownMenuRadio [checked]="sortBy() === 'name'" (triggered)="sortBy.set('name')">
                Name
                <hlm-dropdown-menu-radio-indicator />
              </button>
              <button hlmDropdownMenuRadio [checked]="sortBy() === 'date'" (triggered)="sortBy.set('date')">
                Date modified
                <hlm-dropdown-menu-radio-indicator />
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="moreTools" align="start" side="right">
              More Tools
              <hlm-dropdown-menu-item-sub-indicator />
            </button>
          </hlm-dropdown-menu>
        </ng-template>

        <ng-template #moreTools>
          <hlm-dropdown-menu-sub class="w-44">
            <button hlmDropdownMenuItem>Save Page...</button>
            <button hlmDropdownMenuItem>Developer Tools</button>
          </hlm-dropdown-menu-sub>
        </ng-template>
      </app-usage>

      <app-usage
        title="Composition: a file row"
        [note]="lastAction() ? 'Last action: ' + lastAction() : 'No action yet — right-click the row.'"
        [code]="codeComposition"
      >
        <div
          [hlmContextMenuTrigger]="fileMenu"
          class="flex w-full min-w-3xs items-center justify-between rounded-lg border px-3 py-2 text-sm"
        >
          <span>quarterly-report.pdf</span>
          <span class="text-muted-foreground text-xs">Right click for actions</span>
        </div>

        <ng-template #fileMenu>
          <hlm-dropdown-menu class="w-44">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem (triggered)="lastAction.set('rename')">
                <ng-icon name="lucidePencil" />
                Rename
              </button>
              <button hlmDropdownMenuItem (triggered)="lastAction.set('share')">
                <ng-icon name="lucideShare" />
                Share
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator />
            <button hlmDropdownMenuItem variant="destructive" (triggered)="lastAction.set('delete')">
              <ng-icon name="lucideTrash" />
              Delete
            </button>
          </hlm-dropdown-menu>
        </ng-template>
      </app-usage>
    </app-component-page>
  `,
})
export class ContextMenuPage {
  protected readonly fullUrls = signal(false);
  protected readonly sortBy = signal<'name' | 'date'>('name');
  protected readonly lastAction = signal<string | undefined>(undefined);

  protected readonly codeDefault = `<div [hlmContextMenuTrigger]="menu">Right click here</div>

<ng-template #menu>
  <hlm-dropdown-menu>
    <hlm-dropdown-menu-group>
      <button hlmDropdownMenuItem>Back</button>
      <button hlmDropdownMenuItem disabled>Forward</button>
      <button hlmDropdownMenuItem>Reload</button>
    </hlm-dropdown-menu-group>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeIcons = `<ng-template #menu>
  <hlm-dropdown-menu class="w-40">
    <button hlmDropdownMenuItem>
      <ng-icon name="lucideCopy" />
      Copy
      <hlm-dropdown-menu-shortcut>⌘C</hlm-dropdown-menu-shortcut>
    </button>
    <button hlmDropdownMenuItem>
      <ng-icon name="lucideScissors" />
      Cut
      <hlm-dropdown-menu-shortcut>⌘X</hlm-dropdown-menu-shortcut>
    </button>
  </hlm-dropdown-menu>
</ng-template>`;

  protected readonly codeCheckRadioSub = `// checked/triggered bind to real signals; nothing is hand-set.
fullUrls = signal(false);
sortBy = signal<'name' | 'date'>('name');

<button hlmDropdownMenuCheckbox [checked]="fullUrls()" (triggered)="fullUrls.set(!fullUrls())">
  Show full URLs
  <hlm-dropdown-menu-checkbox-indicator />
</button>
<button hlmDropdownMenuRadio [checked]="sortBy() === 'date'" (triggered)="sortBy.set('date')">
  Date modified
  <hlm-dropdown-menu-radio-indicator />
</button>
<button hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="moreTools" side="right">
  More Tools
  <hlm-dropdown-menu-item-sub-indicator />
</button>`;

  protected readonly codeComposition = `lastAction = signal<string | undefined>(undefined);

<div [hlmContextMenuTrigger]="fileMenu" class="flex items-center justify-between rounded-lg border px-3 py-2">
  <span>quarterly-report.pdf</span>
</div>

<ng-template #fileMenu>
  <hlm-dropdown-menu class="w-44">
    <button hlmDropdownMenuItem (triggered)="lastAction.set('rename')">
      <ng-icon name="lucidePencil" />
      Rename
    </button>
    <hlm-dropdown-menu-separator />
    <button hlmDropdownMenuItem variant="destructive" (triggered)="lastAction.set('delete')">
      <ng-icon name="lucideTrash" />
      Delete
    </button>
  </hlm-dropdown-menu>
</ng-template>`;
}
