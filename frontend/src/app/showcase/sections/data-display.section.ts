import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { ShowcaseExample } from '../showcase-example';

interface Row {
  readonly name: string;
  readonly email: string;
}

/**
 * Containers and navigation: structures that arrange other components.
 */
@Component({
  selector: 'app-showcase-data-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShowcaseExample,
    HlmAccordionImports,
    HlmBreadcrumbImports,
    HlmButtonImports,
    HlmCardImports,
    HlmCollapsibleImports,
    HlmTableImports,
    HlmTabsImports,
  ],
  template: `
    <app-showcase-example name="card">
      <div hlmCard class="w-72">
        <div hlmCardHeader>
          <h3 hlmCardTitle>Monthly usage</h3>
          <p hlmCardDescription>Requests against your quota.</p>
        </div>
        <div hlmCardContent>
          <p>12,480 of 50,000</p>
        </div>
        <div hlmCardFooter>
          <button hlmBtn size="sm" variant="outline">Details</button>
        </div>
      </div>
    </app-showcase-example>

    <app-showcase-example name="accordion">
      <hlm-accordion class="w-72">
        <hlm-accordion-item>
          <hlm-accordion-trigger>Is it accessible?</hlm-accordion-trigger>
          <hlm-accordion-content>Yes — it follows the WAI-ARIA pattern.</hlm-accordion-content>
        </hlm-accordion-item>
        <hlm-accordion-item>
          <hlm-accordion-trigger>Can I restyle it?</hlm-accordion-trigger>
          <hlm-accordion-content>The helm layer lives in your repo. Edit it.</hlm-accordion-content>
        </hlm-accordion-item>
      </hlm-accordion>
    </app-showcase-example>

    <app-showcase-example name="collapsible">
      <div hlmCollapsible class="w-72">
        <button hlmCollapsibleTrigger hlmBtn variant="outline">Toggle details</button>
        <div hlmCollapsibleContent>
          <p class="pt-2">Hidden until you ask for it.</p>
        </div>
      </div>
    </app-showcase-example>

    <app-showcase-example name="tabs">
      <hlm-tabs tab="account" class="w-72">
        <hlm-tabs-list class="w-full">
          <button hlmTabsTrigger="account">Account</button>
          <button hlmTabsTrigger="password">Password</button>
        </hlm-tabs-list>
        <div hlmTabsContent="account">Account settings live here.</div>
        <div hlmTabsContent="password">Change your password here.</div>
      </hlm-tabs>
    </app-showcase-example>

    <app-showcase-example name="table">
      <div hlmTableContainer class="w-96">
        <table hlmTable>
          <caption hlmCaption>Recent signups</caption>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh>Name</th>
              <th hlmTh>Email</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (row of rows; track row.email) {
              <tr hlmTr>
                <td hlmTd>{{ row.name }}</td>
                <td hlmTd>{{ row.email }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-showcase-example>

    <app-showcase-example name="breadcrumb">
      <nav hlmBreadcrumb>
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#">Home</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Users</span></li>
        </ol>
      </nav>
    </app-showcase-example>
  `,
})
export class ShowcaseDataDisplay {
  protected readonly rows: readonly Row[] = [
    { name: 'Ada Lovelace', email: 'ada@example.io' },
    { name: 'Alan Turing', email: 'alan@example.io' },
  ];
}
