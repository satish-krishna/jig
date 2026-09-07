import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Sonner usages. Toasts are fired imperatively through the `toast` function
 * from `@spartan-ng/brain/sonner` — there is no static markup for a toast
 * itself, so every example fires a real one on click rather than showing a
 * mock. One `<hlm-toaster />` is mounted once for the whole page (as the
 * upstream docs mount it once at the app root): mounting it per-usage would
 * duplicate the same global toast queue into four stacked toasters.
 */
@Component({
  selector: 'app-sonner-page',
  imports: [ComponentPage, Usage, HlmToasterImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideX })],
  template: `
    <app-component-page slug="sonner">
      <hlm-toaster />

      <app-usage
        title="Types"
        note="success / error / warning / info, plus dismissing every visible toast."
        [code]="codeTypes"
      >
        <div class="flex flex-wrap items-center gap-s">
          <button hlmBtn variant="outline" size="sm" (click)="showSuccess()">Success</button>
          <button hlmBtn variant="outline" size="sm" (click)="showError()">Error</button>
          <button hlmBtn variant="outline" size="sm" (click)="showWarning()">Warning</button>
          <button hlmBtn variant="outline" size="sm" (click)="showInfo()">Info</button>
          <button hlmBtn variant="ghost" size="icon-xs" aria-label="Dismiss all" (click)="dismissAll()">
            <ng-icon name="lucideX" />
          </button>
        </div>
      </app-usage>

      <app-usage
        title="Description and action"
        note="A second line plus a clickable action button on the toast itself."
        [code]="codeAction"
      >
        <button hlmBtn variant="outline" size="sm" (click)="showWithAction()">Show toast</button>
      </app-usage>

      <app-usage title="Positions" note="Per-toast position overrides the toaster default." [code]="codePosition">
        <div class="flex gap-s">
          <button hlmBtn variant="outline" size="sm" (click)="showTopLeft()">Top left</button>
          <button hlmBtn variant="outline" size="sm" (click)="showBottomRight()">Bottom right</button>
        </div>
      </app-usage>

      <app-usage
        title="Promise"
        note="Loading, then success or error, tracked from a real async task."
        [code]="codePromise"
      >
        <button hlmBtn variant="outline" size="sm" (click)="runTask()">Run task</button>
      </app-usage>
    </app-component-page>
  `,
})
export class SonnerPage {
  protected showSuccess(): void {
    toast.success('Payment received');
  }

  protected showError(): void {
    toast.error('Payment failed');
  }

  protected showWarning(): void {
    toast.warning('Card expiring soon');
  }

  protected showInfo(): void {
    toast.info('New message from support');
  }

  protected dismissAll(): void {
    toast.dismiss();
  }

  protected showWithAction(): void {
    toast('Event has been created', {
      description: 'Sunday, December 3rd at 9:00 AM',
      action: { label: 'Undo', onClick: () => toast.dismiss() },
    });
  }

  protected showTopLeft(): void {
    toast('Reminder set', { position: 'top-left' });
  }

  protected showBottomRight(): void {
    toast('Reminder set', { position: 'bottom-right' });
  }

  protected runTask(): void {
    toast.promise<{ name: string }>(
      () => new Promise((resolve) => setTimeout(() => resolve({ name: 'Nightly build' }), 2000)),
      {
        loading: 'Running task...',
        success: (data) => `${data.name} finished`,
        error: 'Task failed',
      },
    );
  }

  protected readonly codeTypes = `toast.success('Payment received');
toast.error('Payment failed');
toast.warning('Card expiring soon');
toast.info('New message from support');
toast.dismiss(); // dismisses every visible toast`;

  protected readonly codeAction = `toast('Event has been created', {
  description: 'Sunday, December 3rd at 9:00 AM',
  action: { label: 'Undo', onClick: () => toast.dismiss() },
});`;

  protected readonly codePosition = `toast('Reminder set', { position: 'top-left' });
toast('Reminder set', { position: 'bottom-right' });`;

  protected readonly codePromise = `toast.promise(
  () => fetchSomething(),
  {
    loading: 'Running task...',
    success: (data) => \`\${data.name} finished\`,
    error: 'Task failed',
  },
);`;
}
