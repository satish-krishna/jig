import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenubarPage } from './menubar.page';

/**
 * Each `[hlmMenubarTrigger]` button opens the SAME `hlm-dropdown-menu` panel
 * the dropdown-menu component uses, through the identical `#menu` ng-template
 * binding, via Angular CDK Menu — so it opens into a CDK overlay under
 * `document.body`, exactly like dropdown-menu and context-menu, and every
 * assertion here follows the same absent-then-present, click-then-body
 * pattern.
 *
 * Several usages reuse a label across menus (two "File" triggers, for
 * instance), so triggers are looked up scoped to their own usage stage
 * rather than by a bare text search over the whole page.
 */
describe('MenubarPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MenubarPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(MenubarPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function stage(index: number): HTMLElement {
    const stages = host.querySelectorAll('[data-slot="usage-stage"]');
    return stages[index] as HTMLElement;
  }

  // Items with icons or shortcuts concatenate extra text into textContent
  // (e.g. "New File⌘N"), so match by prefix — scoped to a single usage stage
  // (or, once a menu is open, to document.body) so a repeated label like
  // "File" cannot resolve to the wrong trigger.
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

  it('every usage stage has a real menubar with at least one trigger', () => {
    for (const s of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(s.querySelector('[data-slot="menubar"]'), 'a usage stage rendered no menubar').toBeTruthy();
      expect(s.querySelector('[data-slot="menubar-trigger"]'), 'a usage stage rendered no menubar trigger').toBeTruthy();
    }
  });

  it('renders no menu content until a trigger opens it', () => {
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('opens the basic File menu on click and renders its real items', async () => {
    await click(findButton('File', stage(0)));

    const menu = document.body.querySelector('hlm-dropdown-menu');
    expect(menu, 'menu did not render after clicking the trigger').toBeTruthy();
    expect(menu!.textContent).toContain('New Tab');

    await click(findButton('New Tab'));
    expect(document.body.querySelector('hlm-dropdown-menu')).toBeNull();
  });

  it('renders icons and shortcuts in the second usage', async () => {
    await click(findButton('File', stage(1)));

    const menu = document.body.querySelector('hlm-dropdown-menu')!;
    expect(menu.querySelector('ng-icon')).toBeTruthy();
    expect(menu.querySelector('hlm-dropdown-menu-shortcut')?.textContent).toContain('⌘N');

    await click(findButton('New File'));
  });

  it('drives checkboxes and the radio group across two separate menus from real signals', async () => {
    expect(host.textContent).toContain('Full URLs hidden');
    expect(host.textContent).toContain('profile benoit');

    await click(findButton('View', stage(2)));
    await click(findButton('Full URLs'));
    expect(host.textContent).toContain('Full URLs shown');

    await click(findButton('Profiles', stage(2)));
    await click(findButton('Andy'));
    expect(host.textContent).toContain('profile andy');
  });

  it('runs the composition usage with a disabled item, a destructive item and a real submenu', async () => {
    expect(host.textContent).toContain('Word wrap off');

    await click(findButton('File', stage(3)));
    const menu = document.body.querySelector('hlm-dropdown-menu')!;

    const closeWindow = [...menu.querySelectorAll('button')].find((b) => b.textContent?.includes('Close Window'));
    expect(closeWindow?.hasAttribute('disabled')).toBe(true);

    const deleteFile = [...menu.querySelectorAll('[hlmdropdownmenuitem], [hlmDropdownMenuItem]')].find((el) =>
      el.textContent?.includes('Delete File'),
    );
    expect(deleteFile?.getAttribute('data-variant')).toBe('destructive');

    await click(findButton('Open Recent'));
    const sub = document.body.querySelector('hlm-dropdown-menu-sub');
    expect(sub, 'submenu did not render after clicking its trigger').toBeTruthy();
    expect(sub!.textContent).toContain('report.docx');

    await click(findButton('View', stage(3)));
    await click(findButton('Word Wrap'));
    expect(host.textContent).toContain('Word wrap on');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmMenubar');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/menubar');
  });
});
