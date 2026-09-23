/**
 * Runs `task` over every item with at most `limit` of them in flight, and
 * answers in the order the items came in.
 *
 * The plain `for … await` loop it replaces is the right shape when each step
 * feeds the next; it is the wrong one when the steps are independent and slow,
 * which is exactly what a roadmap's phase descriptions are — six to eight model
 * calls that only ever read the same skeleton. Waiting for each in turn is the
 * difference between one long minute and three short ones.
 *
 * A worker that throws takes the whole call down with it, as `Promise.all`
 * does; the workers already running are left to finish rather than abandoned
 * mid-request, so nothing half-written is silently discarded.
 */
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  const workers = Math.min(Math.max(1, Math.floor(limit)), items.length);
  let next = 0;

  await Promise.all(
    Array.from({ length: workers }, async () => {
      // `next++` is read and bumped between awaits, so two workers can never
      // take the same index: nothing yields in the middle of it.
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await task(items[index], index);
      }
    }),
  );

  return results;
};
