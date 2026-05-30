export const RESEND_LIMIT_PER_SECOND = 4;
export const RESEND_GAP_MS = Math.ceil(1000 / RESEND_LIMIT_PER_SECOND);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function sendThrottled<T, R>(
  items: T[],
  task: (item: T, idx: number) => Promise<R>,
  gapMs: number = RESEND_GAP_MS
): Promise<PromiseSettledResult<R>[]> {
  if (items.length === 0) return [];

  const inFlight: Promise<R>[] = [];
  for (let i = 0; i < items.length; i++) {
    inFlight.push(task(items[i], i));
    if (i < items.length - 1) {
      await sleep(gapMs);
    }
  }
  return Promise.allSettled(inFlight);
}
