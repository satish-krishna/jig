import type { Signal } from '@angular/core';

export type Region = 'sidebar' | 'header';

/** The only shape the menu system knows. Navigation and actions both implement it. */
export interface Command {
  readonly id: string;
  readonly label: string;
  /** Registered @ng-icons/lucide name, e.g. 'lucideUsers'. */
  readonly icon?: string;
  /** Reactive: the menu re-renders when this flips. */
  readonly canExecute: Signal<boolean>;
  execute(): void | Promise<void>;
}
