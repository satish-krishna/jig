import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideBox, lucideLayers } from '@ng-icons/lucide';
import { HlmNavigationMenuImports } from '@spartan-ng/helm/navigation-menu';
import { ComponentPage } from '../component-page';
import { Usage } from '../usage';

/**
 * Navigation menu usages. Anatomy confirmed against the spartan MCP docs and
 * the vendored source: `nav[hlmNavigationMenu]` > `ul[hlmNavigationMenuList]` >
 * `li[hlmNavigationMenuItem]`, each holding either a plain `a[hlmNavigationMenuLink]`
 * or a `button[hlmNavigationMenuTrigger]` paired with a SIBLING
 * `hlm-navigation-menu-content` marked `*hlmNavigationMenuPortal` — that
 * structural directive is the projected-slot failure mode here: without it the
 * trigger has nothing to open. The content itself is attached through a CDK
 * overlay to `document.body`, not under the item, and opening runs through an
 * rxjs `delay(0)` even with `openOn="click"` — every usage below sets
 * `openOn="click"` for determinism, and the spec awaits `fixture.whenStable()`
 * after each click (the same pattern `dialog.page.spec.ts` uses for its portal).
 */
@Component({
  selector: 'app-navigation-menu-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComponentPage, Usage, HlmNavigationMenuImports, NgIcon],
  providers: [provideIcons({ lucideBox, lucideLayers, lucideBookOpen })],
  template: `
    <app-component-page slug="navigation-menu">
      <app-usage
        title="Default"
        note="openOn=click keeps this predictable in a doc page; the default is hover."
        [code]="codeDefault"
      >
        <nav hlmNavigationMenu openOn="click">
          <ul hlmNavigationMenuList>
            <li hlmNavigationMenuItem>
              <button hlmNavigationMenuTrigger>Product</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-[220px] gap-xs p-s">
                  <li><a hlmNavigationMenuLink href="#">Overview</a></li>
                  <li><a hlmNavigationMenuLink href="#">Pricing</a></li>
                  <li><a hlmNavigationMenuLink href="#">Changelog</a></li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#">Contact</a>
            </li>
          </ul>
        </nav>
      </app-usage>

      <app-usage
        title="With icons"
        note="Each link in the panel carries its own icon — the panel is just a list, nothing icon-specific about it."
        [code]="codeIcons"
      >
        <nav hlmNavigationMenu openOn="click">
          <ul hlmNavigationMenuList>
            <li hlmNavigationMenuItem>
              <button hlmNavigationMenuTrigger>Design system</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-60 gap-xs p-s">
                  <li>
                    <a hlmNavigationMenuLink href="#"><ng-icon name="lucideBox" />Primitives</a>
                  </li>
                  <li>
                    <a hlmNavigationMenuLink href="#"><ng-icon name="lucideLayers" />Layouts</a>
                  </li>
                  <li>
                    <a hlmNavigationMenuLink href="#"><ng-icon name="lucideBookOpen" />Guides</a>
                  </li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
          </ul>
        </nav>
      </app-usage>

      <app-usage
        title="State-driven"
        note="[value]/(valueChange) are wired to a real signal — the open item's id is displayed, not hand-set."
        [code]="codeState"
      >
        <div class="flex w-full flex-col gap-s">
          <nav hlmNavigationMenu openOn="click" [value]="openItem()" (valueChange)="openItem.set($event)">
            <ul hlmNavigationMenuList>
              <li hlmNavigationMenuItem id="getting-started">
                <button hlmNavigationMenuTrigger>Getting started</button>
                <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                  <p class="w-48 p-m text-sm">Install the CLI and scaffold your first project.</p>
                </hlm-navigation-menu-content>
              </li>
              <li hlmNavigationMenuItem id="components">
                <button hlmNavigationMenuTrigger>Components</button>
                <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                  <p class="w-48 p-m text-sm">Browse every component and its API.</p>
                </hlm-navigation-menu-content>
              </li>
            </ul>
          </nav>
          <p class="text-muted-foreground text-xs">Open: {{ openItem() ?? 'none' }}</p>
        </div>
      </app-usage>

      <app-usage
        title="Composition: docs nav with an active link"
        note="A realistic top bar: a dropdown trigger alongside plain links, one marked active via BrnNavigationMenuLink's active input."
        [code]="codeComposition"
      >
        <nav hlmNavigationMenu openOn="click" class="w-full max-w-md justify-start">
          <ul hlmNavigationMenuList>
            <li hlmNavigationMenuItem>
              <button hlmNavigationMenuTrigger>Docs</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-[220px] gap-xs p-s">
                  <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBookOpen" />Guides</a></li>
                  <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBox" />API reference</a></li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#" [active]="true">Dashboard</a>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#">Settings</a>
            </li>
          </ul>
        </nav>
      </app-usage>
    </app-component-page>
  `,
})
export class NavigationMenuPage {
  /** Drives the state-driven usage — which item id is currently open, or undefined when closed. */
  protected readonly openItem = signal<string | undefined>(undefined);

  protected readonly codeDefault = `<nav hlmNavigationMenu openOn="click">
  <ul hlmNavigationMenuList>
    <li hlmNavigationMenuItem>
      <button hlmNavigationMenuTrigger>Product</button>
      <hlm-navigation-menu-content *hlmNavigationMenuPortal>
        <ul>
          <li><a hlmNavigationMenuLink href="#">Overview</a></li>
          <li><a hlmNavigationMenuLink href="#">Pricing</a></li>
          <li><a hlmNavigationMenuLink href="#">Changelog</a></li>
        </ul>
      </hlm-navigation-menu-content>
    </li>
    <li hlmNavigationMenuItem><a hlmNavigationMenuLink href="#">Contact</a></li>
  </ul>
</nav>`;

  protected readonly codeIcons = `<button hlmNavigationMenuTrigger>Design system</button>
<hlm-navigation-menu-content *hlmNavigationMenuPortal>
  <ul>
    <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBox" />Primitives</a></li>
    <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideLayers" />Layouts</a></li>
    <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBookOpen" />Guides</a></li>
  </ul>
</hlm-navigation-menu-content>`;

  protected readonly codeState = `// value/valueChange carry the open item's id — a real signal, not a hand-set attribute.
openItem = signal<string | undefined>(undefined);

<nav hlmNavigationMenu openOn="click" [value]="openItem()" (valueChange)="openItem.set($event)">
  <ul hlmNavigationMenuList>
    <li hlmNavigationMenuItem id="getting-started">
      <button hlmNavigationMenuTrigger>Getting started</button>
      <hlm-navigation-menu-content *hlmNavigationMenuPortal>...</hlm-navigation-menu-content>
    </li>
    <li hlmNavigationMenuItem id="components">
      <button hlmNavigationMenuTrigger>Components</button>
      <hlm-navigation-menu-content *hlmNavigationMenuPortal>...</hlm-navigation-menu-content>
    </li>
  </ul>
</nav>
<p>Open: {{ openItem() ?? 'none' }}</p>`;

  protected readonly codeComposition = `<nav hlmNavigationMenu openOn="click">
  <ul hlmNavigationMenuList>
    <li hlmNavigationMenuItem>
      <button hlmNavigationMenuTrigger>Docs</button>
      <hlm-navigation-menu-content *hlmNavigationMenuPortal>
        <ul>
          <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBookOpen" />Guides</a></li>
          <li><a hlmNavigationMenuLink href="#"><ng-icon name="lucideBox" />API reference</a></li>
        </ul>
      </hlm-navigation-menu-content>
    </li>
    <li hlmNavigationMenuItem><a hlmNavigationMenuLink href="#" [active]="true">Dashboard</a></li>
    <li hlmNavigationMenuItem><a hlmNavigationMenuLink href="#">Settings</a></li>
  </ul>
</nav>`;
}
