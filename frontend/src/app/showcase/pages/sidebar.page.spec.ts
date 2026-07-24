import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarPage } from './sidebar.page';

describe('SidebarPage', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(SidebarPage);
    fixture.detectChanges();
    host = fixture.nativeElement;
  });

  it('shows four distinct usages', () => {
    expect(host.querySelectorAll('app-usage').length).toBe(4);
  });

  it('renders a real sidebar in every usage stage', () => {
    for (const stage of host.querySelectorAll('[data-slot="usage-stage"]')) {
      expect(stage.querySelector('[data-slot="sidebar"]'), 'a usage stage rendered no sidebar').toBeTruthy();
    }
  });

  it('every menu item has a real button or link, not an empty row', () => {
    const items = host.querySelectorAll('li[hlmsidebarmenuitem], li[hlmSidebarMenuItem]');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(
        item.querySelector('[hlmsidebarmenubutton], [hlmSidebarMenuButton]'),
        'menu item rendered no button/link',
      ).toBeTruthy();
    }
  });

  it('renders every group with both a label and content — the composition rule', () => {
    const groups = host.querySelectorAll('[hlmsidebargroup], [hlmSidebarGroup]');
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.querySelector('[hlmsidebargrouplabel], [hlmSidebarGroupLabel]'), 'group has no label').toBeTruthy();
      expect(group.querySelector('[hlmsidebargroupcontent], [hlmSidebarGroupContent]'), 'group has no content').toBeTruthy();
    }
  });

  it('badges sit on real menu items alongside their button, not floating text', () => {
    const badges = host.querySelectorAll('[hlmsidebarmenubadge], [hlmSidebarMenuBadge]');
    expect(badges.length).toBeGreaterThan(0);
    for (const badge of badges) {
      const item = badge.closest('li[hlmsidebarmenuitem], li[hlmSidebarMenuItem]');
      expect(item?.querySelector('[hlmsidebarmenubutton], [hlmSidebarMenuButton]'), 'badge has no sibling button').toBeTruthy();
    }
  });

  it('drives the state-driven usage from a real signal when a different item is clicked', () => {
    const fixture = TestBed.createComponent(SidebarPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Selected: overview');

    const buttons = [...root.querySelectorAll('button[hlmsidebarmenubutton], button[hlmSidebarMenuButton]')];
    const projectsButton = buttons.find((b) => b.textContent?.trim() === 'Projects') as HTMLButtonElement;
    expect(projectsButton, 'no Projects button found').toBeTruthy();

    const before = projectsButton.getAttribute('data-active');
    projectsButton.click();
    fixture.detectChanges();

    expect(projectsButton.getAttribute('data-active')).not.toBe(before);
    expect(root.textContent).toContain('Selected: projects');
  });

  it('renders the composition usage submenu nested under its parent item', () => {
    const usages = [...host.querySelectorAll('app-usage')];
    const composition = usages[usages.length - 1];
    const sub = composition.querySelector('ul[hlmsidebarmenusub], ul[hlmSidebarMenuSub]');
    expect(sub, 'no submenu rendered in the composition usage').toBeTruthy();
    expect(sub!.querySelectorAll('li[hlmsidebarmenusubitem], li[hlmSidebarMenuSubItem]').length).toBe(2);
  });

  it('scopes sidebar state per demo instead of sharing one root singleton', () => {
    const sidebars = [...host.querySelectorAll('[data-slot="sidebar"]')];
    expect(sidebars.length).toBe(4);
    // Each is wrapped in its own [sidebarDemoScope] ancestor, giving each its own HlmSidebarService.
    for (const sidebar of sidebars) {
      expect(sidebar.closest('[sidebardemoscope], [sidebarDemoScope]'), 'sidebar not scoped to its own demo').toBeTruthy();
    }
  });

  it('renders the generated API table rather than a hand-written one', () => {
    const text = host.textContent ?? '';
    expect(text).toContain('HlmSidebar');
  });

  it('links out to the upstream reference', () => {
    const link = host.querySelector('a[href*="spartan.ng"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/components/sidebar');
  });
});
