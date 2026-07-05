import { type EnvironmentProviders, makeEnvironmentProviders, inject, InjectionToken } from '@angular/core';
import { isTauri } from '@tauri-apps/api/core';
import { Transport } from './transport.port';
import { API_BASE_URL, HttpTransport } from './http.transport';
import { IpcTransport } from './ipc.transport';
import { NormalizingTransport } from './normalizing.transport';

export const WIRE = new InjectionToken<'ipc' | 'http'>('transport wire');

/**
 * Picks the wire once, at bootstrap: IPC under Tauri, HTTP in the browser, wrapped
 * in the normalizer so error shaping lives in exactly one place. This is the only
 * spot in the app allowed to ask isTauri().
 *
 * @capability transport.provide
 * @intent Collapse the whole "which world" decision to one factory at startup.
 * @reuse Call provideTransport(apiBaseUrl) in the app config. Nothing else selects a wire.
 */
export function provideTransport(apiBaseUrl: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    HttpTransport,
    IpcTransport,
    { provide: API_BASE_URL, useValue: apiBaseUrl },
    { provide: WIRE, useValue: isTauri() ? 'ipc' : 'http' },
    {
      provide: Transport,
      useFactory: () => new NormalizingTransport(isTauri() ? inject(IpcTransport) : inject(HttpTransport)),
    },
  ]);
}
