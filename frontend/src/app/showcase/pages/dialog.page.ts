import { Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Dialog usages. Anatomy confirmed against the spartan MCP docs: dialog
 * content sits behind the `*hlmDialogPortal` structural directive and is not
 * in the DOM until the trigger opens it (Angular CDK renders it into an
 * overlay appended to `document.body`, not the component host), and every
 * dialog carries a real `hlmDialogTitle` for accessibility.
 */
@Component({
  selector: 'app-dialog-page',
  imports: [ComponentPage, Usage, HlmDialogImports, HlmButtonImports, HlmFieldImports, HlmInputImports],
  template: `
    <app-component-page slug="dialog">
      <app-usage
        title="Edit profile"
        note="A form inside the dialog body, closed by either footer button."
        [code]="codeDefault"
      >
        <hlm-dialog>
          <button hlmDialogTrigger hlmBtn variant="outline">Edit profile</button>
          <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
            <hlm-dialog-header>
              <h3 hlmDialogTitle>Edit profile</h3>
              <p hlmDialogDescription>Make changes to your profile here. Click save when you're done.</p>
            </hlm-dialog-header>
            <div hlmField>
              <label hlmFieldLabel for="dlg-name">Name</label>
              <input hlmInput id="dlg-name" value="Pedro Duarte" />
            </div>
            <hlm-dialog-footer>
              <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
              <button hlmBtn type="submit" hlmDialogClose>Save changes</button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </hlm-dialog>
      </app-usage>

      <app-usage title="Sizes" note="The content class carries the max-width — the dialog has no size input." [code]="codeSizes">
        <div class="flex flex-wrap gap-s">
          <hlm-dialog>
            <button hlmDialogTrigger hlmBtn variant="outline" size="sm">Small</button>
            <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-xs">
              <hlm-dialog-header>
                <h3 hlmDialogTitle>Small dialog</h3>
                <p hlmDialogDescription>Constrained to sm:max-w-xs.</p>
              </hlm-dialog-header>
              <hlm-dialog-footer>
                <button hlmBtn variant="outline" hlmDialogClose>Close</button>
              </hlm-dialog-footer>
            </hlm-dialog-content>
          </hlm-dialog>
          <hlm-dialog>
            <button hlmDialogTrigger hlmBtn variant="outline">Default</button>
            <hlm-dialog-content *hlmDialogPortal="let ctx">
              <hlm-dialog-header>
                <h3 hlmDialogTitle>Default dialog</h3>
                <p hlmDialogDescription>The default sm:max-w-sm content width.</p>
              </hlm-dialog-header>
              <hlm-dialog-footer>
                <button hlmBtn variant="outline" hlmDialogClose>Close</button>
              </hlm-dialog-footer>
            </hlm-dialog-content>
          </hlm-dialog>
          <hlm-dialog>
            <button hlmDialogTrigger hlmBtn variant="outline" size="lg">Large</button>
            <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-lg">
              <hlm-dialog-header>
                <h3 hlmDialogTitle>Large dialog</h3>
                <p hlmDialogDescription>Widened to sm:max-w-lg for denser content.</p>
              </hlm-dialog-header>
              <hlm-dialog-footer>
                <button hlmBtn variant="outline" hlmDialogClose>Close</button>
              </hlm-dialog-footer>
            </hlm-dialog-content>
          </hlm-dialog>
        </div>
      </app-usage>

      <app-usage
        title="Destructive confirm"
        [note]="deleteCount() ? 'Deleted ' + deleteCount() + ' time(s) so far.' : 'Not deleted yet.'"
        [code]="codeDestructive"
      >
        <hlm-dialog>
          <button hlmDialogTrigger hlmBtn variant="destructive">Delete project</button>
          <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
            <hlm-dialog-header>
              <h3 hlmDialogTitle>Delete this project?</h3>
              <p hlmDialogDescription>This cannot be undone. All project data will be permanently removed.</p>
            </hlm-dialog-header>
            <hlm-dialog-footer>
              <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
              <button hlmBtn variant="destructive" hlmDialogClose (click)="confirmDelete()">Delete</button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </hlm-dialog>
      </app-usage>

      <app-usage
        title="Tracked open count"
        note="stateChanged is a real BrnDialog output — the counter increments only when the overlay actually reports 'open'."
        [code]="codeTracked"
      >
        <hlm-dialog (stateChanged)="onStateChanged($event)">
          <button hlmDialogTrigger hlmBtn variant="outline">Open ({{ openCount() }} times so far)</button>
          <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
            <hlm-dialog-header>
              <h3 hlmDialogTitle>Release notes</h3>
              <p hlmDialogDescription>This dialog has been opened {{ openCount() }} time(s) this session.</p>
            </hlm-dialog-header>
            <hlm-dialog-footer>
              <button hlmBtn variant="outline" hlmDialogClose>Close</button>
            </hlm-dialog-footer>
          </hlm-dialog-content>
        </hlm-dialog>
      </app-usage>
    </app-component-page>
  `,
})
export class DialogPage {
  protected readonly deleteCount = signal(0);
  protected readonly openCount = signal(0);

  protected confirmDelete(): void {
    this.deleteCount.update((n) => n + 1);
  }

  protected onStateChanged(state: string): void {
    if (state === 'open') {
      this.openCount.update((n) => n + 1);
    }
  }

  protected readonly codeDefault = `<hlm-dialog>
  <button hlmDialogTrigger hlmBtn variant="outline">Edit profile</button>
  <hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-sm">
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Edit profile</h3>
      <p hlmDialogDescription>Make changes to your profile here.</p>
    </hlm-dialog-header>
    <div hlmField>
      <label hlmFieldLabel for="name">Name</label>
      <input hlmInput id="name" value="Pedro Duarte" />
    </div>
    <hlm-dialog-footer>
      <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
      <button hlmBtn type="submit" hlmDialogClose>Save changes</button>
    </hlm-dialog-footer>
  </hlm-dialog-content>
</hlm-dialog>`;

  protected readonly codeSizes = `<!-- The size lives on the content's own class, not an input -->
<hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-xs">…</hlm-dialog-content>
<hlm-dialog-content *hlmDialogPortal="let ctx">…</hlm-dialog-content>
<hlm-dialog-content *hlmDialogPortal="let ctx" class="sm:max-w-lg">…</hlm-dialog-content>`;

  protected readonly codeDestructive = `deleteCount = signal(0);
confirmDelete() { this.deleteCount.update(n => n + 1); }

<hlm-dialog>
  <button hlmDialogTrigger hlmBtn variant="destructive">Delete project</button>
  <hlm-dialog-content *hlmDialogPortal="let ctx">
    <hlm-dialog-header>
      <h3 hlmDialogTitle>Delete this project?</h3>
      <p hlmDialogDescription>This cannot be undone.</p>
    </hlm-dialog-header>
    <hlm-dialog-footer>
      <button hlmBtn variant="outline" hlmDialogClose>Cancel</button>
      <button hlmBtn variant="destructive" hlmDialogClose (click)="confirmDelete()">Delete</button>
    </hlm-dialog-footer>
  </hlm-dialog-content>
</hlm-dialog>`;

  protected readonly codeTracked = `openCount = signal(0);
onStateChanged(state: string) {
  if (state === 'open') this.openCount.update(n => n + 1);
}

<hlm-dialog (stateChanged)="onStateChanged($event)">
  <button hlmDialogTrigger hlmBtn variant="outline">Open ({{ openCount() }} times so far)</button>
  <hlm-dialog-content *hlmDialogPortal="let ctx">…</hlm-dialog-content>
</hlm-dialog>`;
}
