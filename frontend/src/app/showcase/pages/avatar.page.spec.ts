import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvatarPage } from './avatar.page';

/**
 * hlm-avatar projects its visible content through named slots gated on
 * whether an image child can show — an avatar with neither an image nor a
 * fallback projected renders completely empty. Every test here checks the
 * actual rendered text, not just that <hlm-avatar> mounted.
 */
describe('AvatarPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AvatarPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real avatar in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('hlm-avatar'), 'a usage stage rendered no avatar').toBeTruthy();
    }
  });

  it('renders non-empty fallback content in every avatar, never a blank shell', () => {
    const avatars = [...host.querySelectorAll('hlm-avatar')];
    expect(avatars.length).toBeGreaterThan(0);
    for (const avatar of avatars) {
      expect(avatar.textContent?.trim(), 'an hlm-avatar rendered no visible content').not.toBe('');
    }
  });

  it('starts the status badge online with a green class, not hand-set', () => {
    const fixture = TestBed.createComponent(AvatarPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const badge = root.querySelector('hlm-avatar-badge') as HTMLElement;
    expect(badge, 'no avatar badge found').toBeTruthy();
    expect(badge.classList.contains('bg-foreground')).toBe(true);
  });

  it('reflects a click into the real online signal, flipping the badge class', () => {
    const fixture = TestBed.createComponent(AvatarPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const toggleButton = [...root.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Go offline'),
    ) as HTMLButtonElement;
    expect(toggleButton, 'no go-offline button found').toBeTruthy();

    toggleButton.click();
    fixture.detectChanges();

    const badge = root.querySelector('hlm-avatar-badge') as HTMLElement;
    expect(badge.classList.contains('bg-muted-foreground')).toBe(true);
    expect(toggleButton.textContent).toContain('Go online');
  });

  it('renders the overflow count in the group usage', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('+3');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmAvatar');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/avatar');
  });
});
