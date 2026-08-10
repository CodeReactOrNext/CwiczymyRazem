/**
 * Deterministic randomness for the parts of the game that have to look identical
 * on every client and on the server: the featured case pool and the trader's
 * daily stock.
 *
 * Same seed, same sequence, everywhere — which is what lets a shop front be
 * rendered client-side with zero reads and still be recomputed, and therefore
 * trusted, server-side when the player actually pays for something.
 */

/** mulberry32 — small, fast, and stable across JS engines. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Fisher–Yates driven by the seeded PRNG; never mutates the input. */
export const seededShuffle = <T>(
  items: readonly T[],
  random: () => number,
): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Uniform pick. Returns `undefined` only for an empty list. */
export const seededPick = <T>(
  items: readonly T[],
  random: () => number,
): T | undefined =>
  items.length === 0 ? undefined : items[Math.floor(random() * items.length)];

/**
 * One entry, drawn with the given weights. Weights need not sum to anything in
 * particular; non-positive ones are simply never drawn.
 */
export const weightedPick = <T>(
  items: readonly T[],
  weight: (item: T) => number,
  random: () => number,
): T | undefined => {
  const weights = items.map((item) => Math.max(0, weight(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return seededPick(items, random);

  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
};

/**
 * `count` *distinct* entries, each drawn weighted from whatever is left. Used
 * wherever two slots of the same kind must not land on the same thing — a shop
 * front offering the same part twice reads as a bug.
 */
export const weightedSample = <T>(
  items: readonly T[],
  weight: (item: T) => number,
  count: number,
  random: () => number,
): T[] => {
  const remaining = [...items];
  const picked: T[] = [];

  while (picked.length < count && remaining.length > 0) {
    const choice = weightedPick(remaining, weight, random);
    if (choice === undefined) break;
    picked.push(choice);
    remaining.splice(remaining.indexOf(choice), 1);
  }

  return picked;
};
