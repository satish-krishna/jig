import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Alert dialog usages. Anatomy confirmed against the spartan MCP docs: content
 * sits behind `*hlmAlertDialogPortal` and is not in the DOM until opened (CDK
 * renders it to `document.body`, not the component host). Unlike a plain
 * dialog, `hlmAlertDialogCancel`/`hlmAlertDialogAction` are the close/confirm
 * pair — the whole component exists for the destructive-confirm case, so
 * every usage here is some flavor of that, not a distraction from it.
 */
@Component({
  selector: 'app-alert-dialog-page',
  imports: [ComponentPage, Usage, HlmAlertDialogImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideTrash2 })],
  template: `
    <app-component-page slug="alert-dialog">
      <app-usage title="Default" note="The baseline confirm/cancel pair." [code]="codeDefault">
        <hlm-alert-dialog>
          <button hlmAlertDialogTrigger hlmBtn variant="outline">Show dialog</button>
          <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
            <hlm-alert-dialog-header>
              <h2 hlmAlertDialogTitle>Are you absolutely sure?</h2>
              <p hlmAlertDialogDescription>
                This action cannot be undone. This will permanently delete your account from our servers.
              </p>
            </hlm-alert-dialog-header>
            <hlm-alert-dialog-footer>
              <button hlmAlertDialogCancel>Cancel</button>
              <button hlmAlertDialogAction>Continue</button>
            </hlm-alert-dialog-footer>
          </hlm-alert-dialog-content>
        </hlm-alert-dialog>
      </app-usage>

      <app-usage
        title="Sizes"
        note="The content's size input, not a class override — sm is narrower on every breakpoint."
        [code]="codeSizes"
      >
        <div class="flex flex-wrap gap-s">
          <hlm-alert-dialog>
            <button hlmAlertDialogTrigger hlmBtn variant="outline" size="sm">Small</button>
            <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" size="sm">
              <hlm-alert-dialog-header>
                <h2 hlmAlertDialogTitle>Discard draft?</h2>
                <p hlmAlertDialogDescription>Your unsaved changes will be lost.</p>
              </hlm-alert-dialog-header>
              <hlm-alert-dialog-footer>
                <button hlmAlertDialogCancel>Keep editing</button>
                <button hlmAlertDialogAction>Discard</button>
              </hlm-alert-dialog-footer>
            </hlm-alert-dialog-content>
          </hlm-alert-dialog>
          <hlm-alert-dialog>
            <button hlmAlertDialogTrigger hlmBtn variant="outline">Default</button>
            <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" size="default">
              <hlm-alert-dialog-header>
                <h2 hlmAlertDialogTitle>Sign out everywhere?</h2>
                <p hlmAlertDialogDescription>Every other signed-in device will be logged out immediately.</p>
              </hlm-alert-dialog-header>
              <hlm-alert-dialog-footer>
                <button hlmAlertDialogCancel>Cancel</button>
                <button hlmAlertDialogAction>Sign out</button>
              </hlm-alert-dialog-footer>
            </hlm-alert-dialog-content>
          </hlm-alert-dialog>
        </div>
      </app-usage>

      <app-usage
        title="Destructive with media"
        [note]="itemDeleted() ? 'The item was removed.' : 'Nothing removed yet.'"
        [code]="codeMedia"
      >
        <hlm-alert-dialog>
          <button hlmAlertDialogTrigger hlmBtn variant="destructive">Delete item</button>
          <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
            <hlm-alert-dialog-media>
              <ng-icon name="lucideTrash2" />
            </hlm-alert-dialog-media>
            <hlm-alert-dialog-header>
              <h2 hlmAlertDialogTitle>Delete this item?</h2>
              <p hlmAlertDialogDescription>This removes it from every list. There is no undo.</p>
            </hlm-alert-dialog-header>
            <hlm-alert-dialog-footer>
              <button hlmAlertDialogCancel>Cancel</button>
              <button hlmAlertDialogAction variant="destructive" (click)="confirmDelete()">Delete</button>
            </hlm-alert-dialog-footer>
          </hlm-alert-dialog-content>
        </hlm-alert-dialog>
      </app-usage>

      <app-usage
        title="Leave workspace"
        [note]="hasLeft() ? 'You left the workspace.' : 'Still a member.'"
        [code]="codeComposition"
      >
        <hlm-alert-dialog>
          <button hlmAlertDialogTrigger hlmBtn variant="outline">{{ hasLeft() ? 'Rejoin' : 'Leave workspace' }}</button>
          <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
            <hlm-alert-dialog-header>
              <h2 hlmAlertDialogTitle>{{ hasLeft() ? 'Rejoin this workspace?' : 'Leave this workspace?' }}</h2>
              <p hlmAlertDialogDescription>
                {{
                  hasLeft()
                    ? "You'll regain access to shared projects and channels."
                    : "You'll lose access to shared projects and channels until you're re-invited."
                }}
              </p>
            </hlm-alert-dialog-header>
            <hlm-alert-dialog-footer>
              <button hlmAlertDialogCancel>Cancel</button>
              <button hlmAlertDialogAction (click)="toggleMembership()">{{ hasLeft() ? 'Rejoin' : 'Leave' }}</button>
            </hlm-alert-dialog-footer>
          </hlm-alert-dialog-content>
        </hlm-alert-dialog>
      </app-usage>
    </app-component-page>
  `,
})
export class AlertDialogPage {
  protected readonly itemDeleted = signal(false);
  protected readonly hasLeft = signal(false);

  protected confirmDelete(): void {
    this.itemDeleted.set(true);
  }

  protected toggleMembership(): void {
    this.hasLeft.update((left) => !left);
  }

  protected readonly codeDefault = `<hlm-alert-dialog>
  <button hlmAlertDialogTrigger hlmBtn variant="outline">Show dialog</button>
  <hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
    <hlm-alert-dialog-header>
      <h2 hlmAlertDialogTitle>Are you absolutely sure?</h2>
      <p hlmAlertDialogDescription>This action cannot be undone.</p>
    </hlm-alert-dialog-header>
    <hlm-alert-dialog-footer>
      <button hlmAlertDialogCancel>Cancel</button>
      <button hlmAlertDialogAction>Continue</button>
    </hlm-alert-dialog-footer>
  </hlm-alert-dialog-content>
</hlm-alert-dialog>`;

  protected readonly codeSizes = `<hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" size="sm">…</hlm-alert-dialog-content>
<hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx" size="default">…</hlm-alert-dialog-content>`;

  protected readonly codeMedia = `itemDeleted = signal(false);
confirmDelete() { this.itemDeleted.set(true); }

<hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
  <hlm-alert-dialog-media>
    <ng-icon name="lucideTrash2" />
  </hlm-alert-dialog-media>
  <hlm-alert-dialog-header>
    <h2 hlmAlertDialogTitle>Delete this item?</h2>
    <p hlmAlertDialogDescription>This removes it from every list.</p>
  </hlm-alert-dialog-header>
  <hlm-alert-dialog-footer>
    <button hlmAlertDialogCancel>Cancel</button>
    <button hlmAlertDialogAction variant="destructive" (click)="confirmDelete()">Delete</button>
  </hlm-alert-dialog-footer>
</hlm-alert-dialog-content>`;

  protected readonly codeComposition = `hasLeft = signal(false);
toggleMembership() { this.hasLeft.update(left => !left); }

<button hlmAlertDialogTrigger hlmBtn variant="outline">{{ hasLeft() ? 'Rejoin' : 'Leave workspace' }}</button>
<hlm-alert-dialog-content *hlmAlertDialogPortal="let ctx">
  <hlm-alert-dialog-header>
    <h2 hlmAlertDialogTitle>{{ hasLeft() ? 'Rejoin this workspace?' : 'Leave this workspace?' }}</h2>
  </hlm-alert-dialog-header>
  <hlm-alert-dialog-footer>
    <button hlmAlertDialogCancel>Cancel</button>
    <button hlmAlertDialogAction (click)="toggleMembership()">{{ hasLeft() ? 'Rejoin' : 'Leave' }}</button>
  </hlm-alert-dialog-footer>
</hlm-alert-dialog-content>`;
}
