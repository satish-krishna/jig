/**
 * Polls a predicate instead of sleeping a fixed duration.
 *
 * A handful of showcase specs open or close a CDK overlay that resolves
 * asynchronously (an rxjs `debounceTime`/`delay`, a zeroed `showDelay`, a
 * `delay()` operator). The overlay always settles fast, but "fast" is not a
 * fixed number: a loaded machine (this repo's `npm run verify` also builds
 * .NET in the same run) can push a 20-30ms guess past its deadline, so a
 * fixed sleep is a coin flip that loses eventually. Polling a predicate scales
 * with however long the wait actually takes and never guesses.
 *
 * @capability testing.wait-until
 * @intent Replace a fixed-duration sleep in a spec with a predicate poll that fails loudly, by name, on a genuine timeout instead of racing a guess.
 * @reuse Any spec waiting out an async CDK overlay: pass a predicate for the DOM state you want and a tick, e.g. `() => fixture.detectChanges()`.
 */
export async function waitUntil(
  predicate: () => boolean,
  tick: () => void,
  options?: { timeoutMs?: number; pollMs?: number; describe?: string },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 2000;
  const pollMs = options?.pollMs ?? 5;
  const describe = options?.describe ?? 'condition to hold';

  const deadline = Date.now() + timeoutMs;
  tick();
  while (!predicate()) {
    if (Date.now() >= deadline) {
      throw new Error(`waitUntil timed out after ${timeoutMs}ms waiting for: ${describe}`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
    tick();
  }
}
