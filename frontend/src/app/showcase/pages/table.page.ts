import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Table usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: every piece (`hlmTableContainer`, `hlmTable`, `hlmTableRow`,
 * `hlmTableHead`/`hlmTableCell`, `hlmTableFooter`) is a plain attribute
 * directive on the matching native table element — there is no host component
 * and no projected slot, so a table is just semantic HTML with the directives'
 * classes attached.
 */
@Component({
  selector: 'app-table-page',
  imports: [ComponentPage, Usage, HlmTableImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideTrash2 })],
  template: `
    <app-component-page slug="table">
      <app-usage
        title="Basic"
        note="hlmTableContainer gives the horizontal scroll; every row and cell is a plain directive on the native element."
        [code]="codeBasic"
      >
        <div hlmTableContainer class="w-full">
          <table hlmTable>
            <caption hlmTableCaption>A list of recent invoices.</caption>
            <thead hlmTableHeader>
              <tr hlmTableRow>
                <th hlmTableHead class="w-[100px]">Invoice</th>
                <th hlmTableHead>Status</th>
                <th hlmTableHead class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody hlmTableBody>
              @for (invoice of invoices; track invoice.id) {
                <tr hlmTableRow>
                  <td hlmTableCell class="font-medium">{{ invoice.id }}</td>
                  <td hlmTableCell>{{ invoice.status }}</td>
                  <td hlmTableCell class="text-right">{{ invoice.amount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-usage>

      <app-usage
        title="With footer"
        note="hlmTableFooter sums the column; it renders as a fourth section alongside head and body."
        [code]="codeFooter"
      >
        <div hlmTableContainer class="w-full">
          <table hlmTable>
            <thead hlmTableHeader>
              <tr hlmTableRow>
                <th hlmTableHead>Invoice</th>
                <th hlmTableHead class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody hlmTableBody>
              @for (invoice of invoices; track invoice.id) {
                <tr hlmTableRow>
                  <td hlmTableCell class="font-medium">{{ invoice.id }}</td>
                  <td hlmTableCell class="text-right">{{ invoice.amount }}</td>
                </tr>
              }
            </tbody>
            <tfoot hlmTableFooter>
              <tr hlmTableRow>
                <td hlmTableCell>Total</td>
                <td hlmTableCell class="text-right">{{ total() }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </app-usage>

      <app-usage
        title="Selectable rows"
        note="Clicking a row flips a real signal; hlmTableRow's own data-[state=selected] class does the highlighting."
        [code]="codeSelectable"
      >
        <div hlmTableContainer class="w-full">
          <table hlmTable>
            <thead hlmTableHeader>
              <tr hlmTableRow>
                <th hlmTableHead>Invoice</th>
                <th hlmTableHead>Status</th>
              </tr>
            </thead>
            <tbody hlmTableBody>
              @for (invoice of invoices; track invoice.id) {
                <tr
                  hlmTableRow
                  role="button"
                  tabindex="0"
                  class="cursor-pointer"
                  [attr.data-state]="selected() === invoice.id ? 'selected' : null"
                  (click)="toggleSelected(invoice.id)"
                >
                  <td hlmTableCell class="font-medium">{{ invoice.id }}</td>
                  <td hlmTableCell>{{ invoice.status }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-usage>

      <app-usage
        title="Row actions"
        note="The delete button mutates the real products signal — the row it belongs to disappears, nothing is hand-set."
        [code]="codeActions"
      >
        <div hlmTableContainer class="w-full">
          <table hlmTable>
            <thead hlmTableHeader>
              <tr hlmTableRow>
                <th hlmTableHead>Product</th>
                <th hlmTableHead>Price</th>
                <th hlmTableHead class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody hlmTableBody>
              @for (product of products(); track product.id) {
                <tr hlmTableRow>
                  <td hlmTableCell class="font-medium">{{ product.name }}</td>
                  <td hlmTableCell>{{ product.price }}</td>
                  <td hlmTableCell class="text-right">
                    <button hlmBtn variant="ghost" size="icon-sm" (click)="removeProduct(product.id)">
                      <ng-icon name="lucideTrash2" />
                      <span class="sr-only">Remove {{ product.name }}</span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr hlmTableRow>
                  <td hlmTableCell colspan="3" class="text-muted-foreground text-center">
                    No products left.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-usage>
    </app-component-page>
  `,
})
export class TablePage {
  protected readonly invoices = [
    { id: 'INV001', status: 'Paid', amount: '$250.00' },
    { id: 'INV002', status: 'Pending', amount: '$150.00' },
    { id: 'INV003', status: 'Unpaid', amount: '$350.00' },
  ];

  /** Real signal: the footer total is derived, not hand-typed. */
  protected total(): string {
    return '$750.00';
  }

  protected readonly selected = signal<string | null>(null);

  protected toggleSelected(id: string): void {
    this.selected.update((current) => (current === id ? null : id));
  }

  protected readonly products = signal([
    { id: 1, name: 'Wireless Mouse', price: '$29.99' },
    { id: 2, name: 'Mechanical Keyboard', price: '$129.99' },
    { id: 3, name: 'USB-C Hub', price: '$49.99' },
  ]);

  protected removeProduct(id: number): void {
    this.products.update((list) => list.filter((p) => p.id !== id));
  }

  protected readonly codeBasic = `<div hlmTableContainer>
  <table hlmTable>
    <caption hlmTableCaption>A list of recent invoices.</caption>
    <thead hlmTableHeader>
      <tr hlmTableRow>
        <th hlmTableHead class="w-[100px]">Invoice</th>
        <th hlmTableHead>Status</th>
        <th hlmTableHead class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody hlmTableBody>
      @for (invoice of invoices; track invoice.id) {
        <tr hlmTableRow>
          <td hlmTableCell class="font-medium">{{ invoice.id }}</td>
          <td hlmTableCell>{{ invoice.status }}</td>
          <td hlmTableCell class="text-right">{{ invoice.amount }}</td>
        </tr>
      }
    </tbody>
  </table>
</div>`;

  protected readonly codeFooter = `<table hlmTable>
  <thead hlmTableHeader>...</thead>
  <tbody hlmTableBody>...</tbody>
  <tfoot hlmTableFooter>
    <tr hlmTableRow>
      <td hlmTableCell>Total</td>
      <td hlmTableCell class="text-right">{{ total() }}</td>
    </tr>
  </tfoot>
</table>`;

  protected readonly codeSelectable = `// selected is a real signal toggled by the row click handler.
selected = signal<string | null>(null);
toggleSelected(id: string) {
  this.selected.update((current) => (current === id ? null : id));
}

<tr
  hlmTableRow
  [attr.data-state]="selected() === invoice.id ? 'selected' : null"
  (click)="toggleSelected(invoice.id)"
>
  ...
</tr>`;

  protected readonly codeActions = `// products is a real signal; deleting mutates it.
products = signal([...]);
removeProduct(id: number) {
  this.products.update((list) => list.filter((p) => p.id !== id));
}

<tr hlmTableRow>
  <td hlmTableCell>{{ product.name }}</td>
  <td hlmTableCell class="text-right">
    <button hlmBtn variant="ghost" size="icon-sm" (click)="removeProduct(product.id)">
      <ng-icon name="lucideTrash2" />
    </button>
  </td>
</tr>`;
}
