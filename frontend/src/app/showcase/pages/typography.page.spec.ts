import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TypographyPage } from './typography.page';

describe('TypographyPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TypographyPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders real typography elements with visible text in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      const styled = [...stage.querySelectorAll('h1, h2, h3, h4, p, blockquote, code, ul, li')];
      expect(styled.length, 'a usage stage rendered no typography elements').toBeGreaterThan(0);
      const text = stage.textContent?.trim() ?? '';
      expect(text, 'a usage stage rendered no visible text').not.toBe('');
    }
  });

  it('renders all four heading levels', () => {
    expect(host.querySelector('h1[hlmh1]')?.textContent).toContain('Heading one');
    expect(host.querySelector('h2[hlmh2]')?.textContent).toContain('Heading two');
    expect(host.querySelector('h3[hlmh3]')?.textContent).toContain('Heading three');
    expect(host.querySelector('h4[hlmh4]')?.textContent).toContain('Heading four');
  });

  it('renders the body text scale', () => {
    expect(host.querySelector('p[hlmlead]')).toBeTruthy();
    expect(host.querySelector('p[hlmp]')).toBeTruthy();
    expect(host.querySelector('p[hlmlarge]')).toBeTruthy();
    expect(host.querySelector('p[hlmsmall]')).toBeTruthy();
    expect(host.querySelector('p[hlmmuted]')).toBeTruthy();
  });

  it('renders a real inline code span and blockquote', () => {
    expect(host.querySelector('blockquote[hlmblockquote]')?.textContent).toContain('Make it work');
    expect(host.querySelector('code[hlmcode]')?.textContent).toContain('npm run verify');
  });

  it('renders list items in the article composition', () => {
    const items = host.querySelectorAll('ul[hlmul] li');
    expect(items.length).toBeGreaterThan(0);
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmP');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/typography');
  });
});
