import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCreditCard, lucideSettings, lucideUser } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Tabs usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-tabs[tab]` wraps `hlm-tabs-list` (holding
 * `button[hlmTabsTrigger]` triggers) and one or more sibling
 * `div[hlmTabsContent]` panels — content is a plain attribute directive, not a
 * projected slot, and every panel always renders; the inactive ones simply
 * carry the native `hidden` attribute (`BrnTabsContent` sets
 * `[hidden]="_isSelected() === false"`). `tab` on `hlm-tabs` is a one-way
 * input (not a model) — the trigger/content pairing is by string id, and
 * `(tabActivated)` is the only way to observe activation from outside.
 */
@Component({
  selector: 'app-tabs-page',
  imports: [
    ComponentPage,
    Usage,
    HlmTabsImports,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    NgIcon,
  ],
  providers: [provideIcons({ lucideUser, lucideCreditCard, lucideSettings })],
  template: `
    <app-component-page slug="tabs">
      <app-usage
        title="Default (pill variant)"
        note="hlm-tabs-list defaults to variant=default — a pill-shaped selector over a muted track."
        [code]="codeDefault"
      >
        <hlm-tabs tab="overview" class="w-full max-w-sm">
          <hlm-tabs-list>
            <button hlmTabsTrigger="overview">Overview</button>
            <button hlmTabsTrigger="analytics">Analytics</button>
            <button hlmTabsTrigger="reports">Reports</button>
          </hlm-tabs-list>
          <div hlmTabsContent="overview">
            A snapshot of activity across your workspace.
          </div>
          <div hlmTabsContent="analytics">
            Traffic, conversion, and retention trends.
          </div>
          <div hlmTabsContent="reports">
            Scheduled and one-off exports.
          </div>
        </hlm-tabs>
      </app-usage>

      <app-usage
        title="Line variant, with icons"
        note="variant=line on hlm-tabs-list swaps the pill for an underline; triggers can hold any content, including icons."
        [code]="codeIcons"
      >
        <hlm-tabs tab="profile" class="w-full max-w-sm">
          <hlm-tabs-list variant="line">
            <button hlmTabsTrigger="profile" class="gap-xs">
              <ng-icon name="lucideUser" />
              Profile
            </button>
            <button hlmTabsTrigger="billing" class="gap-xs">
              <ng-icon name="lucideCreditCard" />
              Billing
            </button>
            <button hlmTabsTrigger="settings" class="gap-xs">
              <ng-icon name="lucideSettings" />
              Settings
            </button>
          </hlm-tabs-list>
          <div hlmTabsContent="profile">Name, avatar, and bio.</div>
          <div hlmTabsContent="billing">Plan, payment method, invoices.</div>
          <div hlmTabsContent="settings">Notifications and preferences.</div>
        </hlm-tabs>
      </app-usage>

      <app-usage
        title="State-driven"
        note="[tab] and (tabActivated) are wired to a real signal — an external button can jump the active tab too."
        [code]="codeState"
      >
        <div class="grid w-full max-w-sm gap-s">
          <hlm-tabs [tab]="activeTab()" (tabActivated)="activeTab.set($event)" class="w-full">
            <hlm-tabs-list>
              <button hlmTabsTrigger="summary">Summary</button>
              <button hlmTabsTrigger="activity">Activity</button>
              <button hlmTabsTrigger="invoice">Invoice</button>
            </hlm-tabs-list>
            <div hlmTabsContent="summary">Summary panel.</div>
            <div hlmTabsContent="activity">Activity panel.</div>
            <div hlmTabsContent="invoice">Invoice panel.</div>
          </hlm-tabs>
          <div class="flex items-center gap-s">
            <button hlmBtn size="sm" variant="outline" (click)="activeTab.set('invoice')">Jump to invoice</button>
            <p class="text-muted-foreground text-xs">Active: {{ activeTab() }}</p>
          </div>
        </div>
      </app-usage>

      <app-usage
        title="Composition: account settings"
        note="Each panel is a full hlmCard — the common settings-page layout."
        [code]="codeComposition"
      >
        <hlm-tabs tab="account" class="w-full max-w-lg">
          <hlm-tabs-list aria-label="account settings">
            <button hlmTabsTrigger="account">Account</button>
            <button hlmTabsTrigger="password">Password</button>
          </hlm-tabs-list>
          <div hlmTabsContent="account">
            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>Account</h3>
                <p hlmCardDescription>Make changes to your account here.</p>
              </div>
              <div hlmCardContent class="grid gap-m">
                <label class="block" hlmLabel>
                  Name
                  <input class="mt-xs w-full" value="Pedro Duarte" hlmInput />
                </label>
                <label class="block" hlmLabel>
                  Username
                  <input class="mt-xs w-full" placeholder="@peduarte" hlmInput />
                </label>
              </div>
              <div hlmCardFooter>
                <button hlmBtn>Save changes</button>
              </div>
            </section>
          </div>
          <div hlmTabsContent="password">
            <section hlmCard>
              <div hlmCardHeader>
                <h3 hlmCardTitle>Password</h3>
                <p hlmCardDescription>Change your password here.</p>
              </div>
              <div hlmCardContent class="grid gap-m">
                <label class="block" hlmLabel>
                  Old password
                  <input class="mt-xs w-full" type="password" hlmInput />
                </label>
                <label class="block" hlmLabel>
                  New password
                  <input class="mt-xs w-full" type="password" hlmInput />
                </label>
              </div>
              <div hlmCardFooter>
                <button hlmBtn>Save password</button>
              </div>
            </section>
          </div>
        </hlm-tabs>
      </app-usage>
    </app-component-page>
  `,
})
export class TabsPage {
  /** Drives the state-driven usage — set either by clicking a trigger (via tabActivated) or the external button. */
  protected readonly activeTab = signal('summary');

  protected readonly codeDefault = `<hlm-tabs tab="overview">
  <hlm-tabs-list>
    <button hlmTabsTrigger="overview">Overview</button>
    <button hlmTabsTrigger="analytics">Analytics</button>
    <button hlmTabsTrigger="reports">Reports</button>
  </hlm-tabs-list>
  <div hlmTabsContent="overview">A snapshot of activity across your workspace.</div>
  <div hlmTabsContent="analytics">Traffic, conversion, and retention trends.</div>
  <div hlmTabsContent="reports">Scheduled and one-off exports.</div>
</hlm-tabs>`;

  protected readonly codeIcons = `<hlm-tabs tab="profile">
  <hlm-tabs-list variant="line">
    <button hlmTabsTrigger="profile"><ng-icon name="lucideUser" />Profile</button>
    <button hlmTabsTrigger="billing"><ng-icon name="lucideCreditCard" />Billing</button>
    <button hlmTabsTrigger="settings"><ng-icon name="lucideSettings" />Settings</button>
  </hlm-tabs-list>
  <div hlmTabsContent="profile">Name, avatar, and bio.</div>
  <div hlmTabsContent="billing">Plan, payment method, invoices.</div>
  <div hlmTabsContent="settings">Notifications and preferences.</div>
</hlm-tabs>`;

  protected readonly codeState = `// tab is a one-way input; tabActivated is the only way out, so we round-trip through a signal.
activeTab = signal('summary');

<hlm-tabs [tab]="activeTab()" (tabActivated)="activeTab.set($event)">
  <hlm-tabs-list>
    <button hlmTabsTrigger="summary">Summary</button>
    <button hlmTabsTrigger="activity">Activity</button>
    <button hlmTabsTrigger="invoice">Invoice</button>
  </hlm-tabs-list>
  <div hlmTabsContent="summary">Summary panel.</div>
  <div hlmTabsContent="activity">Activity panel.</div>
  <div hlmTabsContent="invoice">Invoice panel.</div>
</hlm-tabs>

<button hlmBtn size="sm" variant="outline" (click)="activeTab.set('invoice')">Jump to invoice</button>
<p>Active: {{ activeTab() }}</p>`;

  protected readonly codeComposition = `<hlm-tabs tab="account">
  <hlm-tabs-list aria-label="account settings">
    <button hlmTabsTrigger="account">Account</button>
    <button hlmTabsTrigger="password">Password</button>
  </hlm-tabs-list>
  <div hlmTabsContent="account">
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>Account</h3>
        <p hlmCardDescription>Make changes to your account here.</p>
      </div>
      <div hlmCardContent>
        <label hlmLabel>Name<input hlmInput value="Pedro Duarte" /></label>
        <label hlmLabel>Username<input hlmInput placeholder="@peduarte" /></label>
      </div>
      <div hlmCardFooter><button hlmBtn>Save changes</button></div>
    </section>
  </div>
  <div hlmTabsContent="password"><!-- same shape, password fields --></div>
</hlm-tabs>`;
}
