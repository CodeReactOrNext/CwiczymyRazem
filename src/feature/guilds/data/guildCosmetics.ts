/**
 * What a guild wears to look like itself.
 *
 * Four slots, and deliberately only four: a colour the guild is known by, a
 * backdrop for its card, the four icons tiled across that backdrop, and how
 * its tag is drawn everywhere the tag appears. None of them costs anything and
 * none of them pays anything back — no Fame/h, no seats, no drop-rate. That is
 * the point. A guild's look is the one thing it can change that cannot make
 * being outside a guild worse, so pricing it would only have put a wall in
 * front of the harmless half of the feature.
 *
 * Free, but earned: the plainer items are there from the start and the rest
 * unlock as the guild levels up (see `level`), so a look also says how far a
 * guild has come. And not everybody's to change: the founder picks what the guild wears
 * (see `guildCosmetics.ts` on the server). Without that, two members with
 * different taste could flip the guild's colour back and forth all afternoon.
 *
 * Ids are `slot:name`, so the slot an item belongs to is readable off the id
 * alone. The server needs exactly that and nothing else from this file: it
 * writes the id. Everything about how an item actually looks lives in
 * `guildCosmetics.style.ts`, on the client's side of the line.
 */

export type CosmeticSlot = "accent" | "banner" | "motif" | "frame";

export interface GuildCosmeticItem {
  /** `slot:name` — see `slotOf`. */
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** One line on what it does, for the tile. */
  blurb: string;
  /**
   * Only accents carry a colour. It is a hex rather than a Tailwind class
   * because banners and frames are drawn *from* it — seventeen accents times
   * five banners is eighty-five class strings nobody would keep in step, while
   * one hex threaded through an inline style is the same trick
   * `getChipCustomStyle` already plays for item rarities.
   */
  hex?: string;
  /** Only motifs carry icons: the four keys tiled across the banner, in order. */
  icons?: MotifIconKey[];
  /**
   * The guild level that unlocks it — quests cleared, see `guildQuests.ts`.
   * Missing means there from the start. Wearing it stays free; what the level
   * buys is the right to. The plain items in every slot carry no level, so a
   * new guild always has something to wear and a default to fall back on.
   */
  level?: number;
}

/**
 * The colour the guild is known by. Everything else in the guild's kit is
 * tinted from whichever of these is worn, so this is the slot that actually
 * decides what a guild looks like.
 *
 * The palette is the app's own semantic one (see STYLEGUIDE §4) and its
 * neighbours on the wheel, at the 400 shade throughout so every one of them
 * is already known to sit properly on `zinc-950`. Deliberately not a colour
 * picker: an arbitrary hex would let a guild wear something that reads as
 * "error" or vanishes into the page background — which is also why there is
 * no red here, only Crimson a step towards pink.
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
    id: "accent:ivory",
    slot: "accent",
    name: "Ivory",
    blurb: "Almost white. Reads before anything else on the board.",
    hex: "#e4e4e7",
  },
  {
    id: "accent:bone",
    slot: "accent",
    name: "Bone",
    blurb: "Warm grey, like an old pickguard.",
    hex: "#d6d3d1",
  },
  {
    id: "accent:signal",
    slot: "accent",
    name: "Signal",
    blurb: "The app's own cyan.",
    hex: "#22d3ee",
  },
  {
    id: "accent:sky",
    level: 1,
    slot: "accent",
    name: "Sky",
    blurb: "Lighter and cooler than Cobalt.",
    hex: "#38bdf8",
  },
  {
    id: "accent:cobalt",
    level: 2,
    slot: "accent",
    name: "Cobalt",
    blurb: "Deep blue, cold as a rehearsal room in February.",
    hex: "#60a5fa",
  },
  {
    id: "accent:indigo",
    level: 3,
    slot: "accent",
    name: "Indigo",
    blurb: "Blue, leaning violet.",
    hex: "#818cf8",
  },
  {
    id: "accent:nightshade",
    level: 7,
    slot: "accent",
    name: "Nightshade",
    blurb: "Violet — the rare tier's colour.",
    hex: "#a78bfa",
  },
  {
    id: "accent:neon",
    level: 9,
    slot: "accent",
    name: "Neon",
    blurb: "Fuchsia. Nothing else on the board looks like it.",
    hex: "#e879f9",
  },
  {
    id: "accent:bubblegum",
    level: 11,
    slot: "accent",
    name: "Bubblegum",
    blurb: "Pink, and unapologetic.",
    hex: "#f472b6",
  },
  {
    id: "accent:crimson",
    level: 13,
    slot: "accent",
    name: "Crimson",
    blurb: "Loud, and nobody else on the board is wearing it.",
    hex: "#fb7185",
  },
  {
    id: "accent:ember",
    level: 16,
    slot: "accent",
    name: "Ember",
    blurb: "Streak orange, for a guild that never misses.",
    hex: "#fb923c",
  },
  {
    id: "accent:brass",
    level: 20,
    slot: "accent",
    name: "Brass",
    blurb: "Fame's own gold.",
    hex: "#fbbf24",
  },
  {
    id: "accent:sulphur",
    level: 24,
    slot: "accent",
    name: "Sulphur",
    blurb: "Yellow, a shade sharper than Brass.",
    hex: "#facc15",
  },
  {
    id: "accent:acid",
    level: 28,
    slot: "accent",
    name: "Acid",
    blurb: "Lime. Loud in a different way to Crimson.",
    hex: "#a3e635",
  },
  {
    id: "accent:verdant",
    level: 5,
    slot: "accent",
    name: "Verdant",
    blurb: "Green, the colour of a week cleared.",
    hex: "#34d399",
  },
  {
    id: "accent:lagoon",
    level: 4,
    slot: "accent",
    name: "Lagoon",
    blurb: "Teal, between the app's cyan and a week cleared.",
    hex: "#2dd4bf",
  },
];

/** The strip across the top of the guild's card. Drawn from the accent, never its own colour. */
export const GUILD_BANNERS: GuildCosmeticItem[] = [
  {
    id: "banner:none",
    slot: "banner",
    name: "Bare",
    blurb: "No colour at all — just your icons on the plain strip.",
  },
  {
    id: "banner:wash",
    slot: "banner",
    name: "Wash",
    blurb:
      "Corner to corner: the colour laid in from the top left, thinning out towards the bottom right.",
  },
  {
    id: "banner:aurora",
    level: 3,
    slot: "banner",
    name: "Aurora",
    blurb: "Left to right through the colour's two neighbours.",
  },
  {
    id: "banner:sunburst",
    level: 6,
    slot: "banner",
    name: "Sunburst",
    blurb: "Dark along the top, the colour gathering towards the bottom edge.",
  },
  {
    id: "banner:stage",
    level: 10,
    slot: "banner",
    name: "Dusk",
    blurb:
      "From the colour at the top right into its cooler neighbour at the bottom left.",
  },
  {
    id: "banner:halo",
    level: 15,
    slot: "banner",
    name: "Fade",
    blurb: "Out of the dark on the left and into the colour on the right.",
  },
];

/** How the picker lays the icons out: one row of tiles per group, in this order. */
export const MOTIF_GROUPS = [
  { id: "instruments", label: "Instruments" },
  { id: "beasts", label: "Beasts" },
  { id: "arms", label: "Arms" },
  { id: "elements", label: "Elements" },
  { id: "things", label: "Everything else" },
] as const;

export type MotifGroup = (typeof MOTIF_GROUPS)[number]["id"];

/**
 * The icons a founder may tile across the banner. Keys rather than component
 * names, because the key is what is written to the guild document and read
 * back by the server, which must never have to know what an icon is. Which
 * drawing each key means lives in `motifIcons.ts`, client-side — all of them
 * from the Game Icons set, so a guild's four are drawn in one hand.
 *
 * The instruments are free from the start — a band's own kit, and the group
 * the default four are drawn from. Every other group unlocks icon by icon as
 * the guild levels up (see `level`, and `unlockLevel` in
 * `guildCosmetics.utils.ts`): a motif's own required level is the highest of
 * its four icons', worked out in `findCosmetic` below.
 */
export const MOTIF_ICONS = [
  { key: "guitar", label: "Guitar", group: "instruments" },
  { key: "bass", label: "Bass headstock", group: "instruments" },
  { key: "headstock", label: "Headstock", group: "instruments" },
  { key: "notes", label: "Notes", group: "instruments" },
  { key: "score", label: "Score", group: "instruments" },
  { key: "mic", label: "Microphone", group: "instruments" },
  { key: "oldmic", label: "Old microphone", group: "instruments" },
  { key: "speaker", label: "Speaker", group: "instruments" },
  { key: "headphones", label: "Headphones", group: "instruments" },
  { key: "drum", label: "Drum", group: "instruments" },
  { key: "drumkit", label: "Drum kit", group: "instruments" },
  { key: "piano", label: "Piano keys", group: "instruments" },
  { key: "keyboard", label: "Keyboard", group: "instruments" },
  { key: "trombone", label: "Trombone", group: "instruments" },
  { key: "cassette", label: "Cassette", group: "instruments" },
  { key: "vinyl", label: "Record", group: "instruments" },
  { key: "horn", label: "Horn", group: "instruments" },
  { key: "metalhand", label: "Horns up", group: "instruments" },

  { key: "skull", label: "Skull", group: "beasts", level: 2 },
  {
    key: "crossbones",
    label: "Skull and crossbones",
    group: "beasts",
    level: 4,
  },
  { key: "bones", label: "Crossed bones", group: "beasts", level: 5 },
  { key: "pirate", label: "Pirate skull", group: "beasts", level: 7 },
  { key: "burning", label: "Burning skull", group: "beasts", level: 8 },
  { key: "dragon", label: "Dragon", group: "beasts", level: 10 },
  { key: "wolf", label: "Wolf", group: "beasts", level: 12 },
  { key: "howl", label: "Howling wolf", group: "beasts", level: 13 },
  { key: "werewolf", label: "Werewolf", group: "beasts", level: 15 },
  { key: "raven", label: "Raven", group: "beasts", level: 16 },
  { key: "eagle", label: "Eagle", group: "beasts", level: 18 },
  { key: "lion", label: "Lion", group: "beasts", level: 20 },
  { key: "tiger", label: "Tiger", group: "beasts", level: 21 },
  { key: "bear", label: "Bear", group: "beasts", level: 23 },
  { key: "bull", label: "Bull", group: "beasts", level: 24 },
  { key: "snake", label: "Snake", group: "beasts", level: 26 },
  { key: "spider", label: "Spider", group: "beasts", level: 27 },
  { key: "web", label: "Spider web", group: "beasts", level: 29 },
  { key: "bat", label: "Bat", group: "beasts", level: 31 },
  { key: "owl", label: "Owl", group: "beasts", level: 32 },
  { key: "cat", label: "Cat", group: "beasts", level: 34 },
  { key: "shark", label: "Shark", group: "beasts", level: 35 },
  { key: "octopus", label: "Octopus", group: "beasts", level: 37 },
  { key: "scorpion", label: "Scorpion", group: "beasts", level: 39 },
  { key: "reaper", label: "Reaper", group: "beasts", level: 40 },
  { key: "ghost", label: "Ghost", group: "beasts", level: 42 },
  { key: "devil", label: "Devil", group: "beasts", level: 43 },
  { key: "robot", label: "Robot", group: "beasts", level: 45 },

  { key: "crown", label: "Crown", group: "arms", level: 2 },
  { key: "imperial", label: "Imperial crown", group: "arms", level: 4 },
  { key: "laurel", label: "Laurel crown", group: "arms", level: 5 },
  { key: "swords", label: "Crossed swords", group: "arms", level: 7 },
  { key: "sword", label: "Sword", group: "arms", level: 8 },
  { key: "axes", label: "Crossed axes", group: "arms", level: 10 },
  { key: "battleaxe", label: "Battle axe", group: "arms", level: 12 },
  { key: "hammer", label: "Hammer", group: "arms", level: 13 },
  { key: "warhammer", label: "Warhammer", group: "arms", level: 15 },
  { key: "shield", label: "Shield", group: "arms", level: 16 },
  { key: "spartan", label: "Spartan helmet", group: "arms", level: 18 },
  { key: "viking", label: "Viking helmet", group: "arms", level: 19 },
  { key: "knight", label: "Knight's helm", group: "arms", level: 21 },
  { key: "samurai", label: "Samurai helmet", group: "arms", level: 23 },
  { key: "hornedhelm", label: "Horned helm", group: "arms", level: 24 },
  { key: "castle", label: "Castle", group: "arms", level: 26 },
  { key: "banner", label: "Banner", group: "arms", level: 27 },
  { key: "pirateflag", label: "Pirate flag", group: "arms", level: 29 },
  { key: "fist", label: "Fist", group: "arms", level: 31 },
  { key: "anarchy", label: "Anarchy", group: "arms", level: 32 },
  { key: "wings", label: "Wings", group: "arms", level: 34 },
  { key: "angelwings", label: "Angel wings", group: "arms", level: 35 },
  { key: "bullseye", label: "Bullseye", group: "arms", level: 37 },
  { key: "bomb", label: "Bomb", group: "arms", level: 38 },
  { key: "key", label: "Skeleton key", group: "arms", level: 40 },

  { key: "flame", label: "Flame", group: "elements", level: 2 },
  { key: "candle", label: "Candle", group: "elements", level: 4 },
  { key: "campfire", label: "Campfire", group: "elements", level: 6 },
  { key: "lightning", label: "Lightning", group: "elements", level: 7 },
  { key: "storm", label: "Storm", group: "elements", level: 9 },
  { key: "sun", label: "Sun", group: "elements", level: 11 },
  { key: "moon", label: "Moon", group: "elements", level: 13 },
  { key: "star", label: "Star", group: "elements", level: 15 },
  { key: "shuriken", label: "Shuriken", group: "elements", level: 17 },
  { key: "comet", label: "Comet", group: "elements", level: 18 },
  { key: "crystal", label: "Crystal ball", group: "elements", level: 20 },
  { key: "potion", label: "Potion", group: "elements", level: 22 },

  { key: "heart", label: "Winged heart", group: "things", level: 2 },
  { key: "rose", label: "Rose and dagger", group: "things", level: 4 },
  { key: "beer", label: "Beer", group: "things", level: 6 },
  { key: "drinkinghorn", label: "Drinking horn", group: "things", level: 8 },
  { key: "coffee", label: "Coffee", group: "things", level: 10 },
  { key: "anvil", label: "Anvil", group: "things", level: 12 },
  { key: "gears", label: "Gears", group: "things", level: 14 },
  { key: "dice", label: "Dice", group: "things", level: 16 },
  { key: "trophy", label: "Trophy", group: "things", level: 18 },
  { key: "rocket", label: "Rocket", group: "things", level: 20 },
  { key: "compass", label: "Compass", group: "things", level: 22 },
  { key: "anchor", label: "Anchor", group: "things", level: 24 },
] as const satisfies readonly {
  key: string;
  label: string;
  group: MotifGroup;
  /** The guild level that unlocks it. Missing means free from the start. */
  level?: number;
}[];

export type MotifIconKey = (typeof MOTIF_ICONS)[number]["key"];

const MOTIF_KEYS = new Set<string>(MOTIF_ICONS.map((icon) => icon.key));

/** A motif is always exactly this many icons: one per slot in the tile. */
export const MOTIF_SIZE = 4;

const MOTIF_PREFIX = "motif:";

/** The id a set of four icons is worn under, e.g. `motif:guitar.notes.metalhand.headphones`. */
export const motifId = (keys: readonly MotifIconKey[]): string =>
  `${MOTIF_PREFIX}${keys.join(".")}`;

/**
 * The four keys inside a motif id, or null for anything that is not exactly
 * four known keys. This is the whole of the server's validation for the slot,
 * so it is strict: a fifth icon, a key nobody has heard of, an empty segment —
 * all of them are "not a motif" rather than "close enough".
 */
export const motifKeys = (id: unknown): MotifIconKey[] | null => {
  if (typeof id !== "string" || !id.startsWith(MOTIF_PREFIX)) return null;
  const keys = id.slice(MOTIF_PREFIX.length).split(".");
  if (keys.length !== MOTIF_SIZE) return null;
  if (!keys.every((key) => MOTIF_KEYS.has(key))) return null;
  return keys as MotifIconKey[];
};

// `icon.level` rather than a plain property read: `as const` keeps each
// literal's own narrow type, so an icon defined without the field is a type
// that does not have it at all, and the union needs a guard to read it.
const MOTIF_ICON_LEVEL = new Map<string, number>(
  MOTIF_ICONS.map((icon) => [icon.key, "level" in icon ? icon.level : 0]),
);

/** The level one icon needs on its own, or 0 for one free from the start. */
export const motifIconLevel = (key: MotifIconKey): number =>
  MOTIF_ICON_LEVEL.get(key) ?? 0;

/** A set of four is only as free as its least free icon — the highest of the four. */
const motifLevel = (keys: readonly MotifIconKey[]): number =>
  keys.reduce((max, key) => Math.max(max, motifIconLevel(key)), 0);

const motifName = (keys: readonly MotifIconKey[]): string =>
  keys
    .map((key) => MOTIF_ICONS.find((icon) => icon.key === key)?.label ?? key)
    .join(" · ");

/**
 * The one motif in the catalog by name: what every guild starts with. Every
 * other combination of four is made up on the spot by `findCosmetic` — there
 * are tens of millions of them, and a list would be the wrong shape for that.
 */
export const DEFAULT_MOTIF_KEYS: MotifIconKey[] = [
  "guitar",
  "notes",
  "metalhand",
  "headphones",
];

export const GUILD_MOTIFS: GuildCosmeticItem[] = [
  {
    id: motifId(DEFAULT_MOTIF_KEYS),
    slot: "motif",
    name: motifName(DEFAULT_MOTIF_KEYS),
    blurb: "The set every guild starts with.",
    icons: DEFAULT_MOTIF_KEYS,
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
    id: "frame:double",
    level: 2,
    slot: "frame",
    name: "Double",
    blurb: "Two thin rings, with a hair of dark between them.",
  },
  {
    id: "frame:plate",
    level: 4,
    slot: "frame",
    name: "Plate",
    blurb: "Filled, so the tag reads first on a busy row.",
  },
  {
    id: "frame:heavy",
    level: 20,
    slot: "frame",
    name: "Heavy",
    blurb: "Filled and ringed. The loudest a tag gets.",
  },
  {
    id: "frame:solid",
    level: 15,
    slot: "frame",
    name: "Solid",
    blurb: "A block of the colour with the tag cut out of it in black.",
  },
  {
    id: "frame:pill",
    level: 6,
    slot: "frame",
    name: "Pill",
    blurb: "Filled and fully rounded, like a button that never does anything.",
  },
  {
    id: "frame:sunken",
    level: 12,
    slot: "frame",
    name: "Sunken",
    blurb: "Cut into the row: a dark slot with the tag in the colour.",
  },
  {
    id: "frame:brackets",
    level: 10,
    slot: "frame",
    name: "Brackets",
    blurb: "A bar of the colour down each side of the tag.",
  },
  {
    id: "frame:dot",
    level: 8,
    slot: "frame",
    name: "Dot",
    blurb:
      "A dot of the colour before the tag, the way a status light sits before a name.",
  },
];

export const GUILD_COSMETICS: GuildCosmeticItem[] = [
  ...GUILD_ACCENTS,
  ...GUILD_BANNERS,
  ...GUILD_MOTIFS,
  ...GUILD_FRAMES,
];

export const COSMETIC_SLOTS: {
  slot: CosmeticSlot;
  label: string;
  /** What the slot is for, said once above its row rather than on every tile. */
  blurb: string;
  /**
   * Everything that can be worn in the slot. Empty for the motif, which is
   * picked four icons at a time rather than off a row of tiles.
   */
  items: GuildCosmeticItem[];
}[] = [
  {
    slot: "accent",
    label: "Colour",
    blurb:
      "The one the rest of the kit is drawn from — change it and the banner, the icons and the frame follow.",
    items: GUILD_ACCENTS,
  },
  {
    slot: "banner",
    label: "Banner",
    blurb:
      "The strip across the top of your card, in the guild list and on this page.",
    items: GUILD_BANNERS,
  },
  {
    slot: "motif",
    label: "Icons",
    blurb: "The four icons tiled across the banner. Any four you like.",
    items: [],
  },
  {
    slot: "frame",
    label: "Tag",
    blurb: "How your tag is drawn next to every member's name on the board.",
    items: GUILD_FRAMES,
  },
];

const BY_ID = new Map(GUILD_COSMETICS.map((item) => [item.id, item]));

/**
 * The item behind an id. Catalog first; failing that, a motif is put together
 * from its four keys, so any valid set of four is as wearable as the default.
 */
export const findCosmetic = (id: unknown): GuildCosmeticItem | null => {
  if (typeof id !== "string") return null;
  const listed = BY_ID.get(id);
  if (listed) return listed;

  const keys = motifKeys(id);
  if (!keys) return null;
  const level = motifLevel(keys);
  return {
    id,
    slot: "motif",
    name: motifName(keys),
    blurb: "Your own four.",
    icons: keys,
    // Undefined rather than 0, so a set built entirely of free icons reads as
    // "no level" the same way every other free item in the catalog does.
    ...(level > 0 && { level }),
  };
};

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
  motif: GUILD_MOTIFS[0],
  frame: GUILD_FRAMES[0],
};
