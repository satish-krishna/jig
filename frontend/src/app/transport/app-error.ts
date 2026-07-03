export type AppErrorKind = 'validation' | 'notFound' | 'conflict' | 'network' | 'unexpected';

/** The one error shape the app sees. Both wires fold into this at the normalizing seam. */
export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly operation: string;
  readonly status?: number;
  readonly cause?: unknown;
}

function kindFromStatus(status: number): AppErrorKind {
  if (status === 0) return 'network';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  return 'unexpected';
}

/** Duck-typed HttpErrorResponse: a numeric status is enough, no @angular/common/http import needed here. */
function isHttpLike(cause: unknown): cause is { status: number; error?: unknown; message?: string } {
  return typeof cause === 'object' && cause !== null && typeof (cause as { status?: unknown }).status === 'number';
}

function messageFrom(cause: { error?: unknown; message?: string }): string {
  const body = cause.error;
  if (typeof body === 'string' && body.length > 0) return body;
  if (typeof body === 'object' && body !== null) {
    const o = body as { detail?: string; message?: string };
    if (o.detail) return o.detail;
    if (o.message) return o.message;
  }
  return cause.message ?? 'Request failed.';
}

/**
 * Fold either wire's failure into one AppError. HttpClient throws HttpErrorResponse
 * with a status; a rejected invoke throws whatever the Rust command returned. This is
 * the single place that shape difference is resolved.
 *
 * @capability transport.app-error
 * @intent One error type above the seam, so no ViewModel grows two error branches.
 * @reuse Called only by NormalizingTransport. Do not catch raw wire errors elsewhere.
 * @since 0.1.0
 */
export function toAppError(operation: string, cause: unknown): AppError {
  if (isHttpLike(cause)) {
    return { kind: kindFromStatus(cause.status), message: messageFrom(cause), operation, status: cause.status, cause };
  }
  const message = typeof cause === 'string' ? cause : (cause as { message?: string })?.message ?? 'Unexpected error.';
  return { kind: 'unexpected', message, operation, cause };
}
