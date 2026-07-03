import { describe, it, expect } from 'vitest';
import { toAppError } from './app-error';

describe('toAppError', () => {
  it('maps HTTP 404 to notFound and keeps the operation and status', () => {
    const e = toAppError('users.get', { status: 404, error: { detail: 'gone' } });
    expect(e.kind).toBe('notFound');
    expect(e.status).toBe(404);
    expect(e.operation).toBe('users.get');
    expect(e.message).toBe('gone');
  });

  it('maps HTTP 400 to validation', () => {
    expect(toAppError('users.save', { status: 400 }).kind).toBe('validation');
  });

  it('maps HTTP 409 to conflict', () => {
    expect(toAppError('users.save', { status: 409 }).kind).toBe('conflict');
  });

  it('maps status 0 to network', () => {
    expect(toAppError('users.list', { status: 0 }).kind).toBe('network');
  });

  it('folds a raw invoke string rejection into an unexpected AppError', () => {
    const e = toAppError('users.get', 'boom from rust');
    expect(e.kind).toBe('unexpected');
    expect(e.message).toBe('boom from rust');
    expect(e.operation).toBe('users.get');
  });
});
