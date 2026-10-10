import type {
  ComponentDef,
  ComponentRarity,
  ComponentSlot,
  PickupType,
} from "../types/guitarBuilder.types";
import type { FinishStyle } from "../utils/paint";

/**
 * Every component a player can roll, and the level range each slot rolls in.
 *
 * A component's rarity is fixed per model (like a guitar's); its level is rolled
 * once, inside that rarity's range, when the copy drops. A built guitar's level
 * is the sum of what's bolted on, so the ranges are sized against what case
 * guitars actually land at today — a full set of one rarity sums to about the
 * average level of a case guitar of that rarity (Common ~14 … Mythic ~63).
 */
export const COMPONENT_LEVELS: Record<
  ComponentSlot,
  Partial<Record<ComponentRarity, [number, number]>>
> = {
  // Wide on purpose: two copies of the same part can differ a lot, so a
  // lucky roll is worth chasing. The midpoints are what keep a full set of a
  // rarity summing to about a case guitar of that rarity.
  body: {
    Common: [1, 7],
    Uncommon: [2, 9],
    Rare: [3, 12],
    Epic: [5, 16],
    Legendary: [8, 21],
    Mythic: [11, 27],
  },
  pickups: {
    Common: [1, 6],
    Uncommon: [2, 8],
    Rare: [3, 10],
    Epic: [4, 13],
    Legendary: [6, 18],
    Mythic: [9, 23],
  },
  neck: {
    Common: [1, 5],
    Uncommon: [1, 7],
    Rare: [2, 8],
    Epic: [3, 11],
    Legendary: [5, 14],
    Mythic: [7, 18],
  },
  finish: {
    Common: [1, 4],
    Uncommon: [1, 5],
    Rare: [1, 7],
    Epic: [2, 8],
    Legendary: [3, 11],
    Mythic: [5, 14],
  },
  head: {
    Common: [1, 2],
    Uncommon: [1, 3],
    Rare: [1, 4],
    Epic: [2, 5],
    Legendary: [3, 7],
    Mythic: [4, 9],
  },
  pickguard: {
    Common: [1, 2],
    Uncommon: [1, 3],
    Rare: [1, 3],
    Epic: [2, 4],
  },
  sticker: {
    Common: [1, 2],
    Uncommon: [1, 3],
    Rare: [1, 3],
    Epic: [2, 4],
    Legendary: [2, 5],
  },
};

/** Only the best few stickers count toward the level — the rest are looks. */
export const STICKERS_COUNTED = 3;

const body = (
  partKey: string,
  name: string,
  rarity: ComponentRarity,
  routing: PickupType,
  source: string,
): ComponentDef => ({
  id: `body:${partKey}`,
  slot: "body",
  partKey,
  name,
  rarity,
  routing,
  source,
});

const neck = (
  partKey: string,
  name: string,
  rarity: ComponentRarity,
): ComponentDef => ({
  id: `neck:${partKey}`,
  slot: "neck",
  partKey,
  name,
  rarity,
});

const head = (
  partKey: string,
  name: string,
  rarity: ComponentRarity,
): ComponentDef => ({
  id: `head:${partKey}`,
  slot: "head",
  partKey,
  name,
  rarity,
});

const pickups = (
  key: string,
  name: string,
  rarity: ComponentRarity,
  type: PickupType,
  cover: string,
  /** a chrome/nickel/gold cover that glints; otherwise moulded plastic */
  metal = false,
): ComponentDef => ({
  id: `pickups:${key}`,
  slot: "pickups",
  name,
  rarity,
  type,
  cover,
  metal,
});

const finish = (
  key: string,
  name: string,
  rarity: ComponentRarity,
  color: string,
  extra: {
    top?: string;
    burst?: boolean;
    burstColor?: string;
    style?: FinishStyle;
  } = {},
): ComponentDef => ({
  id: `finish:${key}`,
  slot: "finish",
  name,
  rarity,
  color,
  top: extra.top ?? null,
  burst: extra.burst ?? Boolean(extra.burstColor),
  burstColor: extra.burstColor ?? null,
  style: extra.style ?? "gloss",
});

const pickguard = (
  key: string,
  name: string,
  rarity: ComponentRarity,
  color: string,
): ComponentDef => ({
  id: `pickguard:${key}`,
  slot: "pickguard",
  name,
  rarity,
  color,
});

const sticker = (
  stickerKey: string,
  name: string,
  rarity: ComponentRarity,
): ComponentDef => ({
  id: `sticker:${stickerKey}`,
  slot: "sticker",
  stickerKey,
  name,
  rarity,
});

export const COMPONENT_DEFS: ComponentDef[] = [
  // ─── Bodies — rarity by look; `source` is the Arsenal guitar it was cut from
  body("s-style", "S-Style Burst", "Common", "S", "Fairmont Stratocaster"),
  body(
    "single-cut",
    "Single-Cut",
    "Common",
    "H",
    "Louis Carver Luther Sovereign",
  ),
  body(
    "t-style-coral",
    "T-Style Coral",
    "Uncommon",
    "S",
    "Fairmont Tidecaster",
  ),
  body("superstrat", "Superstrat", "Uncommon", "H", "Izanor RZXX-200"),
  body("double-cut", "Double-Cut", "Uncommon", "H", "Grayson Sabre"),
  body("offset", "Offset", "Uncommon", "H", "Fairmont Bluewave"),
  body("t-style", "T-Style", "Rare", "S", "Fairmont Tidecaster"),
  body(
    "s-style-green",
    "S-Style",
    "Rare",
    "S",
    "Fairmont Stratocaster Racing Green",
  ),
  body(
    "offset-seafoam",
    "Offset Relic",
    "Epic",
    "P90",
    "Driftwood Seafoam Wanderer",
  ),
  body("semi-hollow", "Semi-Hollow", "Epic", "H", "Velmora Crimson Archtop"),
  body(
    "superstrat-flame",
    "Superstrat Flame",
    "Legendary",
    "H",
    "Fairmont Super Starter",
  ),
  body(
    "carved-double-cut",
    "Carved Double-Cut",
    "Legendary",
    "H",
    "RPS Monarch Private Stock Aviary",
  ),
  body("x-style", "X-Style", "Mythic", "H", "Grayson Warhead Crimson"),

  // ─── Pickups — the cover colour shows on the guitar; type must fit the routing
  pickups("stock-singles", "Stock Ceramic Singles", "Common", "S", "#f1efe8"),
  pickups(
    "stock-humbuckers",
    "Stock Ceramic Humbuckers",
    "Common",
    "H",
    "#18181a",
  ),
  pickups("stock-soapbars", "Stock Soapbars", "Common", "P90", "#18181a"),
  pickups(
    "vintage-singles",
    "Vintage Alnico Singles",
    "Uncommon",
    "S",
    "#e6dcc2",
  ),
  pickups("hot-humbuckers", "Hot Humbuckers", "Uncommon", "H", "#c8cacf", true),
  pickups("noiseless-singles", "Noiseless Singles", "Rare", "S", "#18181a"),
  pickups("paf-style", "Vintage PAF-style", "Rare", "H", "#bdb8a8", true),
  pickups("dog-ear", "Dog-ear P90s", "Rare", "P90", "#e6d9bb"),
  pickups("hand-wound-singles", "Hand-wound Singles", "Epic", "S", "#cfe3cf"),
  pickups("active-high-gain", "Active High-Gain", "Epic", "H", "#8f1d1d"),
  pickups("staple-p90", "Staple P90s", "Epic", "P90", "#f4f0e4"),
  pickups(
    "masterbuilt-singles",
    "Masterbuilt Singles",
    "Legendary",
    "S",
    "#c9a24a",
    true,
  ),
  pickups(
    "boutique-pafs",
    "Low-wind Boutique PAFs",
    "Legendary",
    "H",
    "#c9a24a",
    true,
  ),
  pickups("prototype-57", "Prototype '57 Set", "Mythic", "H", "#d79f8a", true),

  // ─── Necks
  neck("rosewood-trapezoid", "Rosewood · trapezoids", "Common"),
  neck("maple-dots", "Maple · dots", "Common"),
  neck("rosewood-dots", "Rosewood · dots", "Uncommon"),
  neck("maple-blocks", "Maple · blocks", "Rare"),
  neck("ebony-blocks", "Ebony · blocks", "Epic"),
  neck("maple-vines", "Maple · vine inlays", "Epic"),
  neck("ebony-sharks", "Ebony · abalone", "Legendary"),
  neck("ebony-birds", "Ebony · birds", "Mythic"),

  // ─── Headstocks
  head("three-three", "Three a side", "Common"),
  head("six-inline", "Six in line", "Common"),
  head("offset", "Offset", "Uncommon"),
  head("pointy-reverse", "Pointy · maple", "Rare"),
  head("carved", "Carved", "Epic"),
  head("three-three-black", "Three a side · black", "Legendary"),
  head("pointy", "Pointy · flame", "Mythic"),

  // ─── Finishes — colour, figure and burst roll together as one item
  finish("black", "Black", "Common", "#151517"),
  finish("vintage-white", "Vintage White", "Common", "#efe9d8"),
  finish("candy-red", "Candy Red", "Common", "#b3141f"),
  finish("silver", "Silver", "Common", "#b9bcc2"),
  finish("racing-green", "Racing Green", "Uncommon", "#1f6b40"),
  finish("deep-blue", "Deep Blue", "Uncommon", "#2a4f94"),
  finish("yellow", "Yellow", "Uncommon", "#f0c419"),
  finish("orange", "Orange", "Uncommon", "#e2701c"),
  finish("coral", "Coral", "Uncommon", "#e8645a"),
  finish("seafoam", "Seafoam", "Rare", "#8fd3b6"),
  finish("ice-blue", "Ice Blue", "Rare", "#8fc1d4"),
  finish("shell-pink", "Shell Pink", "Rare", "#f2b8b5"),
  finish("teal", "Teal", "Rare", "#0f6e73"),
  finish("purple", "Purple", "Rare", "#6b2fa0"),
  finish("tobacco-burst", "Tobacco Burst", "Epic", "#c8781e", { burst: true }),
  finish("cherry-burst", "Cherry Burst", "Epic", "#b3141f", { burst: true }),
  finish("blue-burst", "Blue Burst", "Epic", "#2a4f94", { burst: true }),
  finish("amber-flame", "Amber Flame", "Legendary", "#c8781e", {
    top: "flame",
    burst: true,
  }),
  finish("purple-flame", "Purple Flame", "Legendary", "#6b2fa0", {
    top: "flame",
    burst: true,
  }),
  finish("teal-quilt", "Teal Quilt", "Legendary", "#0f6e73", { top: "quilt" }),
  finish("ocean-quilt", "Ocean Quilt", "Mythic", "#2a4f94", {
    top: "quilt",
    burst: true,
  }),
  finish("dragon-flame", "Dragon Flame", "Mythic", "#b3141f", {
    top: "flame",
    burst: true,
  }),

  // ─── Woods — natural oil/clear coats and see-through colour over grain
  finish("natural-mahogany", "Natural Mahogany", "Common", "#7a3b22", {
    top: "mahogany",
  }),
  finish("natural-ash", "Natural Ash", "Uncommon", "#d9b98a", { top: "ash" }),
  finish("butterscotch", "Butterscotch Blonde", "Uncommon", "#e0a64a", {
    top: "ash",
  }),
  finish("korina", "Natural Korina", "Uncommon", "#e8cf8f", {
    top: "mahogany",
  }),
  finish("natural-walnut", "Natural Walnut", "Rare", "#5a3a24", {
    top: "walnut",
  }),
  finish("trans-blue-ash", "Trans Blue Ash", "Rare", "#2f6db5", { top: "ash" }),
  finish("trans-cherry", "Trans Cherry Mahogany", "Rare", "#9b1c1c", {
    top: "mahogany",
  }),
  finish("birdseye", "Birdseye Natural", "Epic", "#e2c28a", {
    top: "birdseye",
  }),
  finish("spalted", "Spalted Maple", "Epic", "#e6d6b4", { top: "spalted" }),
  finish("koa", "Natural Koa", "Epic", "#a8642b", { top: "koa", burst: true }),
  finish("redwood-burl", "Redwood Burl", "Legendary", "#8a3b1f", {
    top: "burl",
    burst: true,
  }),

  // ─── Paint styles
  finish("satin-black", "Satin Black", "Common", "#151517", { style: "satin" }),
  finish("satin-olive", "Satin Olive Drab", "Uncommon", "#59613a", {
    style: "satin",
  }),
  finish("satin-white", "Satin White", "Uncommon", "#e8e4da", {
    style: "satin",
  }),
  finish("gunmetal", "Gunmetal Metallic", "Uncommon", "#4a4f57", {
    style: "metallic",
  }),
  finish("lake-placid", "Lake Placid Metallic", "Rare", "#4d7fb8", {
    style: "metallic",
  }),
  finish("candy-apple", "Candy Apple Metallic", "Rare", "#b0101a", {
    style: "metallic",
  }),
  finish("gold-metallic", "Gold Top Metallic", "Rare", "#c9a24a", {
    style: "metallic",
  }),
  finish("silver-sparkle", "Silver Sparkle", "Epic", "#b9bcc2", {
    style: "sparkle",
  }),
  finish("purple-sparkle", "Purple Sparkle", "Epic", "#6b2fa0", {
    style: "sparkle",
  }),
  finish("red-sparkle", "Red Sparkle", "Epic", "#b3141f", { style: "sparkle" }),
  finish("pearl-white", "Pearl White", "Epic", "#efe9e4", { style: "pearl" }),
  finish("three-tone-burst", "Three-tone Sunburst", "Epic", "#e8b13a", {
    burstColor: "#a0201a",
  }),
  finish("gold-sparkle", "Gold Sparkle", "Legendary", "#d4a63c", {
    style: "sparkle",
  }),
  finish("pearl-blue", "Pearl Blue", "Legendary", "#8fb4d9", {
    style: "pearl",
  }),
  finish("chameleon", "Chameleon", "Mythic", "#6b2fa0", { style: "chameleon" }),
  finish("midnight-sparkle", "Midnight Sparkle Burst", "Mythic", "#1f3a8a", {
    style: "sparkle",
    burst: true,
  }),

  // ─── Pickguards — only bodies with a white guard can take one
  pickguard("white", "White", "Common", "#f4f2ec"),
  pickguard("black", "Black", "Common", "#18181a"),
  pickguard("parchment", "Parchment", "Uncommon", "#e6d9bb"),
  pickguard("mint", "Mint", "Rare", "#cfe3cf"),
  pickguard("red", "Red", "Epic", "#a3241f"),

  // ─── Stickers
  sticker("smiley", "Smiley", "Common"),
  sticker("heart", "Heart", "Common"),
  sticker("star", "Star", "Common"),
  sticker("note", "Note", "Uncommon"),
  sticker("bolt", "Bolt", "Uncommon"),
  sticker("flame", "Flame", "Rare"),
  sticker("skull", "Skull", "Rare"),
  sticker("shred", "Shred", "Epic"),
];

/** Stash icon of a pickup set — rendered by scripts/guitarBuilder/renderIcons.mjs. */
export const pickupIconSrc = (id: string) =>
  `/images/guitar-builder/pickups/${id.replace("pickups:", "")}.webp`;

/** Stash icon of a finish — the same script, a whole body painted with it. */
export const finishIconSrc = (id: string) =>
  `/images/guitar-builder/finishes/${id.replace("finish:", "")}.webp`;

export const COMPONENTS_BY_ID = new Map(
  COMPONENT_DEFS.map((def) => [def.id, def]),
);

export const SLOT_LABELS: Record<ComponentSlot, string> = {
  body: "Body",
  neck: "Neck",
  head: "Headstock",
  pickups: "Pickups",
  finish: "Finish",
  pickguard: "Pickguard",
  sticker: "Stickers",
};

export const PICKUP_TYPE_LABELS: Record<PickupType, string> = {
  S: "Single-coil",
  H: "Humbucker",
  P90: "P90",
};
