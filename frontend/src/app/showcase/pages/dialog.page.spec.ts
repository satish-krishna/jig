import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DialogPage } from './dialog.page';

/**
 * Dialog content lives behind `*hlmDialogPortal`, so it renders nothing until
 * a trigger opens it, and the CDK overlay attaches the content to
 * `document.body` rather than under the fixture host. Every assertion here
 * queries `document.body` and checks absent-then-present around a real click.
 */
describe('DialogPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<DialogPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(DialogPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  // Closing a dialog runs through BrnDialogRef.close(), which defers the
  // actual overlay teardown to `afterNextRender` plus an async animation
  // check — a plain synchronous detectChanges() is not guaranteed to observe
  // it, so every click awaits zone stability before the caller asserts.
  //
  // Matching is exact text by default: `document.body` holds both the light-DOM
  // trigger ("Delete project") and, once open, the overlay's own button
  // ("Delete") — a prefix match would find the trigger first and silently
  // re-click it instead of the footer action. Pass `startsWith: true` only for
  // the one trigger whose own label is dynamic.
  async function clickButton(
    text: string,
    within: ParentNode = host,
    options: { startsWith?: boolean } = {},
  ): Promise<void> {
    const button = [...within.querySelectorAll('button')].find((b) => {
      const label = b.textContent?.trim() ?? '';
      return options.startsWith ? label.startsWith(text) : label === text;
    });
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

  it('renders no dialog content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-dialog-content')).toBeNull();
  });

  it('opens the default usage on click and renders a real title and form field', async () => {
    await clickButton('Edit profile');

    const content = document.body.querySelector('hlm-dialog-content');
    expect(content, 'dialog content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelector('[hlmDialogTitle]')?.textContent).toContain('Edit profile');
    expect(content!.querySelector('input#dlg-name')).toBeTruthy();

    await clickButton('Cancel', document.body);
    expect(document.body.querySelector('hlm-dialog-content')).toBeNull();
  });

  it('opens each size trigger to a differently classed content', async () => {
    await clickButton('Small');
    let content = document.body.querySelector('hlm-dialog-content');
    expect(content?.className).toContain('sm:max-w-xs');
    await clickButton('Close', document.body);

    await clickButton('Large');
    content = document.body.querySelector('hlm-dialog-content');
    expect(content?.className).toContain('sm:max-w-lg');
    await clickButton('Close', document.body);
  });

  it('runs the destructive confirm flow off real signal state, not a hand-set attribute', async () => {
    expect(host.textContent).toContain('Not deleted yet.');

    await clickButton('Delete project');
    await clickButton('Delete', document.body);

    expect(host.textContent).toContain('Deleted 1 time(s) so far.');
    expect(document.body.querySelector('hlm-dialog-content')).toBeNull();
  });

  it('tracks the open count from a real stateChanged event, not a hardcoded label', async () => {
    expect(host.textContent).toContain('Open (0 times so far)');

    await clickButton('Open (0 times so far)');
    expect(host.textContent).toContain('Open (1 times so far)');

    await clickButton('Close', document.body);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmDialog');
    expect(text).toContain('showCloseButton');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/dialog');
  });
});
