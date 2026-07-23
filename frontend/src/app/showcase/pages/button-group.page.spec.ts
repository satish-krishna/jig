import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButtonGroupPage } from './button-group.page';

describe('ButtonGroupPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ButtonGroupPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real hlmButtonGroup in every usage stage, each with buttons inside', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const group = stage.querySelector('[hlmbuttongroup]');
      expect(group, 'a usage stage rendered no button group').toBeTruthy();
      expect(group?.querySelectorAll('[hlmbtn]').length, 'the group rendered no buttons').toBeGreaterThan(0);
    }
  });

  it('renders one group with data-orientation vertical', () => {
    const groups = [...host.querySelectorAll('[hlmbuttongroup]')];
    expect(groups.some((g) => g.getAttribute('data-orientation') === 'vertical')).toBe(true);
  });

  it('drives the locked state from a real signal, not hand-set disabled attributes', () => {
    const fixture = TestBed.createComponent(ButtonGroupPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const lockButton = [...root.querySelectorAll('[hlmbtn]')].find((b) =>
      b.textContent?.includes('Lock'),
    ) as HTMLButtonElement;
    expect(lockButton, 'no Lock button found').toBeTruthy();

    const actionButtons = [...root.querySelectorAll('[hlmbuttongroup] [hlmbtn]')].filter((b) =>
      ['Copy', 'Paste', 'Delete'].includes(b.textContent?.trim() ?? ''),
    );
    expect(actionButtons.length).toBe(3);
    expect(actionButtons.every((b) => !b.hasAttribute('disabled'))).toBe(true);

    lockButton.click();
    fixture.detectChanges();

    expect(actionButtons.every((b) => b.hasAttribute('disabled')), 'locking did not disable the group').toBe(true);
  });

  it('composes hlmButtonGroupText and a real hlmInput alongside a button', () => {
    expect(host.querySelector('[hlmbuttongrouptext]')?.textContent).toContain('https://');
    expect(host.querySelector('input[hlminput]')).toBeTruthy();
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmButtonGroup');
    expect(text).toContain('orientation');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/button-group');
  });
});
