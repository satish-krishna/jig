import * as React from 'react';

/**
 * Full-width application shell — a CSS Grid with a sticky header, a
 * collapsible sidebar spanning full height, a scrollable main region, and a
 * footer. This is the jig "standard full-width layout". Toggle `collapsed`
 * to swap the sidebar to its icon rail.
 *
 * @startingPoint section="Layout" subtitle="Sticky header + collapsible sidebar + footer" viewport="1280x720"
 */
export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Collapse the sidebar to an icon rail. @default false */
  collapsed?: boolean;
}

export function AppShell(props: AppShellProps): React.JSX.Element;
export function ShellHeader(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;
export function ShellMain(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;
export function ShellFooter(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;

export function Sidebar(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;
export function SidebarHeader(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export function SidebarBody(props: React.HTMLAttributes<HTMLElement>): React.JSX.Element;
export function SidebarFooter(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;

export interface NavGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional section caption above the items. */
  label?: React.ReactNode;
}
export function NavGroup(props: NavGroupProps): React.JSX.Element;

export interface NavItemData {
  key?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  defaultOpen?: boolean;
  items?: NavItemData[];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * A single sidebar row. Give it `items` to make it a collapsible parent
 * (renders a chevron and nests a bordered subtree); omit for a leaf link.
 * Nests to any depth.
 */
export interface NavItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  active?: boolean;
  defaultOpen?: boolean;
  items?: NavItemData[];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
export function NavItem(props: NavItemProps): React.JSX.Element;
