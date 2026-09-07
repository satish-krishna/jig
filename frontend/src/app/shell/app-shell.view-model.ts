import { Injectable, inject, signal } from '@angular/core';
import { WIRE } from '../transport';

/**
 * ViewModel for the app shell. Holds the sidebar collapse state and the wire
 * label the footer shows. The shell reads WIRE for display only (which transport
 * is active), not to make requests, but the ownership still belongs in the
 * ViewModel so the component stays free of inject()-ed state.
 *
 * Copy frontend/src/app/features/users/user-list.view-model.ts for the general
 * shape; this one has no repository because the shell has no data to fetch.
 */
@Injectable()
export class AppShellViewModel {
  readonly wire = inject(WIRE, { optional: true });

  readonly collapsed = signal(false);

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
