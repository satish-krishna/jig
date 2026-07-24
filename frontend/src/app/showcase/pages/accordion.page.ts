import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Accordion usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlm-accordion` > `hlm-accordion-item` > (`hlm-accordion-trigger`
 * + `hlm-accordion-content`) — trigger and content are siblings inside the item,
 * both required, neither is a named projection slot. `isOpened` on the item is a
 * model (bindable with `[isOpened]` + `(openedChange)` or `[(isOpened)]`).
 */
@Component({
  selector: 'app-accordion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmAccordionImports, HlmButtonImports, HlmCardImports],
  template: `
    <app-component-page slug="accordion">
      <app-usage
        title="Single (default)"
        note="type='single' is the default — opening one item closes any other."
        [code]="codeSingle"
      >
        <hlm-accordion class="max-w-sm">
          <hlm-accordion-item isOpened>
            <hlm-accordion-trigger>What are your shipping options?</hlm-accordion-trigger>
            <hlm-accordion-content>
              Standard (5-7 days), express (2-3 days), and overnight. Free shipping on international orders.
            </hlm-accordion-content>
          </hlm-accordion-item>
          <hlm-accordion-item>
            <hlm-accordion-trigger>What is your return policy?</hlm-accordion-trigger>
            <hlm-accordion-content>
              Returns accepted within 30 days, unused and in original packaging.
            </hlm-accordion-content>
          </hlm-accordion-item>
        </hlm-accordion>
      </app-usage>

      <app-usage
        title="Multiple, real signal state"
        note="type='multiple' lets several items stay open — isOpened/openedChange are wired to a signal, not hand-set."
        [code]="codeMultiple"
      >
        <hlm-accordion type="multiple" class="max-w-sm">
          @for (item of items; track item.value; let i = $index) {
            <hlm-accordion-item [isOpened]="isOpen(i)" (openedChange)="toggle(i, $event)">
              <hlm-accordion-trigger>{{ item.trigger }}</hlm-accordion-trigger>
              <hlm-accordion-content>{{ item.content }}</hlm-accordion-content>
            </hlm-accordion-item>
          }
        </hlm-accordion>
      </app-usage>

      <app-usage
        title="Disabled item"
        note="The middle item is disabled — its trigger is inert while the others still open and close."
        [code]="codeDisabled"
      >
        <hlm-accordion class="max-w-sm">
          <hlm-accordion-item>
            <hlm-accordion-trigger>Can I access my account history?</hlm-accordion-trigger>
            <hlm-accordion-content>
              Yes, the full history is in the Account History section of your dashboard.
            </hlm-accordion-content>
          </hlm-accordion-item>
          <hlm-accordion-item disabled>
            <hlm-accordion-trigger>Premium feature information</hlm-accordion-trigger>
            <hlm-accordion-content> Upgrade your plan to access this content. </hlm-accordion-content>
          </hlm-accordion-item>
          <hlm-accordion-item>
            <hlm-accordion-trigger>How do I update my email address?</hlm-accordion-trigger>
            <hlm-accordion-content>
              Update it in account settings; a verification email confirms the change.
            </hlm-accordion-content>
          </hlm-accordion-item>
        </hlm-accordion>
      </app-usage>

      <app-usage
        title="Composition: card with dynamic content"
        note="An accordion inside a card, and the open item's own content toggles a detail list via a real signal."
        [code]="codeComposition"
      >
        <section hlmCard class="w-full max-w-sm">
          <div hlmCardHeader>
            <h3 hlmCardTitle>Subscription & Billing</h3>
            <p hlmCardDescription>Common questions about your plan and account.</p>
          </div>
          <div hlmCardContent>
            <hlm-accordion>
              <hlm-accordion-item isOpened>
                <hlm-accordion-trigger>What's included in my plan?</hlm-accordion-trigger>
                <hlm-accordion-content>
                  <p>Your plan includes analytics, alerts, and email support.</p>
                  @if (showDetails()) {
                    <ul class="mt-2 list-disc pl-4">
                      <li>Priority support</li>
                      <li>Custom dashboards</li>
                    </ul>
                  }
                  <button hlmBtn size="sm" variant="outline" class="mt-3" (click)="showDetails.set(!showDetails())">
                    {{ showDetails() ? 'Hide' : 'Show' }} details
                  </button>
                </hlm-accordion-content>
              </hlm-accordion-item>
            </hlm-accordion>
          </div>
        </section>
      </app-usage>
    </app-component-page>
  `,
})
export class AccordionPage {
  protected readonly items = [
    { value: 'notifications', trigger: 'Notification settings', content: 'Manage email and push alerts.' },
    { value: 'privacy', trigger: 'Privacy & security', content: 'Two-factor auth and connected devices.' },
    { value: 'billing', trigger: 'Billing & subscription', content: 'Plan, payment history, and invoices.' },
  ];

  /** Which items are open, tracked by index — a real signal, not a hand-set attribute. */
  protected readonly openIndexes = signal<ReadonlySet<number>>(new Set([0]));

  protected isOpen(i: number): boolean {
    return this.openIndexes().has(i);
  }

  protected toggle(i: number, opened: boolean): void {
    this.openIndexes.update((current) => {
      const next = new Set(current);
      if (opened) {
        next.add(i);
      } else {
        next.delete(i);
      }
      return next;
    });
  }

  /** Drives the extra detail list in the composition example. */
  protected readonly showDetails = signal(false);

  protected readonly codeSingle = `<hlm-accordion>
  <hlm-accordion-item isOpened>
    <hlm-accordion-trigger>What are your shipping options?</hlm-accordion-trigger>
    <hlm-accordion-content>Standard, express and overnight.</hlm-accordion-content>
  </hlm-accordion-item>
  <hlm-accordion-item>
    <hlm-accordion-trigger>What is your return policy?</hlm-accordion-trigger>
    <hlm-accordion-content>Returns accepted within 30 days.</hlm-accordion-content>
  </hlm-accordion-item>
</hlm-accordion>`;

  protected readonly codeMultiple = `// isOpened / openedChange are wired to a signal-backed set of indexes.
openIndexes = signal<ReadonlySet<number>>(new Set([0]));
isOpen(i) { return this.openIndexes().has(i); }
toggle(i, opened) {
  this.openIndexes.update((set) => {
    const next = new Set(set);
    opened ? next.add(i) : next.delete(i);
    return next;
  });
}

<hlm-accordion type="multiple">
  @for (item of items; track item.value; let i = $index) {
    <hlm-accordion-item [isOpened]="isOpen(i)" (openedChange)="toggle(i, $event)">
      <hlm-accordion-trigger>{{ item.trigger }}</hlm-accordion-trigger>
      <hlm-accordion-content>{{ item.content }}</hlm-accordion-content>
    </hlm-accordion-item>
  }
</hlm-accordion>`;

  protected readonly codeDisabled = `<hlm-accordion>
  <hlm-accordion-item>
    <hlm-accordion-trigger>Can I access my account history?</hlm-accordion-trigger>
    <hlm-accordion-content>Yes, in the Account History section.</hlm-accordion-content>
  </hlm-accordion-item>
  <hlm-accordion-item disabled>
    <hlm-accordion-trigger>Premium feature information</hlm-accordion-trigger>
    <hlm-accordion-content>Upgrade your plan to access this content.</hlm-accordion-content>
  </hlm-accordion-item>
</hlm-accordion>`;

  protected readonly codeComposition = `showDetails = signal(false);

<section hlmCard>
  <div hlmCardHeader>
    <h3 hlmCardTitle>Subscription & Billing</h3>
  </div>
  <div hlmCardContent>
    <hlm-accordion>
      <hlm-accordion-item isOpened>
        <hlm-accordion-trigger>What's included in my plan?</hlm-accordion-trigger>
        <hlm-accordion-content>
          <p>Your plan includes analytics, alerts, and email support.</p>
          @if (showDetails()) {
            <ul><li>Priority support</li></ul>
          }
          <button hlmBtn size="sm" (click)="showDetails.set(!showDetails())">
            {{ showDetails() ? 'Hide' : 'Show' }} details
          </button>
        </hlm-accordion-content>
      </hlm-accordion-item>
    </hlm-accordion>
  </div>
</section>`;
}
