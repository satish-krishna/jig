import { Component, computed, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

const NAMES = ['Olivia Martin', 'Jackson Lee', 'Isabella Nguyen', 'William Kim', 'Sofia Davis'];

/**
 * Collapsible usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-collapsible` is the host (BrnCollapsible: expanded,
 * disabled, expandedChange), `button[hlmCollapsibleTrigger]` toggles it, and
 * `hlm-collapsible-content` is a sibling that shows/hides — no projected slot.
 */
@Component({
  selector: 'app-collapsible-page',
  imports: [ComponentPage, Usage, HlmCollapsibleImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideChevronsUpDown, lucidePlus, lucideTrash2 })],
  template: `
    <app-component-page slug="collapsible">
      <app-usage
        title="Default"
        note="The built-in trigger toggles the panel — no extra wiring needed."
        [code]="codeDefault"
      >
        <hlm-collapsible class="grid w-72 gap-s">
          <div class="flex items-center justify-between gap-l">
            <h4 class="text-sm font-semibold">Order #4189</h4>
            <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon" class="size-8">
              <ng-icon name="lucideChevronsUpDown" />
              <span class="sr-only">Toggle</span>
            </button>
          </div>
          <div class="flex items-center justify-between rounded-md border px-l py-s text-sm">
            <span class="text-muted-foreground">Status</span>
            <span class="font-medium">Shipped</span>
          </div>
          <hlm-collapsible-content class="flex flex-col gap-s">
            <div class="rounded-md border px-l py-s text-sm">
              <p class="font-medium">Shipping address</p>
              <p class="text-muted-foreground">100 Market St, San Francisco</p>
            </div>
          </hlm-collapsible-content>
        </hlm-collapsible>
      </app-usage>

      <app-usage
        title="Disabled"
        note="disabled makes the built-in trigger inert; the panel cannot be toggled."
        [code]="codeDisabled"
      >
        <hlm-collapsible class="grid w-72 gap-s" disabled>
          <div class="flex items-center justify-between gap-l">
            <h4 class="text-sm font-semibold">Locked section</h4>
            <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon" class="size-8">
              <ng-icon name="lucideChevronsUpDown" />
              <span class="sr-only">Toggle</span>
            </button>
          </div>
          <hlm-collapsible-content class="flex flex-col gap-s">
            <div class="rounded-md border px-l py-s text-sm">This never shows — the trigger cannot open it.</div>
          </hlm-collapsible-content>
        </hlm-collapsible>
      </app-usage>

      <app-usage
        title="Controlled, real signal state"
        note="expanded/expandedChange are wired to a signal, driven here by an external button instead of the built-in trigger."
        [code]="codeControlled"
      >
        <div class="grid w-72 gap-s">
          <button hlmBtn variant="outline" size="sm" class="self-start" (click)="detailsOpen.set(!detailsOpen())">
            {{ detailsOpen() ? 'Hide' : 'Show' }} shipping details
          </button>
          <hlm-collapsible [(expanded)]="detailsOpen" class="flex flex-col gap-s">
            <hlm-collapsible-content class="flex flex-col gap-s">
              <div class="rounded-md border px-l py-s text-sm">
                <p class="font-medium">Shipping address</p>
                <p class="text-muted-foreground">100 Market St, San Francisco</p>
              </div>
            </hlm-collapsible-content>
          </hlm-collapsible>
        </div>
      </app-usage>

      <app-usage
        title="Composition: dynamic team list"
        note="Adding or clearing members mutates a real signal, and the panel height animates to fit."
        [code]="codeComposition"
      >
        <hlm-collapsible class="grid w-72 gap-s">
          <div class="flex items-center justify-between gap-l">
            <h4 class="text-sm font-semibold">Team · {{ members().length }} members</h4>
            <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon" class="size-8">
              <ng-icon name="lucideChevronsUpDown" />
              <span class="sr-only">Toggle</span>
            </button>
          </div>
          <hlm-collapsible-content class="flex flex-col gap-s">
            @for (member of members(); track member) {
              <div class="rounded-md border px-l py-s text-sm">{{ member }}</div>
            }
            <button hlmBtn variant="outline" size="sm" (click)="isFull() ? clear() : addMember()">
              <ng-icon [name]="isFull() ? 'lucideTrash2' : 'lucidePlus'" />
              {{ isFull() ? 'Clear' : 'Add member' }}
            </button>
          </hlm-collapsible-content>
        </hlm-collapsible>
      </app-usage>
    </app-component-page>
  `,
})
export class CollapsiblePage {
  /** Controls the "Controlled" usage from an external button, not the built-in trigger. */
  protected readonly detailsOpen = signal(false);

  protected readonly members = signal(NAMES.slice(0, 2));
  protected readonly isFull = computed(() => this.members().length >= NAMES.length);

  protected addMember(): void {
    const next = NAMES[this.members().length];
    if (next === undefined) return;
    this.members.update((current) => [...current, next]);
  }

  protected clear(): void {
    this.members.set([]);
  }

  protected readonly codeDefault = `<hlm-collapsible class="grid w-72 gap-s">
  <div class="flex items-center justify-between gap-l">
    <h4 class="text-sm font-semibold">Order #4189</h4>
    <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon">
      <ng-icon name="lucideChevronsUpDown" />
    </button>
  </div>
  <hlm-collapsible-content>
    <div class="rounded-md border px-l py-s text-sm">Shipping address…</div>
  </hlm-collapsible-content>
</hlm-collapsible>`;

  protected readonly codeDisabled = `<hlm-collapsible disabled>
  <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon">
    <ng-icon name="lucideChevronsUpDown" />
  </button>
  <hlm-collapsible-content>This never shows.</hlm-collapsible-content>
</hlm-collapsible>`;

  protected readonly codeControlled = `detailsOpen = signal(false);

<button hlmBtn variant="outline" (click)="detailsOpen.set(!detailsOpen())">
  {{ detailsOpen() ? 'Hide' : 'Show' }} shipping details
</button>
<hlm-collapsible [(expanded)]="detailsOpen">
  <hlm-collapsible-content>Shipping address…</hlm-collapsible-content>
</hlm-collapsible>`;

  protected readonly codeComposition = `members = signal(['Olivia Martin', 'Jackson Lee']);
isFull = computed(() => members().length >= NAMES.length);
addMember() { members.update((m) => [...m, NAMES[m.length]]); }
clear() { members.set([]); }

<hlm-collapsible>
  <button hlmCollapsibleTrigger hlmBtn variant="ghost" size="icon">
    <ng-icon name="lucideChevronsUpDown" />
  </button>
  <hlm-collapsible-content>
    @for (member of members(); track member) {
      <div>{{ member }}</div>
    }
    <button hlmBtn variant="outline" size="sm" (click)="isFull() ? clear() : addMember()">
      {{ isFull() ? 'Clear' : 'Add member' }}
    </button>
  </hlm-collapsible-content>
</hlm-collapsible>`;
}
