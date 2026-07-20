import {
  mapWithConcurrency,
  SiteCircuitOpenError,
  withSiteCircuitBreaker,
} from './search-resilience';

describe('search resilience', () => {
  it('limits concurrent workers', async () => {
    let activeWorkers = 0;
    let maxActiveWorkers = 0;

    const results = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6, 7, 8],
      3,
      async (value) => {
        activeWorkers += 1;
        maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers);
        await new Promise((resolve) => setTimeout(resolve, 5));
        activeWorkers -= 1;
        return value * 2;
      }
    );

    expect(maxActiveWorkers).toBe(3);
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
  });

  it('opens the circuit after three consecutive failures', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('offline'));
    const siteKey = `test-site-${Date.now()}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(
        withSiteCircuitBreaker(siteKey, operation)
      ).rejects.toThrow('offline');
    }

    await expect(
      withSiteCircuitBreaker(siteKey, operation)
    ).rejects.toBeInstanceOf(SiteCircuitOpenError);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
