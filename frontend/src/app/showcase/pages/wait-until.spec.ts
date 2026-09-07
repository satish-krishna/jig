import { describe, it, expect, vi } from 'vitest';
import { waitUntil } from './wait-until';

describe('waitUntil', () => {
  it('returns immediately when the predicate already holds', async () => {
    const tick = vi.fn();
    await waitUntil(() => true, tick, { describe: 'already true' });
    expect(tick).toHaveBeenCalled();
  });

  it('polls until the predicate flips true, ticking on every poll', async () => {
    let ready = false;
    setTimeout(() => {
      ready = true;
    }, 15);

    const tick = vi.fn();
    await waitUntil(() => ready, tick, { timeoutMs: 500, pollMs: 5, describe: 'flag to flip' });

    expect(ready).toBe(true);
    expect(tick.mock.calls.length).toBeGreaterThan(1);
  });

  it('expresses waiting for absence just as naturally as waiting for presence', async () => {
    let present = true;
    setTimeout(() => {
      present = false;
    }, 15);

    await waitUntil(
      () => !present,
      () => {},
      { timeoutMs: 500, pollMs: 5, describe: 'element to disappear' },
    );

    expect(present).toBe(false);
  });

  it('throws a named timeout error rather than returning quietly when the predicate never holds', async () => {
    await expect(
      waitUntil(() => false, () => {}, { timeoutMs: 40, pollMs: 5, describe: 'the tooltip to appear' }),
    ).rejects.toThrow(/the tooltip to appear/);
  });

  it('includes the configured timeout duration in the thrown message', async () => {
    await expect(
      waitUntil(() => false, () => {}, { timeoutMs: 40, pollMs: 5, describe: 'a menu to close' }),
    ).rejects.toThrow(/40ms/);
  });
});
