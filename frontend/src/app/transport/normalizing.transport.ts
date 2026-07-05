import { Injectable } from '@angular/core';
import { type Observable, catchError, throwError } from 'rxjs';
import type { OperationName, Req, Res } from '../contracts';
import { Transport } from './transport.port';
import { toAppError } from './app-error';

/**
 * Decorator that folds either wire's failure into one AppError, and the only place
 * cross-cutting concerns (error shaping, and later retry or logging) may live.
 * Nothing above this seam may catch a raw HttpErrorResponse or invoke rejection.
 *
 * @capability transport.normalizing
 * @intent One error seam; every failure above it is already an AppError.
 * @reuse Wrap the selected Transport at bootstrap. Never add error branching above this.
 */
@Injectable()
export class NormalizingTransport extends Transport {
  constructor(private readonly inner: Transport) {
    super();
  }

  request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>> {
    return this.inner.request(op, payload).pipe(
      catchError((cause) => throwError(() => toAppError(op, cause))),
    );
  }
}
