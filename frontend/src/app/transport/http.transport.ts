import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ROUTES, type OperationName, type Req, type Res } from '../contracts';
import { Transport } from './transport.port';

/** Base URL of the .NET API. Provided only in the web bootstrap; unused under Tauri. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

/**
 * The HTTP wire: maps each operation onto its route from the registry and calls
 * the .NET API through HttpClient. Auth belongs in an HttpInterceptor, never here.
 *
 * @capability transport.http
 * @intent The thin-client wire; route knowledge lives in the registry, not in callers.
 * @reuse Selected by provideTransport when not under Tauri. Do not call directly.
 */
@Injectable()
export class HttpTransport extends Transport {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>> {
    const route = ROUTES[op];
    return this.http.request<Res<K>>(route.method, `${this.base}${route.path(payload)}`, {
      body: route.hasBody ? payload : undefined,
    });
  }
}
