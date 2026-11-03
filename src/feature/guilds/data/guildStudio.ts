import ART from "feature/guilds/data/guildStudioArt.json";
import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  CassetteTape,
  Drum,
  Hammer,
  Images,
  LayoutGrid,
  Mic,
  Pin,
  SlidersHorizontal,
  Sofa,
  Speaker,
} from "lucide-react";

/**
 * The guild studio: one room the whole guild fits out together.
 *
 * Deliberately one shape for everything. The room has a level, every piece of
 * gear in it has a level, and both are bought from the guild's Fame bank —
 * no materials, no timers, no second currency. The room's level is the cap on
 * the gear: a garage holds a level-1 amp, a pro studio holds a full stack. So
 * the room is the thing a guild saves up for, and the gear is what it spends
 * on in between.
 *
 * It is drawn as a scene seen from the front, laid out like a real rehearsal
 * room: the kit against the back wall with the vocal mic in front of it and
 * the wall above it for posters and records (the "walls" piece), an
 * engineer's corner (tape, desk, monitors, panels above), a sofa along the
 * left wall, the members' board and the amp up front, a repair corner at
 * the front left. Every sprite was drawn by the model *inside* the empty room
 * and cut back out, so it already has the room's perspective, scale, light
 * and its own shadow; where it goes comes with the art (guildStudioArt.json).
 *
 * The board in the middle is the one piece the members fill just by playing:
 * once it is built, it pins up the week's top three, one note per category,
 * and every level adds a category.
 */

export const STUDIO_MAX_ITEM_LEVEL = 4;
export const STUDIO_MAX_ROOM_LEVEL = 4;

/** What a piece of gear pays every member while the guild owns it. */
export type StudioPerk = "fameRate" | "questFame" | "commissionDiscount";

/**
 * The frame every placement is measured in: the room art's own pixels. The
 * rooms are generated from one another, so they share the frame and a piece
 * stays on the same patch of floor whatever the room level.
 */
export const STUDIO_SCENE = { width: 1536, height: 1024 } as const;

/** Where a sprite sits in the frame, cut from the render it was drawn in. */
export interface StudioArtBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface StudioZone {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface StudioItem {
  id: string;
  name: string;
  /** Stand-in for the sprite until the art exists. */
  icon: LucideIcon;
  perk: StudioPerk;
  /** Perk per level: Fame/h for fameRate, percent for the other two. */
  perLevel: number;
  /** One name per level, 1 → 4. */
  levels: readonly [string, string, string, string];
  /**
   * The piece's own patch of the room, in frame pixels. Every level's sprite
   * is fitted into it (bottom-centred, never scaled up unless `maxScale`
   * says so), so pieces bought at different levels never run into each
   * other. Wall pieces sit in the middle of theirs (`center`); the board
   * fits all its levels with one scale (`together`) so its cork stays put.
   */
  zone: StudioZone;
  fit?: { center?: boolean; together?: boolean; maxScale?: number };
}

export const STUDIO_BOARD_ID = "board";

export const STUDIO_ITEMS: readonly StudioItem[] = [
  {
    id: STUDIO_BOARD_ID,
    name: "Weekly board",
    icon: Pin,
    perk: "fameRate",
    perLevel: 1,
    levels: [
      "Cork board",
      "Board and ledge",
      "Fairy-lit board",
      "Showcase board",
    ],
    zone: { left: 600, top: 585, right: 940, bottom: 925 },
    fit: { together: true },
  },
  {
    id: "amp",
    name: "Amp",
    icon: Speaker,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Practice combo", "Tube combo", "Half stack", "Full stack"],
    zone: { left: 1030, top: 600, right: 1220, bottom: 880 },
  },
  {
    id: "drums",
    name: "Drum kit",
    icon: Drum,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Practice pad", "Used kit", "Full kit", "Studio kit"],
    zone: { left: 430, top: 290, right: 720, bottom: 565 },
  },
  {
    id: "mic",
    name: "Microphone",
    icon: Mic,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Dynamic mic", "Boom stand", "Condenser", "Vintage tube mic"],
    zone: { left: 418, top: 570, right: 508, bottom: 870 },
  },
  {
    id: "monitors",
    name: "Monitors",
    icon: AudioLines,
    perk: "fameRate",
    perLevel: 1,
    levels: [
      "Desk speakers",
      "Near-fields",
      "Monitors on stands",
      "Main monitors",
    ],
    zone: { left: 1092, top: 380, right: 1235, bottom: 595 },
  },
  {
    id: "panels",
    name: "Acoustic panels",
    icon: LayoutGrid,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Foam squares", "Foam wedges", "Fabric panels", "Treated room"],
    zone: { left: 840, top: 95, right: 1115, bottom: 335 },
    fit: { center: true },
  },
  {
    id: "walls",
    name: "Walls",
    icon: Images,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Gig posters", "Framed records", "Gallery wall", "Wall of fame"],
    zone: { left: 430, top: 100, right: 700, bottom: 290 },
    fit: { center: true },
  },
  {
    id: "sofa",
    name: "Sofa",
    icon: Sofa,
    perk: "fameRate",
    perLevel: 1,
    levels: ["Camping chair", "Old sofa", "Leather couch", "Lounge corner"],
    zone: { left: 175, top: 330, right: 425, bottom: 760 },
  },
  {
    id: "desk",
    name: "Mixing desk",
    icon: SlidersHorizontal,
    perk: "questFame",
    perLevel: 2.5,
    levels: ["Laptop", "Audio interface", "Small console", "Large console"],
    zone: { left: 846, top: 330, right: 1080, bottom: 578 },
  },
  {
    id: "tape",
    name: "Tape machine",
    icon: CassetteTape,
    perk: "questFame",
    perLevel: 2.5,
    levels: ["Cassette deck", "4-track", "Reel-to-reel", "2-inch tape machine"],
    zone: { left: 728, top: 370, right: 838, bottom: 560 },
  },
  {
    id: "bench",
    name: "Luthier bench",
    icon: Hammer,
    perk: "commissionDiscount",
    perLevel: 2.5,
    levels: ["Toolbox", "Workbench", "Bench with a vice", "Full luthier shop"],
    zone: { left: 120, top: 720, right: 430, bottom: 965 },
  },
];

/** One name per room level, 1 → 4. A guild starts with the first for free. */
export const STUDIO_ROOM_LEVELS = [
  "Garage",
  "Rehearsal space",
  "Project studio",
  "Pro studio",
] as const;

/**
 * Guild Fame to take a piece of gear from level `i` to `i + 1` (index 0 builds
 * it). The same for every piece, so the price is the level, not the piece.
 */
export const STUDIO_ITEM_COSTS = [100, 300, 800, 2000] as const;

/** Guild Fame to take the room from level `i + 1` to `i + 2`. */
export const STUDIO_ROOM_COSTS = [1500, 5000, 12000] as const;

/** What the weekly board ranks; a level-n board pins the first n. */
export type StudioBoardStat = "hours" | "sessions" | "streak" | "points";

export interface StudioBoardAward {
  stat: StudioBoardStat;
}

/** Titles live in the guilds namespace under `studio.awards.<stat>`. */
export const STUDIO_BOARD_AWARDS: readonly StudioBoardAward[] = [
  { stat: "hours" },
  { stat: "sessions" },
  { stat: "streak" },
  { stat: "points" },
];

/** How many make each note's podium. */
export const STUDIO_BOARD_PODIUM = 3;

/**
 * The cork on each level of the board, in frame pixels as the art was drawn
 * (the notes are laid out on it, then scale with the sprite). Levels 2-4
 * are edits of the first board, so the cork barely moves; the frames differ.
 */
export const STUDIO_BOARD_CORK: readonly StudioZone[] = [
  { left: 620, top: 522, right: 914, bottom: 750 },
  { left: 629, top: 530, right: 909, bottom: 727 },
  { left: 625, top: 540, right: 913, bottom: 745 },
  { left: 617, top: 523, right: 919, bottom: 748 },
];

/**
 * Art lives in `public/images/guild-studio/`: `room-<level>.webp` for the
 * room, `<id>-<level>.webp` for gear. A gear sprite exists exactly when its
 * placement is in guildStudioArt.json — anything missing draws a marker.
 */
const ART_BOXES: Partial<Record<string, StudioArtBox>> = ART;

const ROOMS_READY = new Set(["room-1", "room-2", "room-3", "room-4"]);

export const studioArtKey = (id: string, level: number): string =>
  `${id}-${level}`;

export const studioArtBox = (id: string, level: number): StudioArtBox | null =>
  ART_BOXES[studioArtKey(id, level)] ?? null;

/** All of a piece's sprites at once, for fitting them with one scale. */
const unionBox = (id: string): StudioArtBox | null => {
  const boxes = [1, 2, 3, 4]
    .map((level) => studioArtBox(id, level))
    .filter((box): box is StudioArtBox => box !== null);
  if (!boxes.length) return null;
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.left + box.width));
  const bottom = Math.max(...boxes.map((box) => box.top + box.height));
  return { left, top, width: right - left, height: bottom - top };
};

/** Where a piece's sprite at this level is drawn: its art box fitted into the piece's zone. */
export const studioArtPlacement = (
  item: StudioItem,
  level: number,
): StudioArtBox | null => {
  const art = studioArtBox(item.id, level);
  if (!art) return null;
  const { zone, fit = {} } = item;
  const ref = (fit.together && unionBox(item.id)) || art;
  const zoneWidth = zone.right - zone.left;
  const zoneHeight = zone.bottom - zone.top;
  const scale = Math.min(
    zoneWidth / ref.width,
    zoneHeight / ref.height,
    fit.maxScale ?? 1,
  );
  const refLeft = zone.left + (zoneWidth - ref.width * scale) / 2;
  const refTop = fit.center
    ? zone.top + (zoneHeight - ref.height * scale) / 2
    : zone.bottom - ref.height * scale;
  return {
    left: refLeft + (art.left - ref.left) * scale,
    top: refTop + (art.top - ref.top) * scale,
    width: art.width * scale,
    height: art.height * scale,
  };
};

/** Where an empty spot's marker goes: the foot of the zone, or its middle on a wall. */
export const studioMarkerSpot = ({
  zone,
  fit,
}: StudioItem): { x: number; y: number } => ({
  x: (zone.left + zone.right) / 2,
  y: fit?.center ? (zone.top + zone.bottom) / 2 : zone.bottom,
});

export const studioArtSrc = (id: string, level: number): string | null => {
  const key = studioArtKey(id, level);
  return ROOMS_READY.has(key) || ART_BOXES[key]
    ? `/images/guild-studio/${key}.webp`
    : null;
};
