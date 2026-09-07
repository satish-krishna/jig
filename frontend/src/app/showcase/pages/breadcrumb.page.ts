import { Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSlash } from '@ng-icons/lucide';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Breadcrumb usages. Anatomy confirmed against the spartan MCP docs and the
 * vendored source: `nav[hlmBreadcrumb]` > `ol[hlmBreadcrumbList]` > repeated
 * `li[hlmBreadcrumbItem]` — every item and every separator is a sibling `<li>`,
 * none of it is a named projection slot. `hlmBreadcrumbSeparator` defaults to a
 * chevron via its own `<ng-content>` fallback, so a custom icon is only needed
 * when the default doesn't fit. `hlmBreadcrumbLink`'s `link` input is the
 * routerLink alias — omit it and the anchor is inert, which is what the
 * state-driven usage below relies on to avoid firing real navigation.
 */
@Component({
  selector: 'app-breadcrumb-page',
  imports: [ComponentPage, Usage, HlmBreadcrumbImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideSlash })],
  template: `
    <app-component-page slug="breadcrumb">
      <app-usage
        title="Default"
        note="Links carry a real routerLink via the link input; the last segment is the current, non-linked page."
        [code]="codeDefault"
      >
        <nav hlmBreadcrumb>
          <ol hlmBreadcrumbList>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/">Home</a>
            </li>
            <li hlmBreadcrumbSeparator></li>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/library">Library</a>
            </li>
            <li hlmBreadcrumbSeparator></li>
            <li hlmBreadcrumbItem>
              <span hlmBreadcrumbPage>Data</span>
            </li>
          </ol>
        </nav>
      </app-usage>

      <app-usage
        title="Custom separator icon"
        note="hlmBreadcrumbSeparator projects its content over the default chevron — here a slash, like a file path."
        [code]="codeIcons"
      >
        <nav hlmBreadcrumb>
          <ol hlmBreadcrumbList>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/">Home</a>
            </li>
            <li hlmBreadcrumbSeparator><ng-icon name="lucideSlash" /></li>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/projects">Projects</a>
            </li>
            <li hlmBreadcrumbSeparator><ng-icon name="lucideSlash" /></li>
            <li hlmBreadcrumbItem>
              <span hlmBreadcrumbPage>jig</span>
            </li>
          </ol>
        </nav>
      </app-usage>

      <app-usage
        title="State-driven trail"
        note="The trail is a real signal-backed array — clicking an earlier segment truncates it, like drilling back out of a folder."
        [code]="codeState"
      >
        <div class="flex w-full flex-col gap-s">
          <nav hlmBreadcrumb>
            <ol hlmBreadcrumbList>
              @for (segment of trail(); track segment; let i = $index, last = $last) {
                <li hlmBreadcrumbItem>
                  @if (last) {
                    <span hlmBreadcrumbPage>{{ segment }}</span>
                  } @else {
                    <a hlmBreadcrumbLink (click)="goTo(i)">{{ segment }}</a>
                  }
                </li>
                @if (!last) {
                  <li hlmBreadcrumbSeparator></li>
                }
              }
            </ol>
          </nav>
          <button
            hlmBtn
            variant="link"
            type="button"
            class="w-fit"
            (click)="drillIn()"
          >
            Open "Reports" folder
          </button>
        </div>
      </app-usage>

      <app-usage
        title="Composition: collapsed long path"
        note="hlm-breadcrumb-ellipsis stands in for the segments a deep path would otherwise spell out in full."
        [code]="codeComposition"
      >
        <nav hlmBreadcrumb>
          <ol hlmBreadcrumbList>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/">Home</a>
            </li>
            <li hlmBreadcrumbSeparator></li>
            <li hlmBreadcrumbItem>
              <hlm-breadcrumb-ellipsis />
            </li>
            <li hlmBreadcrumbSeparator></li>
            <li hlmBreadcrumbItem>
              <a hlmBreadcrumbLink link="/settings">Settings</a>
            </li>
            <li hlmBreadcrumbSeparator></li>
            <li hlmBreadcrumbItem>
              <span hlmBreadcrumbPage>Profile</span>
            </li>
          </ol>
        </nav>
      </app-usage>
    </app-component-page>
  `,
})
export class BreadcrumbPage {
  /** The full trail; the state-driven usage truncates or extends it, never hand-sets a "current" flag. */
  protected readonly trail = signal(['Home', 'Documents']);

  protected goTo(index: number): void {
    this.trail.update((segments) => segments.slice(0, index + 1));
  }

  protected drillIn(): void {
    this.trail.update((segments) => [...segments, 'Reports']);
  }

  protected readonly codeDefault = `<nav hlmBreadcrumb>
  <ol hlmBreadcrumbList>
    <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/">Home</a></li>
    <li hlmBreadcrumbSeparator></li>
    <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/library">Library</a></li>
    <li hlmBreadcrumbSeparator></li>
    <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Data</span></li>
  </ol>
</nav>`;

  protected readonly codeIcons = `<li hlmBreadcrumbSeparator><ng-icon name="lucideSlash" /></li>`;

  protected readonly codeState = `// The trail is a signal — clicking an earlier link truncates it.
trail = signal(['Home', 'Documents']);
goTo(i) { this.trail.update((s) => s.slice(0, i + 1)); }
drillIn() { this.trail.update((s) => [...s, 'Reports']); }

<ol hlmBreadcrumbList>
  @for (segment of trail(); track segment; let i = $index, last = $last) {
    <li hlmBreadcrumbItem>
      @if (last) {
        <span hlmBreadcrumbPage>{{ segment }}</span>
      } @else {
        <a hlmBreadcrumbLink (click)="goTo(i)">{{ segment }}</a>
      }
    </li>
    @if (!last) { <li hlmBreadcrumbSeparator></li> }
  }
</ol>`;

  protected readonly codeComposition = `<nav hlmBreadcrumb>
  <ol hlmBreadcrumbList>
    <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/">Home</a></li>
    <li hlmBreadcrumbSeparator></li>
    <li hlmBreadcrumbItem><hlm-breadcrumb-ellipsis /></li>
    <li hlmBreadcrumbSeparator></li>
    <li hlmBreadcrumbItem><a hlmBreadcrumbLink link="/settings">Settings</a></li>
    <li hlmBreadcrumbSeparator></li>
    <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Profile</span></li>
  </ol>
</nav>`;
}
