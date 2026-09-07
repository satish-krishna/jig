import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsLeft, lucideChevronsRight } from '@ng-icons/lucide';
import { HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Pagination usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `nav[hlmPagination]` > `ul[hlmPaginationContent]` >
 * `li[hlmPaginationItem]`, each holding one control (a page `a[hlmPaginationLink]`,
 * `hlm-pagination-previous/next`, or `hlm-pagination-ellipsis`) — none of it is
 * a named projection slot, it's plain composition. `hlm-numbered-pagination` is
 * the packaged, fully state-driven component (currentPage/itemsPerPage are
 * `model()`s); the last usage builds the same shape by hand from the
 * primitives to show what it's assembled from.
 */
@Component({
  selector: 'app-pagination-page',
  imports: [ComponentPage, Usage, HlmPaginationImports, NgIcon],
  providers: [provideIcons({ lucideChevronsLeft, lucideChevronsRight })],
  template: `
    <app-component-page slug="pagination">
      <app-usage
        title="Default"
        note="isActive on hlmPaginationLink is the only thing marking the current page — everything else is a plain link."
        [code]="codeDefault"
      >
        <nav hlmPagination>
          <ul hlmPaginationContent>
            <li hlmPaginationItem><hlm-pagination-previous /></li>
            <li hlmPaginationItem><a hlmPaginationLink [isActive]="true">1</a></li>
            <li hlmPaginationItem><a hlmPaginationLink>2</a></li>
            <li hlmPaginationItem><a hlmPaginationLink>3</a></li>
            <li hlmPaginationItem><hlm-pagination-ellipsis /></li>
            <li hlmPaginationItem><a hlmPaginationLink>10</a></li>
            <li hlmPaginationItem><hlm-pagination-next /></li>
          </ul>
        </nav>
      </app-usage>

      <app-usage
        title="Icon-only controls"
        note="iconOnly collapses previous/next to just their chevron, with the label kept for screen readers via sr-only."
        [code]="codeIcons"
      >
        <nav hlmPagination>
          <ul hlmPaginationContent>
            <li hlmPaginationItem>
              <button type="button" class="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center">
                <ng-icon name="lucideChevronsLeft" />
              </button>
            </li>
            <li hlmPaginationItem><hlm-pagination-previous iconOnly /></li>
            <li hlmPaginationItem><a hlmPaginationLink [isActive]="true">4</a></li>
            <li hlmPaginationItem><hlm-pagination-next iconOnly /></li>
            <li hlmPaginationItem>
              <button type="button" class="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center">
                <ng-icon name="lucideChevronsRight" />
              </button>
            </li>
          </ul>
        </nav>
      </app-usage>

      <app-usage
        title="State-driven: hlm-numbered-pagination"
        note="The packaged component — currentPage and itemsPerPage are models bound to real signals, not hand-set attributes."
        [code]="codeState"
      >
        <hlm-numbered-pagination
          [(currentPage)]="currentPage"
          [(itemsPerPage)]="itemsPerPage"
          [totalItems]="totalItems"
          class="w-full"
        />
      </app-usage>

      <app-usage
        title="Composition: hand-built from the primitives"
        note="The same current-page state, wired by hand across plain hlmPaginationLink items instead of the packaged component."
        [code]="codeComposition"
      >
        <nav hlmPagination>
          <ul hlmPaginationContent>
            <li hlmPaginationItem (click)="goToPage(page() - 1)">
              <hlm-pagination-previous />
            </li>
            @for (p of pages; track p) {
              <li hlmPaginationItem>
                <a hlmPaginationLink [isActive]="page() === p" (click)="goToPage(p)">{{ p }}</a>
              </li>
            }
            <li hlmPaginationItem (click)="goToPage(page() + 1)">
              <hlm-pagination-next />
            </li>
          </ul>
        </nav>
      </app-usage>
    </app-component-page>
  `,
})
export class PaginationPage {
  protected readonly currentPage = signal(1);
  protected readonly itemsPerPage = signal(10);
  protected readonly totalItems = 132;

  protected readonly pages = [1, 2, 3, 4, 5];
  protected readonly page = signal(1);

  protected goToPage(target: number): void {
    if (target < 1 || target > this.pages.length) return;
    this.page.set(target);
  }

  protected readonly codeDefault = `<nav hlmPagination>
  <ul hlmPaginationContent>
    <li hlmPaginationItem><hlm-pagination-previous /></li>
    <li hlmPaginationItem><a hlmPaginationLink [isActive]="true">1</a></li>
    <li hlmPaginationItem><a hlmPaginationLink>2</a></li>
    <li hlmPaginationItem><a hlmPaginationLink>3</a></li>
    <li hlmPaginationItem><hlm-pagination-ellipsis /></li>
    <li hlmPaginationItem><a hlmPaginationLink>10</a></li>
    <li hlmPaginationItem><hlm-pagination-next /></li>
  </ul>
</nav>`;

  protected readonly codeIcons = `<li hlmPaginationItem><hlm-pagination-previous iconOnly /></li>
<li hlmPaginationItem><a hlmPaginationLink [isActive]="true">4</a></li>
<li hlmPaginationItem><hlm-pagination-next iconOnly /></li>`;

  protected readonly codeState = `currentPage = signal(1);
itemsPerPage = signal(10);
totalItems = 132;

<hlm-numbered-pagination
  [(currentPage)]="currentPage"
  [(itemsPerPage)]="itemsPerPage"
  [totalItems]="totalItems"
/>`;

  protected readonly codeComposition = `page = signal(1);
goToPage(target) {
  if (target < 1 || target > pages.length) return;
  this.page.set(target);
}

<ul hlmPaginationContent>
  <li hlmPaginationItem (click)="goToPage(page() - 1)"><hlm-pagination-previous /></li>
  @for (p of pages; track p) {
    <li hlmPaginationItem>
      <a hlmPaginationLink [isActive]="page() === p" (click)="goToPage(p)">{{ p }}</a>
    </li>
  }
  <li hlmPaginationItem (click)="goToPage(page() + 1)"><hlm-pagination-next /></li>
</ul>`;
}
