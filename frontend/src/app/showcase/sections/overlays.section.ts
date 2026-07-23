import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmHoverCardImports } from '@spartan-ng/helm/hover-card';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ShowcaseExample } from '../showcase-example';

/**
 * Anything that renders through the CDK overlay. All of these depend on
 * provideSpartanHlm() in app.config: without it Angular 21's popover rendering
 * stacks them above the shell's fixed chrome.
 */
@Component({
  selector: 'app-showcase-overlays',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShowcaseExample,
    HlmAlertDialogImports,
    HlmButtonImports,
    HlmDialogImports,
    HlmDropdownMenuImports,
    HlmHoverCardImports,
    HlmPopoverImports,
    HlmSheetImports,
    HlmTooltipImports,
  ],
  template: `
    <app-showcase-example name="dialog">
      <hlm-dialog>
        <button hlmDialogTrigger hlmBtn variant="outline">Open dialog</button>
        <hlm-dialog-content *hlmDialogPortal class="sm:max-w-100">
          <div hlmDialogHeader>
            <h3 hlmDialogTitle>Edit profile</h3>
            <p hlmDialogDescription>Make changes here, then save.</p>
          </div>
          <div hlmDialogFooter>
            <button hlmDialogClose hlmBtn>Save</button>
          </div>
        </hlm-dialog-content>
      </hlm-dialog>
    </app-showcase-example>

    <app-showcase-example name="alert-dialog">
      <hlm-alert-dialog>
        <button hlmAlertDialogTrigger hlmBtn variant="destructive">Delete</button>
        <hlm-alert-dialog-content *hlmAlertDialogPortal>
          <div hlmAlertDialogHeader>
            <h3 hlmAlertDialogTitle>Are you sure?</h3>
            <p hlmAlertDialogDescription>This cannot be undone.</p>
          </div>
          <div hlmAlertDialogFooter>
            <button hlmAlertDialogCancel>Cancel</button>
            <button hlmAlertDialogAction>Delete</button>
          </div>
        </hlm-alert-dialog-content>
      </hlm-alert-dialog>
    </app-showcase-example>

    <app-showcase-example name="sheet">
      <hlm-sheet>
        <button hlmSheetTrigger hlmBtn variant="outline">Open sheet</button>
        <hlm-sheet-content *hlmSheetPortal>
          <div hlmSheetHeader>
            <h3 hlmSheetTitle>Filters</h3>
            <p hlmSheetDescription>Narrow the list down.</p>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    </app-showcase-example>

    <app-showcase-example name="popover">
      <hlm-popover>
        <button hlmPopoverTrigger hlmBtn variant="outline">Open popover</button>
        <div hlmPopoverContent *hlmPopoverPortal class="w-64">
          <p>Anchored content, positioned by the CDK.</p>
        </div>
      </hlm-popover>
    </app-showcase-example>

    <app-showcase-example name="hover-card">
      <hlm-hover-card>
        <button hlmHoverCardTrigger hlmBtn variant="link">&#64;ada</button>
        <div hlmHoverCardContent *hlmHoverCardPortal class="w-64">
          <p>Ada Lovelace — first programmer.</p>
        </div>
      </hlm-hover-card>
    </app-showcase-example>

    <app-showcase-example name="tooltip">
      <button hlmBtn variant="outline" hlmTooltip="Deletes the record">Hover me</button>
    </app-showcase-example>

    <app-showcase-example name="dropdown-menu">
      <button hlmBtn variant="outline" [hlmDropdownMenuTrigger]="menu">Open menu</button>
      <ng-template #menu>
        <hlm-dropdown-menu class="w-48">
          <div hlmDropdownMenuLabel>Account</div>
          <hlm-dropdown-menu-separator />
          <button hlmDropdownMenuItem>Profile</button>
          <button hlmDropdownMenuItem>Settings</button>
        </hlm-dropdown-menu>
      </ng-template>
    </app-showcase-example>
  `,
})
export class ShowcaseOverlays {}
