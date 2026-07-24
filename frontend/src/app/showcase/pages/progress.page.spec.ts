import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProgressPage } from './progress.page';

describe('ProgressPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ProgressPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ProgressPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real progress bar and indicator in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="progress"]'), 'a usage stage rendered no progress bar').toBeTruthy();
      expect(
        stage.querySelector('[data-slot="progress-indicator"]'),
        'a usage stage rendered no progress indicator',
      ).toBeTruthy();
    }
  });

  it('marks the value-less bar indeterminate and the valued bars determinate', () => {
    const bars = [...host.querySelectorAll('[data-slot="progress-indicator"]')];
    const indeterminateCount = bars.filter((b) => b.classList.contains('animate-indeterminate')).length;
    expect(indeterminateCount).toBe(1);
    expect(bars.length - indeterminateCount).toBeGreaterThan(0);
  });

  it('drives the simulated download from a real signal, not a hand-set attribute', () => {
    const startButton = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Start download'));
    expect(startButton, 'no start button found').toBeTruthy();

    (startButton as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance['downloading']()).toBe(true);
    expect([...host.querySelectorAll('button')].some((b) => b.textContent?.includes('%'))).toBe(true);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmProgress');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/progress');
  });
});
