import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PopoverPage } from './popover.page';

/**
 * Popover content sits behind `*hlmPopoverPortal`, so it renders nothing
 * until a trigger opens it, and the CDK overlay attaches it to
 * `document.body` rather than under the fixture host. There is no dedicated
 * close directive for popover — the trigger's own click handler toggles it,
 * so re-clicking the same trigger closes it again.
 */
describe('PopoverPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<PopoverPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PopoverPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

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

  it('renders no popover content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-popover-content')).toBeNull();
  });

  it('opens the default usage and closes again on re-clicking the same trigger', async () => {
    await clickButton('Open popover');

    const content = document.body.querySelector('hlm-popover-content');
    expect(content, 'popover content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelector('[hlmPopoverTitle]')?.textContent).toContain('Dimensions');
    expect(content!.querySelector('input#pop-width')).toBeTruthy();

    await clickButton('Open popover');
    expect(document.body.querySelector('hlm-popover-content')).toBeNull();
  });

  it('opens each alignment to its own distinct content', async () => {
    for (const align of ['start', 'center', 'end']) {
      await clickButton(align);
      const content = document.body.querySelector('hlm-popover-content');
      expect(content?.textContent, `alignment "${align}" did not render`).toContain(`Aligned to ${align}`);
      await clickButton(align);
    }
  });

  it('runs the inline destructive confirm off real signal state, not a hand-set attribute', async () => {
    expect(host.textContent).toContain('Label still exists.');

    await clickButton('Delete label');
    await clickButton('Confirm delete', document.body);

    expect(host.textContent).toContain('Label deleted.');
  });

  it('marks every notification read from real signal state and updates the list', async () => {
    expect(host.textContent).toContain('2 unread.');

    await clickButton('Inbox (2)');
    const content = document.body.querySelector('hlm-popover-content');
    expect(content?.querySelectorAll('li.font-medium').length, 'expected two unread items').toBe(2);

    await clickButton('Mark all read', document.body);

    expect(host.textContent).toContain('0 unread.');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmPopover');
    expect(text).toContain('HlmPopoverTrigger');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/popover');
  });
});
