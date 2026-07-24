import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideCircleHelp, lucideCog, lucideCreditCard, lucideHouse, lucideInbox, lucideUser } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import type { BrnDialogState } from '@spartan-ng/brain/dialog';
import { HlmCommandImports } from '@spartan-ng/helm/command';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Command usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source (frontend/libs/ui/command and
 * @spartan-ng/brain/command): unlike the other three Menus components,
 * `hlm-command` is a PLAIN component — `BrnCommand`'s host directive renders
 * inline wherever it is placed, with no CDK overlay of its own, so the first
 * and third usages below render straight into the fixture. `hlm-command-dialog`
 * is the one place an overlay shows up: it wraps the exact same `hlm-dialog` /
 * `*hlmDialogPortal` machinery `dialog.page.ts` uses, so those two usages
 * follow dialog's absent-then-present, click-then-`document.body` pattern.
 * Filtering is real: `BrnCommand`'s default filter is
 * `value.toLowerCase().includes(search.toLowerCase())` against each item's
 * `value`, and typing drives it through `hlm-command-input`'s native
 * `(input)` listener — never a hand-set `data-hidden`.
 */
@Component({
  selector: 'app-command-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmCommandImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideCalendar, lucideCircleHelp, lucideCog, lucideCreditCard, lucideHouse, lucideInbox, lucideUser })],
  template: `
    <app-component-page slug="command">
      <app-usage
        title="Inline command list"
        [note]="lastSelected() ? 'Selected: ' + lastSelected() : 'Nothing selected yet — try typing \\'cal\\'.'"
        [code]="codeDefault"
      >
        <hlm-command class="w-full max-w-xs border">
          <hlm-command-input placeholder="Type a command or search..." />
          <hlm-command-list>
            <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
            <hlm-command-group>
              <hlm-command-group-label>Suggestions</hlm-command-group-label>
              <button hlm-command-item value="Calendar" (selected)="lastSelected.set('Calendar')">Calendar</button>
              <button hlm-command-item value="Calculator" (selected)="lastSelected.set('Calculator')">Calculator</button>
            </hlm-command-group>
            <hlm-command-separator />
            <hlm-command-group>
              <hlm-command-group-label>Settings</hlm-command-group-label>
              <button hlm-command-item value="Profile" (selected)="lastSelected.set('Profile')">
                Profile
                <hlm-command-shortcut>⌘P</hlm-command-shortcut>
              </button>
            </hlm-command-group>
          </hlm-command-list>
        </hlm-command>
      </app-usage>

      <app-usage
        title="With icons and shortcuts, in a dialog"
        note="hlm-command-dialog wraps hlm-command in the same overlay dialog.page.ts uses."
        [code]="codeIcons"
      >
        <button hlmBtn variant="outline" (click)="iconsState.set('open')">Open command palette</button>

        <hlm-command-dialog [state]="iconsState()" (stateChange)="iconsState.set($event)">
          <hlm-command>
            <hlm-command-input placeholder="Type a command or search..." />
            <hlm-command-list>
              <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
              <hlm-command-group>
                <button hlm-command-item value="Profile">
                  <ng-icon name="lucideUser" />
                  Profile
                  <hlm-command-shortcut>⌘P</hlm-command-shortcut>
                </button>
                <button hlm-command-item value="Billing">
                  <ng-icon name="lucideCreditCard" />
                  Billing
                  <hlm-command-shortcut>⌘B</hlm-command-shortcut>
                </button>
                <button hlm-command-item value="Settings" disabled>
                  <ng-icon name="lucideCog" />
                  Settings (unavailable)
                </button>
              </hlm-command-group>
            </hlm-command-list>
          </hlm-command>
        </hlm-command-dialog>
      </app-usage>

      <app-usage
        title="Controlled filter"
        [note]="'Query: ' + (query() || '(empty)')"
        [code]="codeControlled"
      >
        <div class="grid w-full max-w-xs gap-2">
          <div class="flex gap-2">
            <button hlmBtn size="sm" variant="outline" (click)="query.set('')">All</button>
            <button hlmBtn size="sm" variant="outline" (click)="query.set('play')">Playback</button>
            <button hlmBtn size="sm" variant="outline" (click)="query.set('vol')">Volume</button>
          </div>
          <hlm-command [search]="query()" (searchChange)="query.set($event)" class="border">
            <hlm-command-input placeholder="Type a command or search..." />
            <hlm-command-list>
              <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
              <hlm-command-group>
                <button hlm-command-item value="Play or pause">Play/Pause</button>
                <button hlm-command-item value="Play next track">Play next track</button>
                <button hlm-command-item value="Volume up">Volume up</button>
                <button hlm-command-item value="Volume down">Volume down</button>
              </hlm-command-group>
            </hlm-command-list>
          </hlm-command>
        </div>
      </app-usage>

      <app-usage
        title="Composition: full command palette"
        note="Multiple groups, icons, shortcuts and a disabled item, opened from a button."
        [code]="codeComposition"
      >
        <button hlmBtn variant="outline" (click)="paletteState.set('open')">
          Open command palette
          <hlm-command-shortcut>⌘K</hlm-command-shortcut>
        </button>

        <hlm-command-dialog [state]="paletteState()" (stateChange)="paletteState.set($event)">
          <hlm-command>
            <hlm-command-input placeholder="Type a command or search..." />
            <hlm-command-list>
              <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
              <hlm-command-group>
                <hlm-command-group-label>Navigation</hlm-command-group-label>
                <button hlm-command-item value="Home">
                  <ng-icon name="lucideHouse" />
                  Home
                  <hlm-command-shortcut>⌘H</hlm-command-shortcut>
                </button>
                <button hlm-command-item value="Inbox">
                  <ng-icon name="lucideInbox" />
                  Inbox
                  <hlm-command-shortcut>⌘I</hlm-command-shortcut>
                </button>
              </hlm-command-group>
              <hlm-command-separator />
              <hlm-command-group>
                <hlm-command-group-label>Account</hlm-command-group-label>
                <button hlm-command-item value="Billing">
                  <ng-icon name="lucideCreditCard" />
                  Billing
                </button>
                <button hlm-command-item value="Notifications" disabled>Notifications (paused)</button>
              </hlm-command-group>
              <hlm-command-separator />
              <hlm-command-group>
                <button hlm-command-item value="Help">
                  <ng-icon name="lucideCircleHelp" />
                  Help & Support
                </button>
              </hlm-command-group>
            </hlm-command-list>
          </hlm-command>
        </hlm-command-dialog>
      </app-usage>
    </app-component-page>
  `,
})
export class CommandPage {
  protected readonly lastSelected = signal<string | undefined>(undefined);
  protected readonly iconsState = signal<BrnDialogState>('closed');
  protected readonly query = signal('');
  protected readonly paletteState = signal<BrnDialogState>('closed');

  protected readonly codeDefault = `lastSelected = signal<string | undefined>(undefined);

<hlm-command>
  <hlm-command-input placeholder="Type a command or search..." />
  <hlm-command-list>
    <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
    <hlm-command-group>
      <hlm-command-group-label>Suggestions</hlm-command-group-label>
      <button hlm-command-item value="Calendar" (selected)="lastSelected.set('Calendar')">Calendar</button>
      <button hlm-command-item value="Calculator" (selected)="lastSelected.set('Calculator')">Calculator</button>
    </hlm-command-group>
    <hlm-command-separator />
    <hlm-command-group>
      <hlm-command-group-label>Settings</hlm-command-group-label>
      <button hlm-command-item value="Profile" (selected)="lastSelected.set('Profile')">
        Profile
        <hlm-command-shortcut>⌘P</hlm-command-shortcut>
      </button>
    </hlm-command-group>
  </hlm-command-list>
</hlm-command>`;

  protected readonly codeIcons = `iconsState = signal<BrnDialogState>('closed');

<button hlmBtn (click)="iconsState.set('open')">Open command palette</button>

<hlm-command-dialog [state]="iconsState()" (stateChange)="iconsState.set($event)">
  <hlm-command>
    <hlm-command-input placeholder="Type a command or search..." />
    <hlm-command-list>
      <hlm-command-group>
        <button hlm-command-item value="Profile">
          <ng-icon name="lucideUser" />
          Profile
          <hlm-command-shortcut>⌘P</hlm-command-shortcut>
        </button>
        <button hlm-command-item value="Settings" disabled>
          <ng-icon name="lucideCog" />
          Settings (unavailable)
        </button>
      </hlm-command-group>
    </hlm-command-list>
  </hlm-command>
</hlm-command-dialog>`;

  protected readonly codeControlled = `// [search]/(searchChange) is a real two-way model() on BrnCommand — the preset
// buttons drive the same query a typed search would.
query = signal('');

<button (click)="query.set('play')">Playback</button>

<hlm-command [search]="query()" (searchChange)="query.set($event)">
  <hlm-command-input placeholder="Type a command or search..." />
  <hlm-command-list>
    <hlm-command-group>
      <button hlm-command-item value="Play or pause">Play/Pause</button>
      <button hlm-command-item value="Volume up">Volume up</button>
    </hlm-command-group>
  </hlm-command-list>
</hlm-command>`;

  protected readonly codeComposition = `paletteState = signal<BrnDialogState>('closed');

<button hlmBtn (click)="paletteState.set('open')">
  Open command palette
  <hlm-command-shortcut>⌘K</hlm-command-shortcut>
</button>

<hlm-command-dialog [state]="paletteState()" (stateChange)="paletteState.set($event)">
  <hlm-command>
    <hlm-command-input placeholder="Type a command or search..." />
    <hlm-command-list>
      <hlm-command-group>
        <hlm-command-group-label>Navigation</hlm-command-group-label>
        <button hlm-command-item value="Home">
          <ng-icon name="lucideHouse" />
          Home
          <hlm-command-shortcut>⌘H</hlm-command-shortcut>
        </button>
      </hlm-command-group>
      <hlm-command-separator />
      <hlm-command-group>
        <hlm-command-group-label>Account</hlm-command-group-label>
        <button hlm-command-item value="Notifications" disabled>Notifications (paused)</button>
      </hlm-command-group>
    </hlm-command-list>
  </hlm-command>
</hlm-command-dialog>`;
}
