import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContextMenuPage } from './context-menu.page';

/**
 * Context menu opens on the native `contextmenu` event (right-click), never
 * `click` — `CdkContextMenuTrigger` listens for it directly. Every trigger
 * here is opened by dispatching a real `contextmenu` MouseEvent, and its
 * panel (a plain `hlm-dropdown-menu`, shared with the dropdown-menu
 * component) renders into the CDK overlay under `document.body`, so
 * assertions follow the same absent-then-present pattern as dialog and
 * dropdown-menu.
 */
describe('ContextMenuPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ContextMenuPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ContextMenuPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  async function rightClick(el: Element): Promise<void> {
    el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 }));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // Items with icons or shortcuts concatenate extra text into textContent
  // (e.g. "Copy⌘C"), so match by prefix — every label here is unique enough
  // within its own menu that a prefix match cannot land on the wrong button.
  function findButton(text: string, within: ParentNode = document.body): HTMLButtonElement {
    const button = [...within.querySelectorAll('button')].find((b) => b.textContent?.trim().startsWith(text));
    expect(button, `no button matching "${text}"`).toBeTruthy();
    return button as HTMLButtonElement;
  }

  async function click(el: Element): Promise<void> {
    (el as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real context-menu trigger element', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(
        stage.querySelector('[data-slot="context-menu-trigger"]'),
        'a usage stage rendered no context-menu trigger',
      ).toBeTruthy();
    }
  });

  it('renders no menu content until a right-click opens it', () => {
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('does nothing on a plain click — only contextmenu opens it', async () => {
    const trigger = host.querySelector('[data-slot="context-menu-trigger"]') as HTMLElement;
    await click(trigger);
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('opens the basic menu on right-click and renders its real items, including a disabled one', async () => {
    const triggers = host.querySelectorAll('[data-slot="context-menu-trigger"]');
    await rightClick(triggers[0]);

    const menu = document.body.querySelector('hlm-dropdown-menu');
    expect(menu, 'menu did not render after right-clicking the trigger').toBeTruthy();
    expect(menu!.textContent).toContain('Back');

    const forward = [...menu!.querySelectorAll('button')].find((b) => b.textContent?.includes('Forward'));
    expect(forward?.hasAttribute('disabled')).toBe(true);
  });

  it('renders icons and shortcuts in the second trigger menu', async () => {
    const triggers = host.querySelectorAll('[data-slot="context-menu-trigger"]');
    await rightClick(triggers[1]);

    const menu = document.body.querySelector('hlm-dropdown-menu')!;
    expect(menu.querySelector('ng-icon')).toBeTruthy();
    expect(menu.querySelector('hlm-dropdown-menu-shortcut')?.textContent).toContain('⌘C');
  });

  it('drives checkboxes and the radio group from real signals, and opens a real submenu', async () => {
    expect(host.textContent).toContain('Full URLs hidden');
    expect(host.textContent).toContain('sort by name');

    const triggers = host.querySelectorAll('[data-slot="context-menu-trigger"]');
    await rightClick(triggers[2]);

    await click(findButton('Show full URLs'));
    expect(host.textContent).toContain('Full URLs shown');

    await click(findButton('Date modified'));
    expect(host.textContent).toContain('sort by date');

    await click(findButton('More Tools'));
    const sub = document.body.querySelector('hlm-dropdown-menu-sub');
    expect(sub, 'submenu did not render after clicking its trigger').toBeTruthy();
    expect(sub!.textContent).toContain('Developer Tools');
  });

  it('runs the composition usage off a real triggered output, not a hardcoded note', async () => {
    expect(host.textContent).toContain('No action yet');

    const triggers = host.querySelectorAll('[data-slot="context-menu-trigger"]');
    await rightClick(triggers[3]);
    await click(findButton('Rename'));

    expect(host.textContent).toContain('Last action: rename');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmContextMenu');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/context-menu');
  });
});
