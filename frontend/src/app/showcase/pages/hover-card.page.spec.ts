import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HoverCardPage } from './hover-card.page';

/**
 * Hover card content sits behind `*hlmHoverCardPortal`, so it renders nothing
 * until the trigger opens it, and the CDK overlay attaches it to
 * `document.body` rather than under the fixture host. Unlike click-driven
 * overlays, opening/closing is hover-driven with a real `showDelay`/`hideDelay`
 * — every usage sets both to 0 so the tests only have to wait out one real
 * macrotask tick, not the 300ms/500ms production defaults.
 */
describe('HoverCardPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<HoverCardPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(HoverCardPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  function findButton(text: string): HTMLButtonElement {
    const button = [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
    expect(button, `no button matching "${text}"`).toBeTruthy();
    return button as HTMLButtonElement;
  }

  // Real mouseenter/mouseleave events, waiting out the actual (zeroed) delay —
  // the underlying BrnHoverCardTrigger pipes hover state through RxJS `delay()`,
  // so nothing renders until that macrotask actually fires.
  async function hover(button: HTMLButtonElement, entering: boolean): Promise<void> {
    button.dispatchEvent(new MouseEvent(entering ? 'mouseenter' : 'mouseleave', { bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real trigger', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('button'), 'a usage stage rendered no trigger').toBeTruthy();
    }
  });

  it('renders no hover card content until the trigger is hovered', () => {
    expect(document.body.querySelector('hlm-hover-card-content')).toBeNull();
  });

  it('opens the profile preview on hover and closes again on mouseleave', async () => {
    const trigger = findButton('@analogjs');

    await hover(trigger, true);
    const content = document.body.querySelector('hlm-hover-card-content');
    expect(content, 'hover card content did not render after hovering the trigger').toBeTruthy();
    expect(content!.textContent).toContain('The Angular meta-framework.');

    await hover(trigger, false);
    expect(document.body.querySelector('hlm-hover-card-content')).toBeNull();
  });

  it('opens each side to its own distinct content', async () => {
    for (const align of ['top', 'bottom', 'left', 'right']) {
      const trigger = findButton(align);
      await hover(trigger, true);
      const content = document.body.querySelector('hlm-hover-card-content');
      expect(content?.textContent, `alignment "${align}" did not render`).toContain(`Aligned to ${align}`);
      await hover(trigger, false);
    }
  });

  it('toggles follow state off a real signal, updating the still-open card', async () => {
    expect(host.textContent).toContain('Not following.');
    const trigger = findButton('@spartan');

    await hover(trigger, true);
    let content = document.body.querySelector('hlm-hover-card-content');
    expect(content?.textContent).toContain('Follow');

    const followButton = [...content!.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Follow');
    expect(followButton, 'no Follow button in the open card').toBeTruthy();
    (followButton as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.textContent).toContain('Following.');
    content = document.body.querySelector('hlm-hover-card-content');
    expect(content?.textContent).toContain('Following');

    await hover(trigger, false);
  });

  it('opens the custom-delay usage instantly', async () => {
    const trigger = findButton('Instant');
    await hover(trigger, true);
    expect(document.body.querySelector('hlm-hover-card-content')?.textContent).toContain(
      'No delay on open or close.',
    );
    await hover(trigger, false);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmHoverCard');
    expect(text).toContain('HlmHoverCardTrigger');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/hover-card');
  });
});
