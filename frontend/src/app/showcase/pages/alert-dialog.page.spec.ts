import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertDialogPage } from './alert-dialog.page';

/**
 * Alert dialog content sits behind `*hlmAlertDialogPortal`, so it renders
 * nothing until a trigger opens it, and the CDK overlay attaches it to
 * `document.body` rather than under the fixture host. Every assertion here
 * queries `document.body` and checks absent-then-present around a real click.
 *
 * `HlmAlertDialogAction` is a plain styled button upstream (no BrnDialogClose
 * host directive) — clicking it runs the app's own handler but does not
 * auto-close the dialog, matching spartan's own docs example. Only Cancel
 * closes on its own.
 */
describe('AlertDialogPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AlertDialogPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(AlertDialogPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // Exact-text match: `document.body` holds both the light-DOM trigger and,
  // once open, the overlay's own buttons — several of which share a prefix
  // with a trigger label (e.g. "Delete item" vs "Delete") — so a prefix match
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

  it('renders no alert dialog content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-alert-dialog-content')).toBeNull();
  });

  it('opens the default usage and closes it again via Cancel', async () => {
    await clickButton('Show dialog');

    const content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content, 'alert dialog content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelector('[hlmAlertDialogTitle]')?.textContent).toContain('Are you absolutely sure?');

    await clickButton('Cancel', document.body);
    expect(document.body.querySelector('hlm-alert-dialog-content')).toBeNull();
  });

  it('reflects the size input as a real data-size attribute per trigger', async () => {
    await clickButton('Small');
    let content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content?.getAttribute('data-size')).toBe('sm');
    await clickButton('Keep editing', document.body);

    await clickButton('Default');
    content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content?.getAttribute('data-size')).toBe('default');
    await clickButton('Cancel', document.body);
  });

  it('runs the destructive action off real signal state and renders the media icon', async () => {
    expect(host.textContent).toContain('Nothing removed yet.');

    await clickButton('Delete item');
    const content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content!.querySelector('ng-icon')).toBeTruthy();

    await clickButton('Delete', document.body);
    expect(host.textContent).toContain('The item was removed.');
  });

  it('updates the still-open dialog live when the composition action flips real state', async () => {
    expect(host.textContent).toContain('Still a member.');

    await clickButton('Leave workspace');
    let content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content!.querySelector('[hlmAlertDialogTitle]')?.textContent).toContain('Leave this workspace?');

    await clickButton('Leave', document.body);

    // The action does not close the dialog — the same overlay re-renders in
    // place from the flipped signal, without a fresh open/close round trip.
    content = document.body.querySelector('hlm-alert-dialog-content');
    expect(content, 'dialog unexpectedly closed after the action').toBeTruthy();
    expect(content!.querySelector('[hlmAlertDialogTitle]')?.textContent).toContain('Rejoin this workspace?');
    expect(host.textContent).toContain('You left the workspace.');

    await clickButton('Cancel', document.body);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAlertDialog');
    expect(text).toContain('HlmAlertDialogMedia');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/alert-dialog');
  });
});
