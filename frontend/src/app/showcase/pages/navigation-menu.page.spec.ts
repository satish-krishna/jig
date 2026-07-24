import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavigationMenuPage } from './navigation-menu.page';

/**
 * Navigation menu content lives behind `*hlmNavigationMenuPortal`, so — like
 * dialog — the CDK overlay attaches it to `document.body` rather than under
 * the fixture host. Unlike dialog, opening runs through an rxjs
 * `debounceTime(0)` + `delay(0)` pipeline that `fixture.whenStable()` does not
 * reliably wait out here, so every open/close assertion follows a real (short)
 * timer instead — confirmed empirically against this component.
 */
describe('NavigationMenuPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<NavigationMenuPage>>;
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NavigationMenuPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  async function clickTrigger(text: string): Promise<HTMLButtonElement> {
    const trigger = [...host.querySelectorAll('button[hlmnavigationmenutrigger], button[hlmNavigationMenuTrigger]')].find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement;
    expect(trigger, `no trigger matching "${text}"`).toBeTruthy();
    trigger.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();
    return trigger;
  }

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real navigation menu in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="navigation-menu"]'), 'a usage stage rendered no navigation menu').toBeTruthy();
    }
  });

  it('renders no menu content in the overlay until a trigger opens it', () => {
    expect(document.body.querySelector('hlm-navigation-menu-content')).toBeNull();
  });

  it('opens the default usage on click, rendering its real links into the overlay', async () => {
    await clickTrigger('Product');

    const content = document.body.querySelector('hlm-navigation-menu-content');
    expect(content, 'no content rendered after clicking the trigger').toBeTruthy();
    expect(content!.textContent).toContain('Overview');
    expect(content!.textContent).toContain('Changelog');
  });

  it('drives the state-driven usage from a real signal, not a hand-set attribute', async () => {
    expect(host.textContent).toContain('Open: none');

    await clickTrigger('Components');
    expect(host.textContent).toContain('Open: components');

    const content = document.body.querySelector('hlm-navigation-menu-content');
    expect(content!.textContent).toContain('Browse every component');
  });

  it('marks exactly one link active in the composition usage', () => {
    const usages = [...host.querySelectorAll('app-usage')];
    const composition = usages[usages.length - 1];
    const activeLinks = composition.querySelectorAll('a[hlmnavigationmenulink][data-active], a[hlmNavigationMenuLink][data-active]');
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0].textContent?.trim()).toBe('Dashboard');
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmNavigationMenu');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/navigation-menu');
  });
});
