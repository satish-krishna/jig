One-liner: The jig full-width layout — a grid app shell plus a collapsible, multi-tier sidebar; use it for any authenticated product view.

```jsx
<AppShell collapsed={collapsed}>
  <Sidebar>
    <SidebarHeader>
      <span className="hlm-sidebar__brand-mark">J</span>
      <span className="hlm-sidebar__brand-name">jig</span>
    </SidebarHeader>
    <SidebarBody>
      <NavGroup label="Platform">
        <NavItem label="Overview" icon={icon} active />
        <NavItem label="Features" icon={icon} defaultOpen items={[
          { label: 'users', active: true },
          { label: 'billing', badge: 'new' },
        ]} />
      </NavGroup>
    </SidebarBody>
    <SidebarFooter>…</SidebarFooter>
  </Sidebar>
  <ShellHeader>…</ShellHeader>
  <ShellMain>…</ShellMain>
  <ShellFooter>…</ShellFooter>
</AppShell>
```

Parts: `AppShell` (grid) + `ShellHeader`/`ShellMain`/`ShellFooter` + `Sidebar`/`SidebarHeader`/`SidebarBody`/`SidebarFooter` + `NavGroup` + `NavItem`. Pass `items` to `NavItem` for a collapsible parent (any depth). Set `collapsed` on `AppShell` to switch to the icon rail — labels, chevrons and subtrees hide automatically. Icons are your own ReactNode (e.g. inline Lucide SVG).
