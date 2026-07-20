const FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000;

export const SEARCH_SITE_CONCURRENCY = 6;

interface CircuitState {
  failures: number;
  openUntil: number;
  probeInProgress: boolean;
}

const circuitStates = new Map<string, CircuitState>();

export class SiteCircuitOpenError extends Error {
  constructor(siteKey: string) {
    super(`Circuit open for site ${siteKey}`);
    this.name = 'SiteCircuitOpenError';
  }
}

export function isSiteCircuitOpenError(
  error: unknown
): error is SiteCircuitOpenError {
  return error instanceof SiteCircuitOpenError;
}

export async function withSiteCircuitBreaker<T>(
  siteKey: string,
  operation: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existingState = circuitStates.get(siteKey);
  const isHalfOpen = !!existingState?.openUntil && existingState.openUntil <= now;

  if (existingState?.openUntil && existingState.openUntil > now) {
    throw new SiteCircuitOpenError(siteKey);
  }
  if (isHalfOpen && existingState.probeInProgress) {
    throw new SiteCircuitOpenError(siteKey);
  }
  if (isHalfOpen && existingState) {
    existingState.probeInProgress = true;
  }

  try {
    const result = await operation();
    circuitStates.delete(siteKey);
    return result;
  } catch (error) {
    const state = circuitStates.get(siteKey) || {
      failures: 0,
      openUntil: 0,
      probeInProgress: false,
    };
    state.failures = isHalfOpen ? FAILURE_THRESHOLD : state.failures + 1;
    state.openUntil =
      state.failures >= FAILURE_THRESHOLD
        ? Date.now() + CIRCUIT_COOLDOWN_MS
        : 0;
    state.probeInProgress = false;
    circuitStates.set(siteKey, state);
    throw error;
  }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
