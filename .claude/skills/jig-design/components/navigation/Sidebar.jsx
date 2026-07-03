import React from 'react';

/**
 * Jig app shell — full-width CSS Grid: sticky header, collapsible
 * sidebar, scrollable main, footer. Drive collapse with `collapsed`.
 */
export function AppShell({ collapsed = false, className = '', children, ...props }) {
  return (
    <div
      className={['hlm-shell', className].filter(Boolean).join(' ')}
      data-collapsed={collapsed ? 'true' : 'false'}
      {...props}
    >
      {children}
    </div>
  );
}

export function ShellHeader({ className = '', children, ...props }) {
  return (
    <header className={['hlm-shell__header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </header>
  );
}

export function ShellMain({ className = '', children, ...props }) {
  return (
    <main className={['hlm-shell__main', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </main>
  );
}

export function ShellFooter({ className = '', children, ...props }) {
  return (
    <footer className={['hlm-shell__footer', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </footer>
  );
}

/* ── Sidebar surface ─────────────────────────────────────────── */

export function Sidebar({ className = '', children, ...props }) {
  return (
    <aside className={['hlm-sidebar', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </aside>
  );
}

export function SidebarHeader({ className = '', children, ...props }) {
  return (
    <div className={['hlm-sidebar__header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function SidebarBody({ className = '', children, ...props }) {
  return (
    <nav className={['hlm-sidebar__body', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </nav>
  );
}

export function SidebarFooter({ className = '', children, ...props }) {
  return (
    <div className={['hlm-sidebar__footer', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function NavGroup({ label, className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {label ? <div className="hlm-nav__group-label">{label}</div> : null}
      {children}
    </div>
  );
}

/**
 * Multi-tier nav item. Pass `items` (array of NavItem props) to make it a
 * collapsible parent; otherwise it's a leaf. `defaultOpen` seeds the subtree.
 */
export function NavItem({
  label,
  icon,
  badge,
  active = false,
  items,
  defaultOpen = false,
  onClick,
  className = '',
  ...props
}) {
  const hasChildren = Array.isArray(items) && items.length > 0;
  const [open, setOpen] = React.useState(defaultOpen);

  const handleClick = (e) => {
    if (hasChildren) setOpen((o) => !o);
    if (onClick) onClick(e);
  };

  return (
    <>
      <button
        type="button"
        className={['hlm-nav__item', className].filter(Boolean).join(' ')}
        data-active={active ? 'true' : undefined}
        data-open={hasChildren && open ? 'true' : undefined}
        onClick={handleClick}
        {...props}
      >
        {icon ? <span className="hlm-nav__icon">{icon}</span> : null}
        <span className="hlm-nav__label">{label}</span>
        {badge != null ? <span className="hlm-nav__badge">{badge}</span> : null}
        {hasChildren ? (
          <svg
            className="hlm-nav__chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        ) : null}
      </button>
      {hasChildren && open ? (
        <div className="hlm-nav__sub">
          {items.map((it, i) => (
            <NavItem key={it.key ?? it.label ?? i} {...it} />
          ))}
        </div>
      ) : null}
    </>
  );
}
