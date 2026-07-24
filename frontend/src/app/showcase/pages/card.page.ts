import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Card usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `hlmCard`/`hlm-card` and its parts (`hlm-card-header`,
 * `hlmCardTitle`, `hlmCardDescription`, `hlmCardAction`, `hlmCardContent`,
 * `hlm-card-footer`) are all plain attribute directives with no host
 * template — there is no projected slot, so a card is just nested elements
 * carrying the directives' classes.
 */
@Component({
  selector: 'app-card-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmCardImports, HlmButtonImports, HlmBadgeImports],
  template: `
    <app-component-page slug="card">
      <app-usage
        title="Basic"
        note="Header (title + description), content and footer are the whole anatomy."
        [code]="codeBasic"
      >
        <hlm-card class="w-full max-w-sm">
          <hlm-card-header>
            <h3 hlmCardTitle>Team plan</h3>
            <p hlmCardDescription>Everything a growing team needs.</p>
          </hlm-card-header>
          <div hlmCardContent>
            <p>Unlimited projects, shared workspaces, and priority support.</p>
          </div>
          <hlm-card-footer>
            <button hlmBtn class="w-full">Choose plan</button>
          </hlm-card-footer>
        </hlm-card>
      </app-usage>

      <app-usage title="Sizes" note="size='sm' shrinks the --card-spacing custom property." [code]="codeSizes">
        <div class="flex flex-wrap items-start gap-4">
          <hlm-card size="sm" class="w-full max-w-xs">
            <hlm-card-header>
              <h3 hlmCardTitle>Small</h3>
              <p hlmCardDescription>Compact spacing.</p>
            </hlm-card-header>
            <div hlmCardContent>
              <p>Tighter padding throughout.</p>
            </div>
          </hlm-card>
          <hlm-card class="w-full max-w-xs">
            <hlm-card-header>
              <h3 hlmCardTitle>Default</h3>
              <p hlmCardDescription>Standard spacing.</p>
            </hlm-card-header>
            <div hlmCardContent>
              <p>The usual 16px rhythm.</p>
            </div>
          </hlm-card>
        </div>
      </app-usage>

      <app-usage
        title="With action"
        note="hlmCardAction sits in the header's second grid column, right of the title."
        [code]="codeAction"
      >
        <hlm-card class="w-full max-w-sm">
          <hlm-card-header>
            <h3 hlmCardTitle>Design systems meetup</h3>
            <p hlmCardDescription>A talk on component APIs and shipping faster.</p>
            <div hlmCardAction>
              <span hlmBadge variant="secondary">Featured</span>
            </div>
          </hlm-card-header>
          <hlm-card-footer>
            <button hlmBtn class="w-full">View event</button>
          </hlm-card-footer>
        </hlm-card>
      </app-usage>

      <app-usage
        title="Stateful composition"
        note="The seat count is a real signal; the footer buttons increment and decrement it."
        [code]="codeStateful"
      >
        <hlm-card class="w-full max-w-sm">
          <hlm-card-header>
            <h3 hlmCardTitle>Seats</h3>
            <p hlmCardDescription>Billed monthly per seat.</p>
          </hlm-card-header>
          <div hlmCardContent>
            <p class="text-2xl font-semibold">{{ seats() }}</p>
          </div>
          <hlm-card-footer class="gap-2">
            <button hlmBtn variant="outline" size="sm" (click)="removeSeat()" [disabled]="seats() === 1">
              Remove seat
            </button>
            <button hlmBtn variant="outline" size="sm" (click)="addSeat()">Add seat</button>
          </hlm-card-footer>
        </hlm-card>
      </app-usage>
    </app-component-page>
  `,
})
export class CardPage {
  protected readonly seats = signal(1);

  protected addSeat(): void {
    this.seats.update((n) => n + 1);
  }

  protected removeSeat(): void {
    this.seats.update((n) => Math.max(1, n - 1));
  }

  protected readonly codeBasic = `<hlm-card>
  <hlm-card-header>
    <h3 hlmCardTitle>Team plan</h3>
    <p hlmCardDescription>Everything a growing team needs.</p>
  </hlm-card-header>
  <div hlmCardContent>
    <p>Unlimited projects, shared workspaces, and priority support.</p>
  </div>
  <hlm-card-footer>
    <button hlmBtn class="w-full">Choose plan</button>
  </hlm-card-footer>
</hlm-card>`;

  protected readonly codeSizes = `<hlm-card size="sm">...</hlm-card>
<hlm-card>...</hlm-card>`;

  protected readonly codeAction = `<hlm-card-header>
  <h3 hlmCardTitle>Design systems meetup</h3>
  <p hlmCardDescription>A talk on component APIs and shipping faster.</p>
  <div hlmCardAction>
    <span hlmBadge variant="secondary">Featured</span>
  </div>
</hlm-card-header>`;

  protected readonly codeStateful = `// seats is a real signal; the buttons mutate it directly.
seats = signal(1);
addSeat() { this.seats.update((n) => n + 1); }
removeSeat() { this.seats.update((n) => Math.max(1, n - 1)); }

<div hlmCardContent>
  <p class="text-2xl font-semibold">{{ seats() }}</p>
</div>
<hlm-card-footer class="gap-2">
  <button hlmBtn variant="outline" size="sm" (click)="removeSeat()" [disabled]="seats() === 1">Remove seat</button>
  <button hlmBtn variant="outline" size="sm" (click)="addSeat()">Add seat</button>
</hlm-card-footer>`;
}
