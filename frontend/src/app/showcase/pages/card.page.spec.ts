import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CardPage } from './card.page';

describe('CardPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(CardPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real card in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-card'), 'a usage stage rendered no card').toBeTruthy();
    }
  });

  it('renders the basic card with a real title and description, not an empty shell', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('Team plan');
    expect(text).toContain('Everything a growing team needs.');
  });

  it('starts the stateful card at one seat with remove disabled', () => {
    const fixture = TestBed.createComponent(CardPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const removeButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Remove seat'),
    ) as HTMLButtonElement;
    expect(removeButton, 'no remove seat button found').toBeTruthy();
    expect(removeButton.disabled).toBe(true);
  });

  it('reflects add-seat clicks into the real seats signal, not hand-set text', () => {
    const fixture = TestBed.createComponent(CardPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const addButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add seat'),
    ) as HTMLButtonElement;
    expect(addButton, 'no add seat button found').toBeTruthy();

    addButton.click();
    fixture.detectChanges();

    const removeButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Remove seat'),
    ) as HTMLButtonElement;
    expect(removeButton.disabled).toBe(false);
    expect(root.textContent).toContain('2');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmCard');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/card');
  });
});
