// What the tab worker is told about the notes' marks (hits, misses, timings).
//
// React hands the board the whole map every time one note is judged. Sending
// it whole meant cloning it on this thread and reading it back in the worker,
// between two frames, for every note — work that grows with the song. Only the
// notes that changed go now; the worker keeps the rest.

export type MarkUpdate<T> =
  /** Replace everything: the first send, after the worker was reset, or once a note's mark is gone. */
  | { kind: "full"; marks: Record<string, T> }
  /** Notes whose mark is new or different; every other note stays as the worker has it. */
  | { kind: "patch"; marks: Record<string, T> };

/**
 * What to send so a worker holding `sent` ends up holding `next`; null when it
 * already does. `sent` null means the worker holds nothing known.
 */
export function diffMarks<T>(sent: Record<string, T> | null, next: Record<string, T>): MarkUpdate<T> | null {
  if (!sent) return { kind: "full", marks: next };
  if (sent === next) return null;
  const changed: Record<string, T> = {};
  let changedCount = 0;
  let addedCount = 0;
  const nextKeys = Object.keys(next);
  for (const key of nextKeys) {
    const value = next[key];
    if (key in sent) {
      if (sent[key] === value) continue;
    } else {
      addedCount++;
    }
    changed[key] = value;
    changedCount++;
  }
  // A note that lost its mark (a loop wrap, a restart) can't be said in a patch.
  if (nextKeys.length - addedCount !== Object.keys(sent).length) return { kind: "full", marks: next };
  return changedCount === 0 ? null : { kind: "patch", marks: changed };
}

/** Whether two mark maps say the same about every note. */
export function sameMarks<T>(a: Record<string, T>, b: Record<string, T>): boolean {
  if (a === b) return true;
  const keys = Object.keys(a);
  for (const key of keys) {
    if (!(key in b) || a[key] !== b[key]) return false;
  }
  return keys.length === Object.keys(b).length;
}
