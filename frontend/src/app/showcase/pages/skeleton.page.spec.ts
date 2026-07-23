import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SkeletonPage } from './skeleton.page';

describe('SkeletonPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SkeletonPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(SkeletonPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real skeleton in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="skeleton"]'), 'a usage stage rendered no skeleton').toBeTruthy();
    }
  });

  it('renders three rows of skeleton cells for the table composition', () => {
    const rows = host.querySelectorAll('[data-slot="usage-stage"]')[2];
    const cellGroups = rows.querySelectorAll(':scope > div > div');
    expect(cellGroups.length).toBe(3);
    for (const group of cellGroups) {
      expect(group.querySelectorAll('[data-slot="skeleton"]').length).toBe(3);
    }
  });

  it('swaps the skeleton for real content from a real signal, not forceShow', () => {
    const toggleStage = host.querySelectorAll('[data-slot="usage-stage"]')[3];
    expect(toggleStage.querySelector('[data-slot="skeleton"]'), 'expected the skeleton on first render').toBeTruthy();
    expect(toggleStage.textContent).not.toContain('Quarterly report ready');

    const toggleButton = toggleStage.querySelector('button') as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    expect(toggleStage.querySelector('[data-slot="skeleton"]')).toBeNull();
    expect(toggleStage.textContent).toContain('Quarterly report ready');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSkeleton');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/skeleton');
  });
});
