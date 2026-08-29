/**
 * What a guild wears to look like itself.
 *
 * Three slots, and deliberately only three: a colour the guild is known by, a
 * backdrop for its card, and how its tag is drawn everywhere the tag appears.
 * None of them costs anything and none of them pays anything back — no Fame/h,
 * no seats, no drop-rate. That is the point. A guild's look is the one thing it
 * can change that cannot make being outside a guild worse, so pricing it would
 * only have put a wall in front of the harmless half of the feature.
 *
 * Free, but not everybody's to change: the founder picks what the guild wears
 * (see `guildCosmetics.ts` on the server). Without that, two members with
 * different taste could flip the guild's colour back and forth all afternoon.
 *
 * Ids are `slot:name`, so the slot an item belongs to is readable off the id
 * alone. The server needs exactly that and nothing else from this file: it
 * writes the id. Everything about how an item actually looks lives in
 * `guildCosmetics.style.ts`, on the client's side of the line.
 */

export type CosmeticSlot = "accent" | "banner" | "frame";

export interface GuildCosmeticItem {
  /** `slot:name` — see `slotOf`. */
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** One line on what it does, for the tile. */
  blurb: string;
  /**
   * Only accents carry a colour. It is a hex rather than a Tailwind class
   * because banners and frames are drawn *from* it — eight accents times six
   * banners is forty-eight class strings nobody would keep in step, while one
   * hex threaded through an inline style is the same trick `getChipCustomStyle`
   * already plays for item rarities.
   */
  hex?: string;
}

/**
 * The colour the guild is known by. Everything else in the guild's kit is
 * tinted from whichever of these is worn, so this is the slot that actually
 * decides what a guild looks like.
 *
 * The palette is the app's own semantic one (see STYLEGUIDE §4) plus two
 * neighbours. Deliberately not a colour picker: an arbitrary hex would let a
 * guild wear something that reads as "error" or vanishes into the page
 * background, and every one of these is already known to sit properly on
 * `zinc-950`.
 */
export const GUILD_ACCENTS: GuildCosmeticItem[] = [
  {
    id: "accent:steel",
    slot: "accent",
    name: "Steel",
    blurb: "The plain one every guild starts in.",
    hex: "#a1a1aa",
  },
  {
    id: "accent:signal",
    slot: "accent",
    name: "Signal",
    blurb: "The app's own cyan.",
    hex: "#22d3ee",
  },
  {
    id: "accent:verdant",
    slot: "accent",
    name: "Verdant",
    blurb: "Green, the colour of a week cleared.",
    hex: "#34d399",
  },
  {
    id: "accent:brass",
    slot: "accent",
    name: "Brass",
    blurb: "Fame's own gold.",
    hex: "#fbbf24",
  },
  {
    id: "accent:ember",
    slot: "accent",
    name: "Ember",
    blurb: "Streak orange, for a guild that never misses.",
    hex: "#fb923c",
  },
  {
    id: "accent:nightshade",
    slot: "accent",
    name: "Nightshade",
    blurb: "Violet — the rare tier's colour.",
    hex: "#a78bfa",
  },
  {
    id: "accent:crimson",
    slot: "accent",
    name: "Crimson",
    blurb: "Loud, and nobody else on the board is wearing it.",
    hex: "#fb7185",
  },
  {
    id: "accent:cobalt",
    slot: "accent",
    name: "Cobalt",
    blurb: "Deep blue, cold as a rehearsal room in February.",
    hex: "#60a5fa",
  },
];

/** The backdrop on the guild's own card. Drawn from the accent, never its own colour. */
export const GUILD_BANNERS: GuildCosmeticItem[] = [
  {
    id: "banner:none",
    slot: "banner",
    name: "Bare",
    blurb: "No backdrop at all.",
  },
  {
    id: "banner:wash",
    slot: "banner",
    name: "Wash",
    blurb: "A soft bloom of the guild's colour behind the crest.",
  },
  {
    id: "banner:strings",
    slot: "banner",
    name: "Six Strings",
    blurb: "Fine lines running across the card, like strings seen edge-on.",
  },
  {
    id: "banner:frets",
    slot: "banner",
    name: "Frets",
    blurb: "Vertical bars, evenly spaced down the card.",
  },
  {
    id: "banner:stack",
    slot: "banner",
    name: "Stack",
    blurb: "Diagonal stripes, like a cab grille on its side.",
  },
  {
    id: "banner:halo",
    slot: "banner",
    name: "Halo",
    blurb: "A wide glow behind everything. Hard to miss.",
  },
];

/** How the tag is drawn — on the leaderboard, in chat, anywhere a member is named. */
export const GUILD_FRAMES: GuildCosmeticItem[] = [
  {
    id: "frame:plain",
    slot: "frame",
    name: "Plain",
    blurb: "Tag in the guild's colour, nothing around it.",
  },
  {
    id: "frame:ring",
    slot: "frame",
    name: "Ring",
    blurb: "A thin ring in the guild's colour.",
  },
  {
    id: "frame:plate",
    slot: "frame",
    name: "Plate",
    blurb: "Filled, so the tag reads first on a busy row.",
  },
  {
    id: "frame:heavy",
    slot: "frame",
    name: "Heavy",
    blurb: "Filled and ringed. The loudest a tag gets.",
  },
];

export const GUILD_COSMETICS: GuildCosmeticItem[] = [
  ...GUILD_ACCENTS,
  ...GUILD_BANNERS,
  ...GUILD_FRAMES,
];

export const COSMETIC_SLOTS: {
  slot: CosmeticSlot;
  label: string;
  /** What the slot is for, said once above its row rather than on every tile. */
  blurb: string;
  items: GuildCosmeticItem[];
}[] = [
  {
    slot: "accent",
    label: "Colour",
    blurb:
      "The one the rest of the kit is drawn from — change it and the banner and the frame follow.",
    items: GUILD_ACCENTS,
  },
  {
    slot: "banner",
    label: "Banner",
    blurb: "The backdrop on your card in the guild list.",
    items: GUILD_BANNERS,
  },
  {
    slot: "frame",
    label: "Tag",
    blurb: "How your tag is drawn next to every member's name on the board.",
    items: GUILD_FRAMES,
  },
];

const BY_ID = new Map(GUILD_COSMETICS.map((item) => [item.id, item]));

export const findCosmetic = (id: unknown): GuildCosmeticItem | null =>
  typeof id === "string" ? (BY_ID.get(id) ?? null) : null;

/** The slot an id claims to belong to, without trusting that it exists. */
export const slotOf = (id: unknown): CosmeticSlot | null => {
  const item = findCosmetic(id);
  return item ? item.slot : null;
};

/**
 * What a guild wears before anyone has touched the kit. One item per slot, so
 * there is always something to fall back to and never a slot rendering blank.
 */
export const DEFAULT_COSMETIC: Record<CosmeticSlot, GuildCosmeticItem> = {
  accent: GUILD_ACCENTS[0],
  banner: GUILD_BANNERS[0],
  frame: GUILD_FRAMES[0],
};
