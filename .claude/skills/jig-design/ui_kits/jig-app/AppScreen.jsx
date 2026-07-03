/* Full-width app shell — the standard jig authenticated view:
   sticky header, collapsible multi-tier sidebar, content, footer. */
function AppScreen({ onSignOut }) {
  const NS = window.JigDesignSystem_ac97f9;
  const { AppShell, ShellHeader, ShellMain, ShellFooter,
    Sidebar, SidebarHeader, SidebarBody, SidebarFooter,
    NavGroup, NavItem, Button, Badge, Input, Separator,
    Card, CardHeader, CardTitle, CardDescription, CardContent } = NS;
  const I = window.Icons;
  const [collapsed, setCollapsed] = React.useState(false);
  const [active, setActive] = React.useState('users');
  const icon = (name) => React.createElement(I[name]);

  const users = [
    { name: 'Satish Krishna', email: 'satish@jig.dev', role: 'Owner', status: 'Active', tone: 'default' },
    { name: 'Ada Lovelace', email: 'ada@jig.dev', role: 'Maintainer', status: 'Active', tone: 'default' },
    { name: 'Grace Hopper', email: 'grace@jig.dev', role: 'Contributor', status: 'Invited', tone: 'secondary' },
    { name: 'Alan Turing', email: 'alan@jig.dev', role: 'Contributor', status: 'Suspended', tone: 'destructive' },
  ];

  return (
    <AppShell collapsed={collapsed}>
      <Sidebar>
        <SidebarHeader>
          <span className="hlm-sidebar__brand-mark">J</span>
          <span className="hlm-sidebar__brand-name">jig</span>
        </SidebarHeader>
        <SidebarBody>
          <NavGroup label="Platform">
            <NavItem label="Overview" icon={icon('home')} active={active === 'overview'} onClick={() => setActive('overview')} />
            <NavItem label="Features" icon={icon('box')} defaultOpen badge="3" items={[
              { label: 'users', icon: icon('users'), active: active === 'users', onClick: () => setActive('users') },
              { label: 'billing', icon: icon('creditCard'), badge: 'new' },
              { label: 'audit log', icon: icon('fileText') },
            ]} />
            <NavItem label="Transport" icon={icon('gitBranch')} items={[
              { label: 'HTTP · .NET API' },
              { label: 'IPC · Rust core' },
            ]} />
          </NavGroup>
          <NavGroup label="Build">
            <NavItem label="Terminal" icon={icon('terminal')} />
            <NavItem label="Settings" icon={icon('cog')} items={[
              { label: 'Workspace' },
              { label: 'Codegen', items: [ { label: 'OpenAPI' }, { label: 'DTOs' } ] },
            ]} />
          </NavGroup>
        </SidebarBody>
        <SidebarFooter>
          <NavItem label="satish@jig.dev" icon={icon('users')} onClick={onSignOut} />
        </SidebarFooter>
      </Sidebar>

      <ShellHeader>
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={() => setCollapsed((c) => !c)}>
          {icon('panelLeft')}
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 340, color: 'var(--muted-foreground)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--muted-foreground)' }}>{icon('search')}</span>
            <Input placeholder="Search users, features…" style={{ paddingLeft: 30 }} />
          </div>
          <span className="hlm-kbd">Ctrl K</span>
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="outline" size="sm">{icon('gitBranch')} main</Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">{icon('bell')}</Button>
        <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: '9999px', background: 'var(--secondary)', fontSize: 12, fontWeight: 600 }}>SK</span>
      </ShellHeader>

      <ShellMain>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 'var(--text-2xl)' }}>users</h1>
              <Badge variant="outline">worked slice</Badge>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginTop: 4 }}>The one vertical slice that exercises every layer end to end.</p>
          </div>
          <Button>{icon('plus')} New user</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[['Total', '128', 'across all roles'], ['Active', '96', 'signed in ≤ 30d'], ['Invited', '14', 'awaiting first login']].map(([k, v, s]) => (
            <Card key={k} style={{ paddingBlock: 16, gap: 4 }}>
              <CardHeader style={{ gap: 2 }}>
                <CardDescription>{k}</CardDescription>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: '-0.02em' }}>{v}</div>
                <CardDescription style={{ fontSize: 12 }}>{s}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card style={{ paddingBlock: 0, gap: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: 12, padding: '12px 16px', fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
            <div>User</div><div>Role</div><div>Status</div><div />
          </div>
          {users.map((u, i) => (
            <div key={u.email} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '9999px', background: 'var(--secondary)', fontSize: 12, fontWeight: 600 }}>{u.name.split(' ').map((p) => p[0]).join('')}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                </div>
              </div>
              <div style={{ fontSize: 14 }}>{u.role}</div>
              <div><Badge variant={u.tone}>{u.status}</Badge></div>
              <Button variant="ghost" size="icon-sm" aria-label="Row actions">{icon('moreH')}</Button>
            </div>
          ))}
        </Card>
      </ShellMain>

      <ShellFooter>
        <span className="hlm-kbd">IPC</span>
        <span>Connected to Rust core · thick client</span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon('check')} verify green</span>
        <Separator orientation="vertical" style={{ height: 14 }} />
        <span>v0.4.0</span>
      </ShellFooter>
    </AppShell>
  );
}
window.AppScreen = AppScreen;
