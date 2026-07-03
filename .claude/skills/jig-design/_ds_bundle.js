/* @ds-bundle: {"format":4,"namespace":"JigDesignSystem_ac97f9","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CardHeader","sourcePath":"components/core/Card.jsx"},{"name":"CardTitle","sourcePath":"components/core/Card.jsx"},{"name":"CardDescription","sourcePath":"components/core/Card.jsx"},{"name":"CardContent","sourcePath":"components/core/Card.jsx"},{"name":"CardFooter","sourcePath":"components/core/Card.jsx"},{"name":"Separator","sourcePath":"components/core/Separator.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"FieldDescription","sourcePath":"components/forms/Field.jsx"},{"name":"FieldError","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Label","sourcePath":"components/forms/Label.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"AppShell","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"ShellHeader","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"ShellMain","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"ShellFooter","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"SidebarHeader","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"SidebarBody","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"SidebarFooter","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"NavGroup","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"NavItem","sourcePath":"components/navigation/Sidebar.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"528cd9558a29","components/core/Button.jsx":"048aad6c18de","components/core/Card.jsx":"4fe7f13300cf","components/core/Separator.jsx":"7bf7f02a5889","components/forms/Field.jsx":"31c68913da46","components/forms/Input.jsx":"3fae5ccd111b","components/forms/Label.jsx":"ab0baa03eab4","components/forms/Textarea.jsx":"c4d35c349f4d","components/navigation/Sidebar.jsx":"370b24080d5f","ui_kits/jig-app/AppScreen.jsx":"f13061c71118","ui_kits/jig-app/AuthScreen.jsx":"961728939bbd","ui_kits/jig-app/Icons.jsx":"b5e05e88a384"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.JigDesignSystem_ac97f9 = window.JigDesignSystem_ac97f9 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Badge — small status / metadata pill. shadcn badge. */
function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}) {
  const cls = ['hlm-badge', `hlm-badge--${variant}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jig Button — Spartan `hlmBtn`.
 * Concrete variants/sizes translated from hlm-button.ts.
 */
function Button({
  variant = 'default',
  size = 'default',
  className = '',
  as: As = 'button',
  children,
  ...props
}) {
  const cls = ['hlm-btn', `hlm-btn--${variant}`, size !== 'default' ? `hlm-btn--${size}` : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(As, _extends({
    className: cls
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Card — bordered, softly elevated surface. shadcn card. */
function Card({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card', className].filter(Boolean).join(' ')
  }, props), children);
}
function CardHeader({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card__header', className].filter(Boolean).join(' ')
  }, props), children);
}
function CardTitle({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card__title', className].filter(Boolean).join(' ')
  }, props), children);
}
function CardDescription({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card__description', className].filter(Boolean).join(' ')
  }, props), children);
}
function CardContent({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card__content', className].filter(Boolean).join(' ')
  }, props), children);
}
function CardFooter({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-card__footer', className].filter(Boolean).join(' ')
  }, props), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Separator.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Separator — 1px divider. shadcn / hlm-separator. */
function Separator({
  orientation = 'horizontal',
  className = '',
  ...props
}) {
  const cls = ['hlm-separator', `hlm-separator--${orientation}`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "separator",
    "aria-orientation": orientation,
    className: cls
  }, props));
}
Object.assign(__ds_scope, { Separator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Separator.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jig Field — Spartan `hlmField`. Groups a label, control, and
 * description/error with consistent 8px vertical rhythm.
 */
function Field({
  orientation = 'vertical',
  className = '',
  children,
  ...props
}) {
  const cls = ['hlm-field', orientation === 'horizontal' ? 'hlm-field--horizontal' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "group",
    className: cls
  }, props), children);
}
function FieldDescription({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    className: ['hlm-field__description', className].filter(Boolean).join(' ')
  }, props), children);
}
function FieldError({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("p", _extends({
    className: ['hlm-field__error', className].filter(Boolean).join(' ')
  }, props), children);
}
Object.assign(__ds_scope, { Field, FieldDescription, FieldError });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Input — Spartan `hlmInput`. 32px tall, transparent bg, ring on focus. */
function Input({
  className = '',
  invalid,
  ...props
}) {
  const cls = ['hlm-input', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("input", _extends({
    className: cls,
    "aria-invalid": invalid || undefined
  }, props));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Label.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Label — Spartan `hlmLabel`. */
function Label({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    className: ['hlm-label', className].filter(Boolean).join(' ')
  }, props), children);
}
Object.assign(__ds_scope, { Label });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Label.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Jig Textarea — the input skin, multi-line and vertically resizable. */
function Textarea({
  className = '',
  invalid,
  rows = 4,
  ...props
}) {
  const cls = ['hlm-input', 'hlm-textarea', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("textarea", _extends({
    className: cls,
    rows: rows,
    "aria-invalid": invalid || undefined
  }, props));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jig app shell — full-width CSS Grid: sticky header, collapsible
 * sidebar, scrollable main, footer. Drive collapse with `collapsed`.
 */
function AppShell({
  collapsed = false,
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-shell', className].filter(Boolean).join(' '),
    "data-collapsed": collapsed ? 'true' : 'false'
  }, props), children);
}
function ShellHeader({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    className: ['hlm-shell__header', className].filter(Boolean).join(' ')
  }, props), children);
}
function ShellMain({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("main", _extends({
    className: ['hlm-shell__main', className].filter(Boolean).join(' ')
  }, props), children);
}
function ShellFooter({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("footer", _extends({
    className: ['hlm-shell__footer', className].filter(Boolean).join(' ')
  }, props), children);
}

/* ── Sidebar surface ─────────────────────────────────────────── */

function Sidebar({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("aside", _extends({
    className: ['hlm-sidebar', className].filter(Boolean).join(' ')
  }, props), children);
}
function SidebarHeader({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-sidebar__header', className].filter(Boolean).join(' ')
  }, props), children);
}
function SidebarBody({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ['hlm-sidebar__body', className].filter(Boolean).join(' ')
  }, props), children);
}
function SidebarFooter({
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['hlm-sidebar__footer', className].filter(Boolean).join(' ')
  }, props), children);
}
function NavGroup({
  label,
  className = '',
  children,
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: className
  }, props), label ? /*#__PURE__*/React.createElement("div", {
    className: "hlm-nav__group-label"
  }, label) : null, children);
}

/**
 * Multi-tier nav item. Pass `items` (array of NavItem props) to make it a
 * collapsible parent; otherwise it's a leaf. `defaultOpen` seeds the subtree.
 */
function NavItem({
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
  const handleClick = e => {
    if (hasChildren) setOpen(o => !o);
    if (onClick) onClick(e);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ['hlm-nav__item', className].filter(Boolean).join(' '),
    "data-active": active ? 'true' : undefined,
    "data-open": hasChildren && open ? 'true' : undefined,
    onClick: handleClick
  }, props), icon ? /*#__PURE__*/React.createElement("span", {
    className: "hlm-nav__icon"
  }, icon) : null, /*#__PURE__*/React.createElement("span", {
    className: "hlm-nav__label"
  }, label), badge != null ? /*#__PURE__*/React.createElement("span", {
    className: "hlm-nav__badge"
  }, badge) : null, hasChildren ? /*#__PURE__*/React.createElement("svg", {
    className: "hlm-nav__chevron",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })) : null), hasChildren && open ? /*#__PURE__*/React.createElement("div", {
    className: "hlm-nav__sub"
  }, items.map((it, i) => /*#__PURE__*/React.createElement(NavItem, _extends({
    key: it.key ?? it.label ?? i
  }, it)))) : null);
}
Object.assign(__ds_scope, { AppShell, ShellHeader, ShellMain, ShellFooter, Sidebar, SidebarHeader, SidebarBody, SidebarFooter, NavGroup, NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/jig-app/AppScreen.jsx
try { (() => {
/* Full-width app shell — the standard jig authenticated view:
   sticky header, collapsible multi-tier sidebar, content, footer. */
function AppScreen({
  onSignOut
}) {
  const NS = window.JigDesignSystem_ac97f9;
  const {
    AppShell,
    ShellHeader,
    ShellMain,
    ShellFooter,
    Sidebar,
    SidebarHeader,
    SidebarBody,
    SidebarFooter,
    NavGroup,
    NavItem,
    Button,
    Badge,
    Input,
    Separator,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
  } = NS;
  const I = window.Icons;
  const [collapsed, setCollapsed] = React.useState(false);
  const [active, setActive] = React.useState('users');
  const icon = name => React.createElement(I[name]);
  const users = [{
    name: 'Satish Krishna',
    email: 'satish@jig.dev',
    role: 'Owner',
    status: 'Active',
    tone: 'default'
  }, {
    name: 'Ada Lovelace',
    email: 'ada@jig.dev',
    role: 'Maintainer',
    status: 'Active',
    tone: 'default'
  }, {
    name: 'Grace Hopper',
    email: 'grace@jig.dev',
    role: 'Contributor',
    status: 'Invited',
    tone: 'secondary'
  }, {
    name: 'Alan Turing',
    email: 'alan@jig.dev',
    role: 'Contributor',
    status: 'Suspended',
    tone: 'destructive'
  }];
  return /*#__PURE__*/React.createElement(AppShell, {
    collapsed: collapsed
  }, /*#__PURE__*/React.createElement(Sidebar, null, /*#__PURE__*/React.createElement(SidebarHeader, null, /*#__PURE__*/React.createElement("span", {
    className: "hlm-sidebar__brand-mark"
  }, "J"), /*#__PURE__*/React.createElement("span", {
    className: "hlm-sidebar__brand-name"
  }, "jig")), /*#__PURE__*/React.createElement(SidebarBody, null, /*#__PURE__*/React.createElement(NavGroup, {
    label: "Platform"
  }, /*#__PURE__*/React.createElement(NavItem, {
    label: "Overview",
    icon: icon('home'),
    active: active === 'overview',
    onClick: () => setActive('overview')
  }), /*#__PURE__*/React.createElement(NavItem, {
    label: "Features",
    icon: icon('box'),
    defaultOpen: true,
    badge: "3",
    items: [{
      label: 'users',
      icon: icon('users'),
      active: active === 'users',
      onClick: () => setActive('users')
    }, {
      label: 'billing',
      icon: icon('creditCard'),
      badge: 'new'
    }, {
      label: 'audit log',
      icon: icon('fileText')
    }]
  }), /*#__PURE__*/React.createElement(NavItem, {
    label: "Transport",
    icon: icon('gitBranch'),
    items: [{
      label: 'HTTP · .NET API'
    }, {
      label: 'IPC · Rust core'
    }]
  })), /*#__PURE__*/React.createElement(NavGroup, {
    label: "Build"
  }, /*#__PURE__*/React.createElement(NavItem, {
    label: "Terminal",
    icon: icon('terminal')
  }), /*#__PURE__*/React.createElement(NavItem, {
    label: "Settings",
    icon: icon('cog'),
    items: [{
      label: 'Workspace'
    }, {
      label: 'Codegen',
      items: [{
        label: 'OpenAPI'
      }, {
        label: 'DTOs'
      }]
    }]
  }))), /*#__PURE__*/React.createElement(SidebarFooter, null, /*#__PURE__*/React.createElement(NavItem, {
    label: "satish@jig.dev",
    icon: icon('users'),
    onClick: onSignOut
  }))), /*#__PURE__*/React.createElement(ShellHeader, null, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    "aria-label": "Toggle sidebar",
    onClick: () => setCollapsed(c => !c)
  }, icon('panelLeft')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      maxWidth: 340,
      color: 'var(--muted-foreground)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 9,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 15,
      height: 15,
      color: 'var(--muted-foreground)'
    }
  }, icon('search')), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Search users, features\u2026",
    style: {
      paddingLeft: 30
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "hlm-kbd"
  }, "Ctrl K")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, icon('gitBranch'), " main"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    "aria-label": "Notifications"
  }, icon('bell')), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 28,
      height: 28,
      borderRadius: '9999px',
      background: 'var(--secondary)',
      fontSize: 12,
      fontWeight: 600
    }
  }, "SK")), /*#__PURE__*/React.createElement(ShellMain, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--text-2xl)'
    }
  }, "users"), /*#__PURE__*/React.createElement(Badge, {
    variant: "outline"
  }, "worked slice")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--muted-foreground)',
      marginTop: 4
    }
  }, "The one vertical slice that exercises every layer end to end.")), /*#__PURE__*/React.createElement(Button, null, icon('plus'), " New user")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 20
    }
  }, [['Total', '128', 'across all roles'], ['Active', '96', 'signed in ≤ 30d'], ['Invited', '14', 'awaiting first login']].map(([k, v, s]) => /*#__PURE__*/React.createElement(Card, {
    key: k,
    style: {
      paddingBlock: 16,
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(CardHeader, {
    style: {
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(CardDescription, null, k), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-2xl)',
      fontWeight: 600,
      letterSpacing: '-0.02em'
    }
  }, v), /*#__PURE__*/React.createElement(CardDescription, {
    style: {
      fontSize: 12
    }
  }, s))))), /*#__PURE__*/React.createElement(Card, {
    style: {
      paddingBlock: 0,
      gap: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 40px',
      gap: 12,
      padding: '12px 16px',
      fontSize: 12,
      fontWeight: 500,
      color: 'var(--muted-foreground)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", null, "User"), /*#__PURE__*/React.createElement("div", null, "Role"), /*#__PURE__*/React.createElement("div", null, "Status"), /*#__PURE__*/React.createElement("div", null)), users.map((u, i) => /*#__PURE__*/React.createElement("div", {
    key: u.email,
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 40px',
      gap: 12,
      padding: '12px 16px',
      alignItems: 'center',
      borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 30,
      height: 30,
      borderRadius: '9999px',
      background: 'var(--secondary)',
      fontSize: 12,
      fontWeight: 600
    }
  }, u.name.split(' ').map(p => p[0]).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--muted-foreground)',
      fontFamily: 'var(--font-mono)'
    }
  }, u.email))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, u.role), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
    variant: u.tone
  }, u.status)), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    "aria-label": "Row actions"
  }, icon('moreH')))))), /*#__PURE__*/React.createElement(ShellFooter, null, /*#__PURE__*/React.createElement("span", {
    className: "hlm-kbd"
  }, "IPC"), /*#__PURE__*/React.createElement("span", null, "Connected to Rust core \xB7 thick client"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, icon('check'), " verify green"), /*#__PURE__*/React.createElement(Separator, {
    orientation: "vertical",
    style: {
      height: 14
    }
  }), /*#__PURE__*/React.createElement("span", null, "v0.4.0")));
}
window.AppScreen = AppScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/jig-app/AppScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/jig-app/AuthScreen.jsx
try { (() => {
/* Centered auth screen — demonstrates the jig "full page, centered
   content" layout using Card + Field + Input + Button. */
function AuthScreen({
  onSignIn
}) {
  const {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Field,
    FieldDescription,
    Label,
    Input,
    Button,
    Separator
  } = window.JigDesignSystem_ac97f9;
  const [email, setEmail] = React.useState('satish@jig.dev');
  return /*#__PURE__*/React.createElement("div", {
    className: "hlm-centered"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hlm-centered__inner",
    style: {
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      justifyContent: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--primary)',
      color: 'var(--primary-foreground)',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700
    }
  }, "J"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-0.02em'
    }
  }, "jig")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement(CardTitle, null, "Sign in to your workspace"), /*#__PURE__*/React.createElement(CardDescription, null, "One frontend, two wires. Pick up where you left off.")), /*#__PURE__*/React.createElement(CardContent, null, /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSignIn();
    },
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Field, null, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "a-email"
  }, "Email"), /*#__PURE__*/React.createElement(Input, {
    id: "a-email",
    type: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "you@example.com"
  })), /*#__PURE__*/React.createElement(Field, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Label, {
    htmlFor: "a-pass"
  }, "Password"), /*#__PURE__*/React.createElement(Button, {
    variant: "link",
    size: "sm",
    type: "button",
    style: {
      height: 'auto'
    }
  }, "Forgot?")), /*#__PURE__*/React.createElement(Input, {
    id: "a-pass",
    type: "password",
    defaultValue: "hunter2hunter2"
  })), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    style: {
      width: '100%'
    }
  }, "Sign in")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '18px 0'
    }
  }, /*#__PURE__*/React.createElement(Separator, {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--muted-foreground)'
    }
  }, "or"), /*#__PURE__*/React.createElement(Separator, {
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    style: {
      width: '100%'
    },
    onClick: onSignIn
  }, React.createElement(window.Icons.gitBranch), " Continue with GitHub")), /*#__PURE__*/React.createElement(CardFooter, {
    style: {
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(FieldDescription, null, "No account? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--foreground)',
      fontWeight: 500
    }
  }, "Request access"))))));
}
window.AuthScreen = AuthScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/jig-app/AuthScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/jig-app/Icons.jsx
try { (() => {
/* Lucide icon paths (ISC-licensed, github.com/lucide-icons/lucide) as tiny
   React components. Stroke 2, round caps — matches lucide-angular in jig. */
const S = props => React.createElement('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: '1em',
  height: '1em',
  'aria-hidden': 'true',
  ...props
}, props.children);
const P = d => React.createElement('path', {
  d
});
const Icons = {
  home: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M9 22V12h6v10"
  })),
  box: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
  }), /*#__PURE__*/React.createElement(P, {
    d: "m3.3 7 8.7 5 8.7-5"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M12 22V12"
  })),
  users: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "7",
    r: "4"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M22 21v-2a4 4 0 0 0-3-3.87"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M16 3.13a4 4 0 0 1 0 7.75"
  })),
  cog: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
  })),
  search: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement(P, {
    d: "m21 21-4.3-4.3"
  })),
  bell: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  })),
  panelLeft: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M9 3v18"
  })),
  plus: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M12 5v14"
  })),
  gitBranch: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("line", {
    x1: "6",
    x2: "6",
    y1: "3",
    y2: "15"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M18 9a9 9 0 0 1-9 9"
  })),
  terminal: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "m4 17 6-6-6-6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    x2: "20",
    y1: "19",
    y2: "19"
  })),
  creditCard: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("rect", {
    width: "20",
    height: "14",
    x: "2",
    y: "5",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    x2: "22",
    y1: "10",
    y2: "10"
  })),
  fileText: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
  }), /*#__PURE__*/React.createElement(P, {
    d: "M14 2v5h5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    x2: "15",
    y1: "13",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    x2: "15",
    y1: "17",
    y2: "17"
  })),
  check: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M20 6 9 17l-5-5"
  })),
  arrowRight: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement(P, {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement(P, {
    d: "m12 5 7 7-7 7"
  })),
  moreH: () => /*#__PURE__*/React.createElement(S, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1"
  }))
};
window.Icons = Icons;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/jig-app/Icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardTitle = __ds_scope.CardTitle;

__ds_ns.CardDescription = __ds_scope.CardDescription;

__ds_ns.CardContent = __ds_scope.CardContent;

__ds_ns.CardFooter = __ds_scope.CardFooter;

__ds_ns.Separator = __ds_scope.Separator;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.FieldDescription = __ds_scope.FieldDescription;

__ds_ns.FieldError = __ds_scope.FieldError;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Label = __ds_scope.Label;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.AppShell = __ds_scope.AppShell;

__ds_ns.ShellHeader = __ds_scope.ShellHeader;

__ds_ns.ShellMain = __ds_scope.ShellMain;

__ds_ns.ShellFooter = __ds_scope.ShellFooter;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.SidebarHeader = __ds_scope.SidebarHeader;

__ds_ns.SidebarBody = __ds_scope.SidebarBody;

__ds_ns.SidebarFooter = __ds_scope.SidebarFooter;

__ds_ns.NavGroup = __ds_scope.NavGroup;

__ds_ns.NavItem = __ds_scope.NavItem;

})();
