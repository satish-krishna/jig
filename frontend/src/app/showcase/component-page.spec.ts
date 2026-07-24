import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentPage } from './component-page';

/**
 * The frame used to assume every slug named a vendored spartan component, so it
 * derived a spartan.ng URL from any slug at all. A page for a component we wrote
 * ourselves would have shipped a link to a docs page that does not exist.
 */
function render(slug: string): HTMLElement {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(ComponentPage);
  fixture.componentRef.setInput('slug', slug);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('ComponentPage', () => {
  it('links a vendored component to its upstream reference', () => {
    const link = render('checkbox').querySelector<HTMLAnchorElement>('a[href*="spartan.ng"]');

    expect(link?.href).toContain('/components/checkbox');
  });

  it('offers no upstream link on a pattern page, because spartan has no such page', () => {
    expect(render('schema-form').querySelector('a[href*="spartan.ng"]')).toBeNull();
  });

  it('still renders the generated API table on a pattern page', () => {
    const host = render('schema-form');

    expect(host.textContent).toContain('SchemaForm');
    expect(host.textContent).toContain('submitted');
  });

  it('names the pattern page from the registry rather than falling back to the slug', () => {
    expect(render('schema-form').querySelector('h1')?.textContent?.trim()).toBe('Schema form');
  });
});
