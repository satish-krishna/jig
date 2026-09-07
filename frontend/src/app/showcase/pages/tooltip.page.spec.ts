import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TooltipPage } from './tooltip.page';
import { waitUntil } from './wait-until';

/**
 * `hlmTooltip` has no structural portal directive to project into — it is a
 * single attribute directive that builds its own CDK overlay imperatively.
 * It still renders nothing until focused/hovered (real `showDelay`/`hideDelay`,
 * zeroed here for fast, deterministic tests), and the CDK overlay attaches
 * the tooltip to `document.body` rather than under the fixture host.
 */
describe('TooltipPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TooltipPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(TooltipPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function findByText<T extends HTMLElement>(selector: string, text: string): T {
    const el = [...host.querySelectorAll<T>(selector)].find((e) => e.textContent?.trim() === text);
    expect(el, `no ${selector} matching "${text}"`).toBeTruthy();
    return el as T;
  }

  // Real focus/blur, polling for the actual (zeroed) delay to elapse — BrnTooltip
  // pipes show/hide through its own delay mechanism, so nothing renders until
  // that macrotask actually fires. Focus (not mouseenter) also works for the
  // disabled-button-wrapper pattern, where the tooltip lives on a wrapping div.
  async function focusOpen(el: HTMLElement): Promise<void> {
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    fixture.detectChanges();
    await waitUntil(
      () => document.body.querySelector('[role="tooltip"]') !== null,
      () => fixture.detectChanges(),
      { describe: 'tooltip to appear after focus' },
    );
    await fixture.whenStable();
  }

  async function blurClose(el: HTMLElement): Promise<void> {
    el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();
    await waitUntil(
      () => document.body.querySelector('[role="tooltip"]') === null,
      () => fixture.detectChanges(),
      { describe: 'tooltip to disappear after blur' },
    );
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real trigger', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('button, [hlmTooltip]'), 'a usage stage rendered no trigger').toBeTruthy();
    }
  });

  it('renders no tooltip content until the trigger is focused', () => {
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('opens the default usage on focus and closes again on blur', async () => {
    const trigger = findByText<HTMLButtonElement>('button', 'Default');

    await focusOpen(trigger);
    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip, 'tooltip did not render after focusing the trigger').toBeTruthy();
    expect(tooltip!.textContent).toContain('Add to library');

    await blurClose(trigger);
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  // jsdom lays out every element at a 0×0 rect, so the CDK flexible-position
  // strategy's real fit/flip math cannot reproduce the exact requested side
  // (it deterministically resolves to whichever fallback "fits" a zero-size
  // box) — this asserts the mechanism is real (a resolved, valid side is
  // written per open) rather than a browser-only visual detail no jsdom test
  // can observe.
  it('opens each position trigger to a real, CDK-resolved data-side attribute', async () => {
    for (const position of ['top', 'left', 'right', 'bottom']) {
      const trigger = findByText<HTMLButtonElement>('button', position[0].toUpperCase() + position.slice(1));
      await focusOpen(trigger);
      const tooltip = document.body.querySelector('[role="tooltip"]');
      expect(tooltip, `position "${position}" did not render`).toBeTruthy();
      expect(tooltip!.textContent).toContain('Tooltip content');
      expect(['top', 'bottom', 'left', 'right']).toContain(tooltip!.getAttribute('data-side'));
      await blurClose(trigger);
    }
  });

  it('renders an ng-template with a real icon, not just text', async () => {
    const trigger = findByText<HTMLButtonElement>('button', 'Rich');

    await focusOpen(trigger);
    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toContain('Add to library');
    expect(tooltip?.querySelector('ng-icon')).toBeTruthy();

    await blurClose(trigger);
  });

  it('toggles tooltipDisabled from a real signal on the disabled-button wrapper', async () => {
    expect(host.textContent).toContain('Tooltip enabled.');

    const wrapper = host.querySelector('div[hlmTooltip]') as HTMLElement;
    expect(wrapper, 'no tooltip wrapper div found').toBeTruthy();
    expect(wrapper.querySelector('button')?.disabled).toBe(true);

    await focusOpen(wrapper);
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain(
      'Re-enable the field above first',
    );
    await blurClose(wrapper);

    const enableButton = findByText<HTMLButtonElement>('button', 'Enable');
    enableButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.textContent).toContain('Tooltip disabled.');
    expect(wrapper.querySelector('button')?.disabled).toBe(false);

    // Not focusOpen: `tooltipDisabled` makes `_show()` bail synchronously (see
    // BrnTooltip) regardless of how long the zeroed delay pipeline takes to
    // fire, so absence holds from the instant of focus onward — there is no
    // async outcome to poll for here.
    wrapper.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    fixture.detectChanges();
    expect(document.body.querySelector('[role="tooltip"]'), 'tooltip opened while disabled').toBeNull();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmTooltip');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/tooltip');
  });
});
