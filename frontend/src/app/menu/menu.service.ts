import { DestroyRef, Injectable, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import type { Command, Region } from './command';

/**
 * Region-keyed registry of Commands. The "header menu" is the 'header' region;
 * there is no separate class. register() ties the command's lifetime to the
 * caller's DestroyRef, so a feature that unmounts drops its contributions
 * automatically — no manual unregister in ngOnDestroy.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly regions: Record<Region, WritableSignal<readonly Command[]>> = {
    sidebar: signal<readonly Command[]>([]),
    header: signal<readonly Command[]>([]),
  };

  register(region: Region, command: Command): void {
    const bucket = this.regions[region];
    bucket.update((cmds) => [...cmds, command]);
    inject(DestroyRef).onDestroy(() => {
      bucket.update((cmds) => cmds.filter((c) => c !== command));
    });
  }

  items(region: Region): Signal<readonly Command[]> {
    return this.regions[region].asReadonly();
  }
}
