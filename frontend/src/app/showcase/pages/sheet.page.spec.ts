import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SheetPage } from './sheet.page';

/**
 * Sheet content sits behind `*hlmSheetPortal`, so it renders nothing until a
 * trigger opens it, and the CDK overlay attaches it to `document.body` rather
 * than under the fixture host. Every assertion here queries `document.body`
 * and checks absent-then-present around a real click.
 */
describe('SheetPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SheetPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SheetPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // Exact-text match: `document.body` holds both the light-DOM trigger and,
  // once open, the overlay's own buttons, some of which share a prefix with a
  // trigger label (e.g. "Open cart (2)" vs "Clear cart") — a prefix match
  // would silently re-click the wrong element.
  async function clickButton(text: string, within: ParentNode = host): Promise<void> {
    const button = [...within.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
    expect(button, `no button matching "${text}"`).toBeTruthy();
    (button as HTMLButtonElement).click();
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

  it('renders no sheet content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-sheet-content')).toBeNull();
  });

  it('opens the default usage and closes it again via Close', async () => {
    await clickButton('Edit profile');

    const content = document.body.querySelector('hlm-sheet-content');
    expect(content, 'sheet content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelector('[hlmSheetTitle]')?.textContent).toContain('Edit profile');
    expect(content!.querySelector('input#sheet-name')).toBeTruthy();

    await clickButton('Close', document.body);
    expect(document.body.querySelector('hlm-sheet-content')).toBeNull();
  });

  it('opens each side to a real data-side attribute on the content', async () => {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      await clickButton(side);
      const content = document.body.querySelector('hlm-sheet-content');
      expect(content?.getAttribute('data-side'), `side "${side}" did not render`).toBe(side);
      await clickButton('Close', document.body);
    }
  });

  it('clears the cart from real signal state, not a hand-set attribute', async () => {
    expect(host.textContent).toContain('2 item(s), $50 total.');

    await clickButton('Open cart (2)');
    expect(document.body.textContent).toContain('2 item(s)');

    await clickButton('Clear cart', document.body);

    expect(host.textContent).toContain('Cart is empty.');
    await clickButton('Close', document.body);
  });

  it('marks every notification read from real signal state and updates the list', async () => {
    expect(host.textContent).toContain('2 unread notification(s).');

    await clickButton('Notifications (2)');
    const content = document.body.querySelector('hlm-sheet-content');
    expect(content?.querySelectorAll('.bg-primary').length, 'expected two unread dots').toBe(2);

    await clickButton('Mark all read', document.body);

    expect(host.textContent).toContain('0 unread notification(s).');
    expect(document.body.querySelector('hlm-sheet-content')?.querySelectorAll('.bg-primary').length).toBe(0);

    await clickButton('Close', document.body);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSheet');
    expect(text).toContain('showCloseButton');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/sheet');
  });
});
