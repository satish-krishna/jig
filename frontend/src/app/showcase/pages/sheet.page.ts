import { Component, computed, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Sheet usages. Anatomy confirmed against the spartan MCP docs: content sits
 * behind `*hlmSheetPortal` and is not in the DOM until opened (the CDK
 * overlay attaches it to `document.body`, not the component host), and the
 * side the panel slides from is the trigger's own `side` input, not a class.
 */
@Component({
  selector: 'app-sheet-page',
  imports: [ComponentPage, Usage, HlmSheetImports, HlmButtonImports, HlmFieldImports, HlmInputImports],
  template: `
    <app-component-page slug="sheet">
      <app-usage
        title="Edit profile"
        note="A form inside the panel body, closed by either footer button."
        [code]="codeDefault"
      >
        <hlm-sheet side="right">
          <button hlmSheetTrigger hlmBtn variant="outline">Edit profile</button>
          <hlm-sheet-content *hlmSheetPortal="let ctx">
            <hlm-sheet-header>
              <h3 hlmSheetTitle>Edit profile</h3>
              <p hlmSheetDescription>Make changes to your profile here. Click save when you're done.</p>
            </hlm-sheet-header>
            <div hlmField>
              <label hlmFieldLabel for="sheet-name">Name</label>
              <input hlmInput id="sheet-name" value="Pedro Duarte" />
            </div>
            <hlm-sheet-footer>
              <button hlmBtn type="submit" hlmSheetClose>Save changes</button>
              <button hlmSheetClose hlmBtn variant="outline">Close</button>
            </hlm-sheet-footer>
          </hlm-sheet-content>
        </hlm-sheet>
      </app-usage>

      <app-usage title="Sides" note="The panel slides in from whichever edge the trigger names." [code]="codeSides">
        <div class="flex flex-wrap gap-s">
          @for (side of sides; track side) {
            <hlm-sheet [side]="side">
              <button hlmSheetTrigger hlmBtn variant="outline">{{ side }}</button>
              <hlm-sheet-content *hlmSheetPortal="let ctx">
                <hlm-sheet-header>
                  <h3 hlmSheetTitle>From the {{ side }}</h3>
                  <p hlmSheetDescription>This panel is anchored to the {{ side }} edge.</p>
                </hlm-sheet-header>
                <hlm-sheet-footer>
                  <button hlmSheetClose hlmBtn variant="outline">Close</button>
                </hlm-sheet-footer>
              </hlm-sheet-content>
            </hlm-sheet>
          }
        </div>
      </app-usage>

      <app-usage
        title="Cart"
        [note]="cartTotal() === 0 ? 'Cart is empty.' : cartCount() + ' item(s), $' + cartTotal() + ' total.'"
        [code]="codeCart"
      >
        <hlm-sheet side="right">
          <button hlmSheetTrigger hlmBtn variant="outline">Open cart ({{ cartCount() }})</button>
          <hlm-sheet-content *hlmSheetPortal="let ctx">
            <hlm-sheet-header>
              <h3 hlmSheetTitle>Your cart</h3>
              <p hlmSheetDescription>{{ cartCount() }} item(s) — \${{ cartTotal() }} total.</p>
            </hlm-sheet-header>
            <hlm-sheet-footer>
              <button hlmBtn variant="destructive" (click)="clearCart()">Clear cart</button>
              <button hlmSheetClose hlmBtn variant="outline">Close</button>
            </hlm-sheet-footer>
          </hlm-sheet-content>
        </hlm-sheet>
      </app-usage>

      <app-usage
        title="Notifications"
        [note]="unreadCount() + ' unread notification(s).'"
        [code]="codeNotifications"
      >
        <hlm-sheet side="right">
          <button hlmSheetTrigger hlmBtn variant="outline">Notifications ({{ unreadCount() }})</button>
          <hlm-sheet-content *hlmSheetPortal="let ctx">
            <hlm-sheet-header>
              <h3 hlmSheetTitle>Notifications</h3>
              <p hlmSheetDescription>{{ unreadCount() }} unread of {{ notifications().length }}.</p>
            </hlm-sheet-header>
            <ul class="grid gap-s px-l text-sm">
              @for (n of notifications(); track n.id) {
                <li class="flex items-center justify-between gap-s">
                  <span [class.font-medium]="!n.read">{{ n.text }}</span>
                  @if (!n.read) {
                    <span class="bg-primary size-1.5 rounded-full"></span>
                  }
                </li>
              }
            </ul>
            <hlm-sheet-footer>
              <button hlmBtn variant="outline" (click)="markAllRead()">Mark all read</button>
              <button hlmSheetClose hlmBtn variant="outline">Close</button>
            </hlm-sheet-footer>
          </hlm-sheet-content>
        </hlm-sheet>
      </app-usage>
    </app-component-page>
  `,
})
export class SheetPage {
  protected readonly sides = ['top', 'right', 'bottom', 'left'] as const;

  protected readonly cartCount = signal(2);
  protected readonly cartTotal = computed(() => this.cartCount() * 25);

  protected clearCart(): void {
    this.cartCount.set(0);
  }

  protected readonly notifications = signal([
    { id: 1, text: 'Your export finished', read: false },
    { id: 2, text: 'New comment on your post', read: false },
    { id: 3, text: 'Weekly summary is ready', read: true },
  ]);
  protected readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  protected markAllRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  protected readonly codeDefault = `<hlm-sheet side="right">
  <button hlmSheetTrigger hlmBtn variant="outline">Edit profile</button>
  <hlm-sheet-content *hlmSheetPortal="let ctx">
    <hlm-sheet-header>
      <h3 hlmSheetTitle>Edit profile</h3>
      <p hlmSheetDescription>Make changes to your profile here.</p>
    </hlm-sheet-header>
    <div hlmField class="px-l">
      <label hlmFieldLabel for="name">Name</label>
      <input hlmInput id="name" value="Pedro Duarte" />
    </div>
    <hlm-sheet-footer>
      <button hlmBtn type="submit" hlmSheetClose>Save changes</button>
      <button hlmSheetClose hlmBtn variant="outline">Close</button>
    </hlm-sheet-footer>
  </hlm-sheet-content>
</hlm-sheet>`;

  protected readonly codeSides = `@for (side of ['top', 'right', 'bottom', 'left']; track side) {
  <hlm-sheet [side]="side">
    <button hlmSheetTrigger hlmBtn variant="outline">{{ side }}</button>
    <hlm-sheet-content *hlmSheetPortal="let ctx">…</hlm-sheet-content>
  </hlm-sheet>
}`;

  protected readonly codeCart = `cartCount = signal(2);
cartTotal = computed(() => this.cartCount() * 25);
clearCart() { this.cartCount.set(0); }

<hlm-sheet-content *hlmSheetPortal="let ctx">
  <hlm-sheet-header>
    <h3 hlmSheetTitle>Your cart</h3>
    <p hlmSheetDescription>{{ cartCount() }} item(s) — {{ cartTotal() }} total.</p>
  </hlm-sheet-header>
  <hlm-sheet-footer>
    <button hlmBtn variant="destructive" (click)="clearCart()">Clear cart</button>
    <button hlmSheetClose hlmBtn variant="outline">Close</button>
  </hlm-sheet-footer>
</hlm-sheet-content>`;

  protected readonly codeNotifications = `notifications = signal([...]);
unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
markAllRead() { this.notifications.update(list => list.map(n => ({ ...n, read: true }))); }

<hlm-sheet-content *hlmSheetPortal="let ctx">
  @for (n of notifications(); track n.id) {
    <li [class.font-medium]="!n.read">{{ n.text }}</li>
  }
  <hlm-sheet-footer>
    <button hlmBtn variant="outline" (click)="markAllRead()">Mark all read</button>
  </hlm-sheet-footer>
</hlm-sheet-content>`;
}
