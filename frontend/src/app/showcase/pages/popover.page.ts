import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Popover usages. Anatomy confirmed against the spartan MCP docs: content
 * sits behind `*hlmPopoverPortal` and is not in the DOM until the trigger
 * opens it (the CDK overlay attaches it to `document.body`, not the
 * component host), unlike hover-card/tooltip a popover opens on click and
 * stays open until an outside click or its own close affordance.
 */
@Component({
  selector: 'app-popover-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmPopoverImports, HlmButtonImports, HlmFieldImports, HlmInputImports],
  template: `
    <app-component-page slug="popover">
      <app-usage title="Dimensions" note="A small form living inside the popover body." [code]="codeDefault">
        <hlm-popover sideOffset="5" align="start">
          <button hlmPopoverTrigger hlmBtn variant="outline">Open popover</button>
          <hlm-popover-content *hlmPopoverPortal="let ctx" class="grid w-64 gap-3">
            <hlm-popover-header>
              <div hlmPopoverTitle>Dimensions</div>
              <p hlmPopoverDescription>Set the dimensions for the layer.</p>
            </hlm-popover-header>
            <div hlmField>
              <label hlmFieldLabel for="pop-width">Width</label>
              <input hlmInput id="pop-width" value="100%" class="h-8" />
            </div>
          </hlm-popover-content>
        </hlm-popover>
      </app-usage>

      <app-usage title="Align" note="start / center / end, relative to the trigger." [code]="codeAlign">
        <div class="flex gap-6">
          @for (a of aligns; track a) {
            <hlm-popover sideOffset="5" [align]="a">
              <button hlmPopoverTrigger hlmBtn variant="outline">{{ a }}</button>
              <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-40">Aligned to {{ a }}</hlm-popover-content>
            </hlm-popover>
          }
        </div>
      </app-usage>

      <app-usage
        title="Inline delete confirm"
        [note]="labelDeleted() ? 'Label deleted.' : 'Label still exists.'"
        [code]="codeDestructive"
      >
        <hlm-popover>
          <button hlmPopoverTrigger hlmBtn variant="destructive">Delete label</button>
          <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-64">
            <hlm-popover-header>
              <div hlmPopoverTitle>Delete this label?</div>
              <p hlmPopoverDescription>It will be removed from every issue using it.</p>
            </hlm-popover-header>
            <button hlmBtn variant="destructive" size="sm" (click)="confirmDelete()">Confirm delete</button>
          </hlm-popover-content>
        </hlm-popover>
      </app-usage>

      <app-usage
        title="Notifications"
        [note]="unread().length + ' unread.'"
        [code]="codeComposition"
      >
        <hlm-popover align="end">
          <button hlmPopoverTrigger hlmBtn variant="outline">Inbox ({{ unread().length }})</button>
          <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-72">
            <hlm-popover-header>
              <div hlmPopoverTitle>Notifications</div>
              <p hlmPopoverDescription>{{ unread().length }} unread of {{ items().length }}.</p>
            </hlm-popover-header>
            <ul class="flex flex-col gap-1.5 text-sm">
              @for (item of items(); track item.id) {
                <li [class.font-medium]="!item.read">{{ item.text }}</li>
              }
            </ul>
            <button hlmBtn variant="outline" size="sm" (click)="markAllRead()">Mark all read</button>
          </hlm-popover-content>
        </hlm-popover>
      </app-usage>
    </app-component-page>
  `,
})
export class PopoverPage {
  protected readonly aligns = ['start', 'center', 'end'] as const;

  protected readonly labelDeleted = signal(false);
  protected confirmDelete(): void {
    this.labelDeleted.set(true);
  }

  protected readonly items = signal([
    { id: 1, text: 'Your export finished', read: false },
    { id: 2, text: 'New comment on your post', read: false },
    { id: 3, text: 'Weekly summary is ready', read: true },
  ]);
  protected readonly unread = () => this.items().filter((i) => !i.read);

  protected markAllRead(): void {
    this.items.update((list) => list.map((i) => ({ ...i, read: true })));
  }

  protected readonly codeDefault = `<hlm-popover sideOffset="5" align="start">
  <button hlmPopoverTrigger hlmBtn variant="outline">Open popover</button>
  <hlm-popover-content *hlmPopoverPortal="let ctx" class="grid w-64 gap-3">
    <hlm-popover-header>
      <div hlmPopoverTitle>Dimensions</div>
      <p hlmPopoverDescription>Set the dimensions for the layer.</p>
    </hlm-popover-header>
    <div hlmField>
      <label hlmFieldLabel for="width">Width</label>
      <input hlmInput id="width" value="100%" class="h-8" />
    </div>
  </hlm-popover-content>
</hlm-popover>`;

  protected readonly codeAlign = `@for (a of ['start', 'center', 'end']; track a) {
  <hlm-popover sideOffset="5" [align]="a">
    <button hlmPopoverTrigger hlmBtn variant="outline">{{ a }}</button>
    <hlm-popover-content *hlmPopoverPortal="let ctx" class="w-40">Aligned to {{ a }}</hlm-popover-content>
  </hlm-popover>
}`;

  protected readonly codeDestructive = `labelDeleted = signal(false);
confirmDelete() { this.labelDeleted.set(true); }

<hlm-popover>
  <button hlmPopoverTrigger hlmBtn variant="destructive">Delete label</button>
  <hlm-popover-content *hlmPopoverPortal="let ctx">
    <hlm-popover-header>
      <div hlmPopoverTitle>Delete this label?</div>
    </hlm-popover-header>
    <button hlmBtn variant="destructive" size="sm" (click)="confirmDelete()">Confirm delete</button>
  </hlm-popover-content>
</hlm-popover>`;

  protected readonly codeComposition = `items = signal([...]);
unread = () => this.items().filter(i => !i.read);
markAllRead() { this.items.update(list => list.map(i => ({ ...i, read: true }))); }

<hlm-popover-content *hlmPopoverPortal="let ctx">
  @for (item of items(); track item.id) {
    <li [class.font-medium]="!item.read">{{ item.text }}</li>
  }
  <button hlmBtn variant="outline" size="sm" (click)="markAllRead()">Mark all read</button>
</hlm-popover-content>`;
}
