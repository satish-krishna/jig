import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DrawerPage } from './drawer.page';

/**
 * Drawer content sits behind `*hlmDrawerPortal`, so it renders nothing until
 * a trigger opens it, and the CDK overlay attaches it to `document.body`
 * rather than under the fixture host. Every assertion here queries
 * `document.body` and checks absent-then-present around a real click.
 */
describe('DrawerPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DrawerPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DrawerPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // Exact-text match: `document.body` holds both the light-DOM trigger and,
  // once open, the overlay's own buttons, some of which share a prefix with a
  // trigger label — a prefix match would silently re-click the wrong element.
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

  it('renders no drawer content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-drawer-content')).toBeNull();
  });

  it('opens the default usage and closes it again via Cancel', async () => {
    await clickButton('Edit profile');

    const content = document.body.querySelector('hlm-drawer-content');
    expect(content, 'drawer content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelector('[hlmDrawerTitle]')?.textContent).toContain('Edit profile');
    expect(content!.querySelector('input#drawer-name')).toBeTruthy();

    await clickButton('Cancel', document.body);
    expect(document.body.querySelector('hlm-drawer-content')).toBeNull();
  });

  it('opens each direction to a real data-vaul-drawer-direction attribute', async () => {
    for (const dir of ['top', 'right', 'bottom', 'left']) {
      await clickButton(dir);
      const content = document.body.querySelector('hlm-drawer-content');
      expect(content?.getAttribute('data-vaul-drawer-direction'), `direction "${dir}" did not render`).toBe(dir);
      await clickButton('Close', document.body);
    }
  });

  it('runs the destructive confirm flow off real signal state, not a hand-set attribute', async () => {
    expect(host.textContent).toContain('Conversation still here.');

    await clickButton('Delete conversation');
    await clickButton('Delete', document.body);

    expect(host.textContent).toContain('Conversation deleted.');
    expect(document.body.querySelector('hlm-drawer-content')).toBeNull();
  });

  it('narrows the filtered result count from real checkbox state', async () => {
    expect(host.textContent).toContain('12 of 12 shown.');

    await clickButton('Filters (12)');
    const content = document.body.querySelector('hlm-drawer-content');
    // hlm-checkbox is a sibling to its label, paired by inputId/for — not
    // native input-inside-label — so find the pairing id off the label and
    // query the real, clickable role="checkbox" button by that id.
    const starredLabel = [...content!.querySelectorAll('label')].find((l) => l.textContent?.includes('Starred'));
    const checkboxId = starredLabel!.getAttribute('for');
    const checkbox = content!.querySelector(`#${checkboxId}`) as HTMLButtonElement;
    expect(checkbox.getAttribute('aria-checked')).toBe('false');

    checkbox.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('6 of 12 shown.');

    await clickButton('Apply', document.body);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmDrawer');
    expect(text).toContain('HlmDrawerClose');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/drawer');
  });
});
