import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DropdownMenuPage } from './dropdown-menu.page';

/**
 * Dropdown menu content lives behind an `#menu` `ng-template` referenced by
 * `[hlmDropdownMenuTrigger]` — Angular CDK Menu (`@angular/cdk/menu`), not the
 * Brn dialog portal. CdkMenuTrigger opens the template into a CDK overlay
 * attached to `document.body`, so every assertion here follows the same
 * absent-then-present, click-then-`document.body` pattern as `dialog.page.spec.ts`.
 */
describe('DropdownMenuPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DropdownMenuPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DropdownMenuPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // Items with an icon or a trailing hlm-dropdown-menu-shortcut concatenate extra text
  // into textContent (e.g. "New file⌘N"), so match by prefix rather than exact equality —
  // every label used here is unique enough in its menu that a prefix match is unambiguous.
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

  it('every usage stage has a real trigger button', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('button'), 'a usage stage rendered no trigger button').toBeTruthy();
    }
  });

  it('renders no menu content until a trigger opens it', () => {
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('opens the account menu on click and renders its real items', async () => {
    await click(findButton('Account', host));

    const menu = document.body.querySelector('hlm-dropdown-menu');
    expect(menu, 'menu did not render after clicking the trigger').toBeTruthy();
    expect(menu!.textContent).toContain('My Account');
    expect(menu!.textContent).toContain('Profile');

    const disabled = [...menu!.querySelectorAll('button')].find((b) => b.textContent?.includes('Team'));
    expect(disabled?.hasAttribute('disabled')).toBe(true);

    // Selecting a plain item closes the menu.
    await click(findButton('Profile'));
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('renders icons and shortcuts in the file menu', async () => {
    await click(findButton('File', host));

    const menu = document.body.querySelector('hlm-dropdown-menu')!;
    expect(menu.querySelector('ng-icon')).toBeTruthy();
    expect(menu.querySelector('hlm-dropdown-menu-shortcut')?.textContent).toContain('⌘N');

    const destructive = [...menu.querySelectorAll('[hlmdropdownmenuitem], [hlmDropdownMenuItem]')].find((el) =>
      el.textContent?.includes('Delete'),
    );
    expect(destructive?.getAttribute('data-variant')).toBe('destructive');

    await click(findButton('New file'));
  });

  it('drives checkboxes and the radio group from real signals, and opens a real submenu', async () => {
    expect(host.textContent).toContain('Theme: system');
    expect(host.textContent).toContain('status bar on');

    await click(findButton('View', host));

    let statusBarBtn = findButton('Status bar');
    expect(statusBarBtn.getAttribute('data-checked')).toBe('');

    await click(statusBarBtn);
    expect(host.textContent).toContain('status bar off');
    // hlmDropdownMenuCheckbox keeps the menu open (keepOpen defaults true), so the
    // same overlay is still there to re-query rather than needing to reopen it.
    statusBarBtn = findButton('Status bar');
    expect(statusBarBtn.hasAttribute('data-checked')).toBe(false);

    await click(findButton('Dark'));
    expect(host.textContent).toContain('Theme: dark');

    // The submenu trigger opens a second, real hlm-dropdown-menu-sub in the overlay.
    await click(findButton('Zoom'));
    const sub = document.body.querySelector('hlm-dropdown-menu-sub');
    expect(sub, 'submenu did not render after clicking its trigger').toBeTruthy();
    expect(sub!.textContent).toContain('Zoom in');
  });

  it('runs the composition usage off real signal state, not hand-set attributes', async () => {
    expect(host.textContent).toContain('Email on, SMS off.');

    await click(findButton('Notifications', host));
    await click(findButton('Email'));

    expect(host.textContent).toContain('Email off, SMS off.');

    const snooze = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.includes('Snooze'));
    expect(snooze?.hasAttribute('disabled')).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmDropdownMenu');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/dropdown-menu');
  });
});
