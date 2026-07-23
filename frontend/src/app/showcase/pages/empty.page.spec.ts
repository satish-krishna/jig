import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyPage } from './empty.page';

describe('EmptyPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(EmptyPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real empty state with a non-empty title in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const empty = stage.querySelector('hlm-empty, [hlmempty]');
      expect(empty, 'a usage stage rendered no empty state').toBeTruthy();
      const title = empty!.querySelector('[hlmemptytitle]');
      expect(title?.textContent?.trim(), 'an empty state rendered no visible title').not.toBe('');
    }
  });

  it('renders the basic composition with real content', () => {
    expect(host.textContent).toContain('No projects yet');
  });

  it('renders a real avatar fallback inside the avatar-media usage', () => {
    const avatar = host.querySelector('hlm-avatar');
    expect(avatar?.textContent?.trim(), 'the avatar-media usage rendered no visible avatar content').not.toBe('');
  });

  it('reflects a real attempts signal into the retry description', () => {
    const fixture = TestBed.createComponent(EmptyPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain("Something went wrong while loading this page.");

    const retryButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Retry'),
    ) as HTMLButtonElement;
    expect(retryButton, 'no retry button found').toBeTruthy();

    retryButton.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Still failing after 1 retry.');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmEmpty');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/empty');
  });
});
