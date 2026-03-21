/**
 * Poll a function until it returns a truthy value or timeout is reached.
 */
export async function waitFor<T>(
  fn: () => Promise<T | null | undefined>,
  options: { timeout?: number; interval?: number } = {},
): Promise<T> {
  const { timeout = 10_000, interval = 500 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await fn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}
