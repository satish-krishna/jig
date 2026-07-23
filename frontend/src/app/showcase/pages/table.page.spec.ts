import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TablePage } from './table.page';

describe('TablePage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TablePage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real table in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('table'), 'a usage stage rendered no table').toBeTruthy();
    }
  });

  it('renders actual invoice rows, not an empty table', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('INV001');
    expect(text).toContain('INV002');
  });

  it('toggles a real data-state on row click, not a hand-set attribute', () => {
    const fixture = TestBed.createComponent(TablePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const selectableRow = root.querySelector('tr[role="button"]') as HTMLElement;
    expect(selectableRow, 'no selectable row found').toBeTruthy();
    expect(selectableRow.getAttribute('data-state')).toBeNull();

    selectableRow.click();
    fixture.detectChanges();

    expect(selectableRow.getAttribute('data-state')).toBe('selected');
  });

  it('mutates the real products signal when a row action is clicked', () => {
    const fixture = TestBed.createComponent(TablePage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Wireless Mouse');
    const deleteButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Remove Wireless Mouse'),
    ) as HTMLButtonElement;
    expect(deleteButton, 'no delete button for Wireless Mouse found').toBeTruthy();

    deleteButton.click();
    fixture.detectChanges();

    expect(root.textContent).not.toContain('Wireless Mouse');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmTable');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/table');
  });
});
