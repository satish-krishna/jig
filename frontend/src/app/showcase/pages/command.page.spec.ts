import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommandPage } from './command.page';

// jsdom has no scrollIntoView; BrnCommand's active-item key manager calls it on every
// setActiveItem (including the initial afterNextRender), so it throws with no stub.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * `hlm-command` itself is a plain component with no overlay of its own — the
 * first and third usages render straight into the fixture host. Only
 * `hlm-command-dialog` (usages two and four) goes through a CDK overlay, via
 * the same `hlm-dialog` / `*hlmDialogPortal` machinery `dialog.page.spec.ts`
 * exercises, so those two follow its absent-then-present, click-then-body
 * pattern. Filtering is asserted by actually typing into the real
 * `input[brnCommandInput]` and reading each item's `data-hidden` attribute —
 * never a hand-set flag.
 */
describe('CommandPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CommandPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CommandPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function stage(index: number): HTMLElement {
    const stages = host.querySelectorAll('[data-slot="usage-stage"]');
    return stages[index] as HTMLElement;
  }

  // Two usages share the "Open command palette" trigger label, so lookups are
  // scoped to a single usage stage rather than a bare text search over the page.
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

  // Drives the real BrnCommandInput (input) listener rather than setting search directly.
  async function type(input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage renders a real command input', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      // The dialog-based usages render their input into document.body only once opened,
      // so a trigger button stands in for the input in those two stages.
      const hasInput = stage.querySelector('input[data-slot="command-input"]');
      const hasTrigger = stage.querySelector('button');
      expect(hasInput || hasTrigger, 'a usage stage rendered neither a command input nor a trigger').toBeTruthy();
    }
  });

  it('renders the inline command list directly in the page, with no overlay', () => {
    const command = host.querySelector('hlm-command');
    expect(command, 'hlm-command did not render inline').toBeTruthy();
    expect(command!.textContent).toContain('Calendar');
    expect(command!.textContent).toContain('Profile');
  });

  it('filters the inline list by typing, and shows the empty state when nothing matches', async () => {
    const command = host.querySelector('hlm-command')!;
    const input = command.querySelector('input[data-slot="command-input"]') as HTMLInputElement;

    await type(input, 'cal');

    const calendar = [...command.querySelectorAll('button[hlm-command-item]')].find((b) => b.getAttribute('data-value') === 'Calendar');
    const profile = [...command.querySelectorAll('button[hlm-command-item]')].find((b) => b.getAttribute('data-value') === 'Profile');
    expect(calendar?.hasAttribute('data-hidden')).toBe(false);
    expect(profile?.hasAttribute('data-hidden')).toBe(true);

    await type(input, 'zzz-no-match');
    expect(command.querySelector('[hlmcommandempty], [hlmCommandEmpty]')?.textContent).toContain('No results found.');
  });

  it('selecting an inline item drives the note off a real (selected) output', async () => {
    expect(host.textContent).toContain("Nothing selected yet");

    const command = host.querySelector('hlm-command')!;
    await click(findButton('Calendar', command));

    expect(host.textContent).toContain('Selected: Calendar');
  });

  it('renders no dialog content until the icons usage trigger opens it', () => {
    // hlm-command-dialog is a plain component (it renders inline, wrapping an as-yet-closed
    // hlm-dialog) — it is hlm-dialog-content, behind *hlmDialogPortal, that only appears
    // in the CDK overlay once opened, exactly as in dialog.page.spec.ts.
    expect(document.body.querySelector('hlm-dialog-content')).toBeNull();
  });

  it('opens the icons usage in a dialog overlay with icons, shortcuts and a disabled item', async () => {
    await click(findButton('Open command palette', stage(1)));

    const dialog = document.body.querySelector('hlm-dialog-content');
    expect(dialog, 'dialog content did not render after clicking the trigger').toBeTruthy();
    expect(dialog!.querySelector('ng-icon')).toBeTruthy();
    expect(dialog!.querySelector('hlm-command-shortcut')?.textContent).toContain('⌘P');

    const settings = [...dialog!.querySelectorAll('button[hlm-command-item]')].find((b) => b.getAttribute('data-value') === 'Settings');
    expect(settings?.hasAttribute('disabled')).toBe(true);
  });

  it('drives the controlled-filter usage from preset buttons acting on a real signal', async () => {
    expect(host.textContent).toContain('Query: (empty)');

    await click(findButton('Playback', host));
    expect(host.textContent).toContain('Query: play');

    const controlled = [...host.querySelectorAll('hlm-command')].find((c) => c.textContent?.includes('Play/Pause'))!;
    const playPause = [...controlled.querySelectorAll('button[hlm-command-item]')].find(
      (b) => b.getAttribute('data-value') === 'Play or pause',
    );
    const volumeUp = [...controlled.querySelectorAll('button[hlm-command-item]')].find((b) => b.getAttribute('data-value') === 'Volume up');
    expect(playPause?.hasAttribute('data-hidden')).toBe(false);
    expect(volumeUp?.hasAttribute('data-hidden')).toBe(true);

    // The preset also updates the real input's value, proving the model binding is two-way.
    const input = controlled.querySelector('input[data-slot="command-input"]') as HTMLInputElement;
    expect(input.value).toBe('play');
  });

  it('opens the composition usage with multiple groups and a disabled item', async () => {
    await click(findButton('Open command palette', stage(3)));

    const dialog = document.body.querySelector('hlm-dialog-content');
    expect(dialog, 'dialog content did not render after clicking the trigger').toBeTruthy();
    expect(dialog!.textContent).toContain('Navigation');
    expect(dialog!.textContent).toContain('Account');

    const notifications = [...dialog!.querySelectorAll('button[hlm-command-item]')].find(
      (b) => b.getAttribute('data-value') === 'Notifications',
    );
    expect(notifications?.hasAttribute('disabled')).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCommand');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/command');
  });
});
