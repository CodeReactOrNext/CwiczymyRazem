/**
 * Scattered "doodle wallpaper" layout: icons of mixed sizes and angles with
 * small dots, rings and stars in the gaps, placed by dart throwing on a torus
 * so the tile repeats without a visible seam or grid. Seeded, so the server and
 * the client draw the same picture.
 */

export type DoodleFiller = "dot" | "ring" | "star";

export type DoodleItem =
  | { kind: "icon"; icon: number; x: number; y: number; size: number; rotate: number }
  | { kind: DoodleFiller; x: number; y: number; size: number; rotate: number };

export interface DoodleLayoutOptions {
  /** Edge of the square tile, in px. */
  tile: number;
  seed: number;
  /** How many different icons the pool has; items get indexes into it. */
  iconKinds: number;
  /** At most this many; placement stops early once the tile is full. */
  iconCount: number;
  /** At most this many, squeezed into the gaps between icons. */
  fillerCount: number;
  minIconSize: number;
  maxIconSize: number;
  /** Clear space kept between any two items, in px. */
  gap: number;
}

/** mulberry32 — small, fast, good enough for placing doodles. */
export const seededRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Distance on the repeating tile: an item near one edge is near the opposite one too. */
export const torusDistance = (ax: number, ay: number, bx: number, by: number, tile: number) => {
  const dx = Math.min(Math.abs(ax - bx), tile - Math.abs(ax - bx));
  const dy = Math.min(Math.abs(ay - by), tile - Math.abs(ay - by));
  return Math.hypot(dx, dy);
};

/** Radius an item occupies; half an icon’s box, since the glyphs leave its corners empty. */
export const doodleRadius = (item: Pick<DoodleItem, "kind" | "size">) =>
  item.kind === "icon" ? item.size * 0.5 : item.size / 2;

export const buildDoodleLayout = ({
  tile,
  seed,
  iconKinds,
  iconCount,
  fillerCount,
  minIconSize,
  maxIconSize,
  gap,
}: DoodleLayoutOptions): DoodleItem[] => {
  const rand = seededRandom(seed);
  const items: DoodleItem[] = [];

  const fits = (candidate: DoodleItem) => {
    const r = doodleRadius(candidate);
    return items.every(
      (other) =>
        torusDistance(candidate.x, candidate.y, other.x, other.y, tile) >=
        r + doodleRadius(other) + gap
    );
  };

  // Every icon shows up before any repeats, in a shuffled order per round.
  let deck: number[] = [];
  const nextIcon = () => {
    if (deck.length === 0) {
      deck = Array.from({ length: iconKinds }, (_, i) => i);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck.pop() as number;
  };

  const place = (make: () => DoodleItem, count: number, attempts: number) => {
    let placed = 0;
    for (let i = 0; i < attempts && placed < count; i++) {
      const candidate = make();
      if (fits(candidate)) {
        items.push(candidate);
        placed++;
      }
    }
  };

  // Biased a little toward small sizes, so the big doodles stand out among the rest.
  place(
    () => ({
      kind: "icon",
      icon: -1,
      x: rand() * tile,
      y: rand() * tile,
      size: Math.round(minIconSize + (maxIconSize - minIconSize) * rand() ** 1.3),
      rotate: Math.round((rand() - 0.5) * 70),
    }),
    iconCount,
    iconCount * 60
  );
  for (const item of items) if (item.kind === "icon") item.icon = nextIcon();

  const fillers: DoodleFiller[] = ["dot", "dot", "ring", "ring", "star"];
  place(
    () => {
      const kind = fillers[Math.floor(rand() * fillers.length)];
      return {
        kind,
        x: rand() * tile,
        y: rand() * tile,
        size: kind === "dot" ? 3 + rand() * 2 : 5 + rand() * 6,
        rotate: Math.round(rand() * 90),
      };
    },
    fillerCount,
    fillerCount * 60
  );

  return items;
};
