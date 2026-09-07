import { Component, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDrawerImports } from '@spartan-ng/helm/drawer';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Drawer usages. Anatomy confirmed against the spartan MCP docs: content sits
 * behind `*hlmDrawerPortal` and is not in the DOM until opened (the CDK
 * overlay attaches it to `document.body`, not the component host). The
 * direction it slides from is the wrapping `<hlm-drawer>`'s own `direction`
 * input (vaul's naming, not `side`).
 */
@Component({
  selector: 'app-drawer-page',
  imports: [
    ComponentPage,
    Usage,
    HlmDrawerImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmCheckboxImports,
    HlmLabelImports,
  ],
  template: `
    <app-component-page slug="drawer">
      <app-usage
        title="Edit profile"
        note="A form inside the panel body, closed by either footer button."
        [code]="codeDefault"
      >
        <hlm-drawer>
          <button id="edit-profile" hlmDrawerTrigger hlmBtn variant="outline">Edit profile</button>
          <hlm-drawer-content *hlmDrawerPortal="let ctx">
            <hlm-drawer-header>
              <h3 hlmDrawerTitle>Edit profile</h3>
              <p hlmDrawerDescription>Make changes to your profile here. Click save when you're done.</p>
            </hlm-drawer-header>
            <div hlmField class="px-l">
              <label hlmFieldLabel for="drawer-name">Name</label>
              <input hlmInput id="drawer-name" value="Pedro Duarte" />
            </div>
            <hlm-drawer-footer>
              <button hlmBtn type="submit" hlmDrawerClose>Save changes</button>
              <button hlmDrawerClose hlmBtn variant="outline">Cancel</button>
            </hlm-drawer-footer>
          </hlm-drawer-content>
        </hlm-drawer>
      </app-usage>

      <app-usage
        title="Direction"
        note="Vaul's own term for the edge — the wrapping hlm-drawer takes it as the direction input."
        [code]="codeDirection"
      >
        <div class="flex flex-wrap gap-s">
          @for (dir of directions; track dir) {
            <hlm-drawer [direction]="dir">
              <button hlmDrawerTrigger hlmBtn variant="outline">{{ dir }}</button>
              <hlm-drawer-content *hlmDrawerPortal="let ctx">
                <hlm-drawer-header>
                  <h3 hlmDrawerTitle>From the {{ dir }}</h3>
                  <p hlmDrawerDescription>This drawer slides in from the {{ dir }}.</p>
                </hlm-drawer-header>
                <hlm-drawer-footer>
                  <button hlmDrawerClose hlmBtn variant="outline">Close</button>
                </hlm-drawer-footer>
              </hlm-drawer-content>
            </hlm-drawer>
          }
        </div>
      </app-usage>

      <app-usage
        title="Delete conversation"
        [note]="conversationDeleted() ? 'Conversation deleted.' : 'Conversation still here.'"
        [code]="codeDestructive"
      >
        <hlm-drawer>
          <button hlmDrawerTrigger hlmBtn variant="destructive">Delete conversation</button>
          <hlm-drawer-content *hlmDrawerPortal="let ctx">
            <hlm-drawer-header>
              <h3 hlmDrawerTitle>Delete this conversation?</h3>
              <p hlmDrawerDescription>Every message in it will be permanently removed.</p>
            </hlm-drawer-header>
            <hlm-drawer-footer>
              <button hlmBtn variant="destructive" hlmDrawerClose (click)="confirmDelete()">Delete</button>
              <button hlmDrawerClose hlmBtn variant="outline">Cancel</button>
            </hlm-drawer-footer>
          </hlm-drawer-content>
        </hlm-drawer>
      </app-usage>

      <app-usage
        title="Filter results"
        [note]="visibleCount() + ' of ' + allItems.length + ' shown.'"
        [code]="codeComposition"
      >
        <hlm-drawer>
          <button hlmDrawerTrigger hlmBtn variant="outline">Filters ({{ visibleCount() }})</button>
          <hlm-drawer-content *hlmDrawerPortal="let ctx">
            <hlm-drawer-header>
              <h3 hlmDrawerTitle>Filter results</h3>
              <p hlmDrawerDescription>{{ visibleCount() }} of {{ allItems.length }} items match.</p>
            </hlm-drawer-header>
            <div class="grid gap-s px-l">
              @for (tag of tags; track tag) {
                <div class="flex items-center gap-s text-sm">
                  <hlm-checkbox [inputId]="'filter-' + tag" [checked]="selectedTags().includes(tag)" (checkedChange)="toggleTag(tag)" />
                  <label hlmLabel [for]="'filter-' + tag">{{ tag }}</label>
                </div>
              }
            </div>
            <hlm-drawer-footer>
              <button hlmDrawerClose hlmBtn variant="outline">Apply</button>
            </hlm-drawer-footer>
          </hlm-drawer-content>
        </hlm-drawer>
      </app-usage>
    </app-component-page>
  `,
})
export class DrawerPage {
  protected readonly directions = ['top', 'right', 'bottom', 'left'] as const;

  protected readonly conversationDeleted = signal(false);
  protected confirmDelete(): void {
    this.conversationDeleted.set(true);
  }

  protected readonly tags = ['Open', 'Archived', 'Starred'] as const;
  protected readonly allItems = Array.from({ length: 12 }, (_, i) => i);
  protected readonly selectedTags = signal<string[]>(['Open']);
  protected readonly visibleCount = signal(this.allItems.length);

  protected toggleTag(tag: string): void {
    this.selectedTags.update((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
    // A tiny stand-in for a real filter: fewer active tags means a narrower result set.
    const active = this.selectedTags().length || 1;
    this.visibleCount.set(Math.max(1, Math.round(this.allItems.length / active)));
  }

  protected readonly codeDefault = `<hlm-drawer>
  <button hlmDrawerTrigger hlmBtn variant="outline">Edit profile</button>
  <hlm-drawer-content *hlmDrawerPortal="let ctx">
    <hlm-drawer-header>
      <h3 hlmDrawerTitle>Edit profile</h3>
      <p hlmDrawerDescription>Make changes to your profile here.</p>
    </hlm-drawer-header>
    <div hlmField class="px-l">
      <label hlmFieldLabel for="name">Name</label>
      <input hlmInput id="name" value="Pedro Duarte" />
    </div>
    <hlm-drawer-footer>
      <button hlmBtn type="submit" hlmDrawerClose>Save changes</button>
      <button hlmDrawerClose hlmBtn variant="outline">Cancel</button>
    </hlm-drawer-footer>
  </hlm-drawer-content>
</hlm-drawer>`;

  protected readonly codeDirection = `@for (dir of ['top', 'right', 'bottom', 'left']; track dir) {
  <hlm-drawer [direction]="dir">
    <button hlmDrawerTrigger hlmBtn variant="outline">{{ dir }}</button>
    <hlm-drawer-content *hlmDrawerPortal="let ctx">…</hlm-drawer-content>
  </hlm-drawer>
}`;

  protected readonly codeDestructive = `conversationDeleted = signal(false);
confirmDelete() { this.conversationDeleted.set(true); }

<hlm-drawer>
  <button hlmDrawerTrigger hlmBtn variant="destructive">Delete conversation</button>
  <hlm-drawer-content *hlmDrawerPortal="let ctx">
    <hlm-drawer-footer>
      <button hlmBtn variant="destructive" hlmDrawerClose (click)="confirmDelete()">Delete</button>
      <button hlmDrawerClose hlmBtn variant="outline">Cancel</button>
    </hlm-drawer-footer>
  </hlm-drawer-content>
</hlm-drawer>`;

  protected readonly codeComposition = `selectedTags = signal(['Open']);
visibleCount = signal(allItems.length);
toggleTag(tag: string) {
  this.selectedTags.update(tags => tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  const active = this.selectedTags().length || 1;
  this.visibleCount.set(Math.max(1, Math.round(allItems.length / active)));
}

<hlm-drawer-content *hlmDrawerPortal="let ctx">
  @for (tag of tags; track tag) {
    <div class="flex items-center gap-s text-sm">
      <hlm-checkbox [inputId]="'filter-' + tag" [checked]="selectedTags().includes(tag)" (checkedChange)="toggleTag(tag)" />
      <label hlmLabel [for]="'filter-' + tag">{{ tag }}</label>
    </div>
  }
</hlm-drawer-content>`;
}
