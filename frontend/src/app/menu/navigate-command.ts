import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Command } from './command';

/**
 * A navigation menu item as a Command that WRAPS the Router. It does not
 * reimplement routing: execute() delegates to router.navigate, and active
 * highlighting is derived from router.url by the sidebar, not stored here.
 */
export function navigateCommand(opts: {
  id: string;
  label: string;
  icon?: string;
  route: string;
}): Command {
  const router = inject(Router);
  return {
    id: opts.id,
    label: opts.label,
    icon: opts.icon,
    canExecute: signal(true),
    execute: () => router.navigate([opts.route]),
  };
}
