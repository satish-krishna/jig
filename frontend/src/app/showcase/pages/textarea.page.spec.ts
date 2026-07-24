import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TextareaPage } from './textarea.page';

describe('TextareaPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TextareaPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real textarea in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('textarea[data-slot="textarea"]'), 'a usage stage rendered no textarea').toBeTruthy();
    }
  });

  it('disables the disabled-state textarea for real, not by class alone', () => {
    const textareas = [...host.querySelectorAll('textarea[data-slot="textarea"]')] as HTMLTextAreaElement[];
    expect(textareas.some((t) => t.disabled)).toBe(true);
  });

  it('drives the validated usage from real control state, not hand-set attributes', () => {
    const textarea = host.querySelector('#textarea-bio') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    const field = textarea.closest('[data-slot="field"]') as HTMLElement;
    expect(field?.getAttribute('data-matches-spartan-invalid')).toBe('true');

    const describedBy = textarea.getAttribute('aria-describedby');
    expect(describedBy, 'invalid textarea has no aria-describedby').toBeTruthy();
    expect(host.querySelector(`#${describedBy}`)?.textContent).toContain('Tell us a little about yourself');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    expect(host.textContent).toContain('HlmTextarea');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/textarea');
  });

  it('never falls back to forceShow', () => {
    expect(host.querySelector('hlm-field-error[forceShow], hlm-field-error[forceshow]')).toBeNull();
  });
});
