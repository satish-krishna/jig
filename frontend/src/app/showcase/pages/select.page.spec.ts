import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SelectPage } from './select.page';

// jsdom has no scrollIntoView implementation; BrnSelectItem's active-descendant
// key manager calls it when an item becomes active on click/select.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Select content lives behind `*hlmSelectPortal`, so it renders nothing until
 * a trigger opens it, and the CDK overlay attaches the content to
 * `document.body` rather than under the fixture host. Every assertion here
 * queries `document.body` and checks absent-then-present around a real click.
 */
describe('SelectPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SelectPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SelectPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  async function openTrigger(button: HTMLButtonElement): Promise<void> {
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function triggerButtonsIn(root: ParentNode): HTMLButtonElement[] {
    return [...root.querySelectorAll('button[brnselecttrigger], button[data-slot="select-trigger"]')] as HTMLButtonElement[];
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('every usage stage has a real trigger button', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(triggerButtonsIn(stage).length, 'a usage stage rendered no select trigger').toBeGreaterThan(0);
    }
  });

  it('renders no select content until the trigger opens it', () => {
    expect(document.body.querySelector('hlm-select-content')).toBeNull();
  });

  it('opens the default usage and lists real items from the component, not the code sample', async () => {
    const [trigger] = triggerButtonsIn(host);
    await openTrigger(trigger);

    const content = document.body.querySelector('hlm-select-content');
    expect(content, 'select content did not render after clicking the trigger').toBeTruthy();
    expect(content!.querySelectorAll('hlm-select-item').length).toBeGreaterThan(0);

    const apple = [...content!.querySelectorAll('hlm-select-item')].find((i) => i.textContent?.trim() === 'Apple');
    (apple as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.body.querySelector('hlm-select-content'), 'select content did not close after picking an item').toBeNull();
    expect(trigger.textContent).toContain('Apple');
  });

  it('divides the grouped usage with a real separator between two groups', async () => {
    const [, groupedTrigger] = triggerButtonsIn(host);
    await openTrigger(groupedTrigger);

    const content = document.body.querySelector('hlm-select-content');
    expect(content?.querySelectorAll('hlm-select-group').length).toBe(2);
    expect(content?.querySelector('hlm-select-separator')).toBeTruthy();
  });

  it('does not open the disabled usage', async () => {
    const disabledTrigger = triggerButtonsIn(host).find((b) => b.disabled) as HTMLButtonElement;
    expect(disabledTrigger).toBeTruthy();

    await openTrigger(disabledTrigger);
    expect(document.body.querySelector('hlm-select-content')).toBeNull();
  });

  it('drives the validated usage from real control state, not hand-set attributes', async () => {
    const trigger = host.querySelector('#select-fruit') as HTMLButtonElement;
    expect(trigger.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const field = trigger.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = trigger.getAttribute('aria-describedby');
    expect(describedBy, 'invalid select trigger has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Please select a fruit');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSelect');
    expect(text).toContain('showScroll'); // an input() member only the generator knows about
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/select');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
