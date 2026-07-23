import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  function create(): ThemeService {
    TestBed.resetTestingModule();
    return TestBed.runInInjectionContext(() => new ThemeService());
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('puts the dark class on the document root, which is what the tokens key off', () => {
    const theme = create();

    theme.set('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    theme.set('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles between the two modes', () => {
    const theme = create();
    theme.set('light');

    theme.toggle();
    expect(theme.mode()).toBe('dark');

    theme.toggle();
    expect(theme.mode()).toBe('light');
  });

  it('persists the choice so a reload keeps it', () => {
    create().set('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // a fresh service in a fresh app instance picks the stored value back up
    expect(create().mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  // The test DOM has no matchMedia, which is also true of SSR — the service
  // feature-detects it, so these tests install one to exercise the OS branch.
  const stubPrefersDark = (matches: boolean) =>
    vi.stubGlobal('matchMedia', () => ({ matches }) as MediaQueryList);

  it('falls back to the OS preference when nothing is stored', () => {
    stubPrefersDark(true);

    expect(create().mode()).toBe('dark');
  });

  it('defaults to light where matchMedia does not exist, rather than throwing', () => {
    vi.unstubAllGlobals();

    expect(create().mode()).toBe('light');
  });

  it('ignores a corrupted stored value rather than throwing', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'chartreuse');
    stubPrefersDark(false);

    expect(create().mode()).toBe('light');
  });
});
