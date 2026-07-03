import type { Observable } from 'rxjs';
import type { OperationName, Req, Res } from '../contracts';

/**
 * The transport port: the only object in the frontend that knows two wires exist.
 * It speaks logical operations and returns Observables, so the HTTP world
 * (HttpClient) and the IPC world (invoke) look identical to every caller above it.
 *
 * @capability transport.port
 * @intent One abstract seam; View, ViewModel, and repositories never learn which wire is live.
 * @reuse Inject Transport (the DI token) and call request(op, payload). Never branch on wire above this.
 * @since 0.1.0
 */
export abstract class Transport {
  abstract request<K extends OperationName>(op: K, payload: Req<K>): Observable<Res<K>>;
}
