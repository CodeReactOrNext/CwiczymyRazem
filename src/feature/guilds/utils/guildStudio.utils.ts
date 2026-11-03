import type {
  StudioBoardAward,
  StudioBoardStat,
  StudioItem,
  StudioPerk,
  StudioZone,
} from "feature/guilds/data/guildStudio";
import {
  STUDIO_BOARD_AWARDS,
  STUDIO_BOARD_CORK,
  STUDIO_BOARD_PODIUM,
  STUDIO_ITEM_COSTS,
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_MAX_ROOM_LEVEL,
  STUDIO_ROOM_COSTS,
} from "feature/guilds/data/guildStudio";
import type { GuildMember } from "feature/guilds/types/guild.types";

/**
 * Pure rules for the guild studio, kept apart from any storage so the dev
 * preview and a future API transaction apply the very same ones.
 */

export interface GuildStudio {
  /** 1 → STUDIO_MAX_ROOM_LEVEL; every guild starts in level 1. */
  roomLevel: number;
  /** Level per item id; a missing id is level 0, i.e. not built. */
  items: Record<string, number>;
}

export const EMPTY_STUDIO: GuildStudio = {
  roomLevel: 1,
  items: {},
};

export type UpgradeCheck =
  | { ok: true; cost: number }
  | { ok: false; reason: "maxed" }
  | { ok: false; reason: "room"; cost: number; roomLevel: number }
  | { ok: false; reason: "bank"; cost: number; short: number };

export const itemLevel = (studio: GuildStudio, id: string): number =>
  studio.items[id] ?? 0;

/** The room's level is the highest level any piece of gear can reach. */
export const itemCap = (roomLevel: number): number =>
  Math.min(roomLevel, STUDIO_MAX_ITEM_LEVEL);

/** Fame for the next level of a piece at `level`, or null at the top. */
export const itemUpgradeCost = (level: number): number | null =>
  level >= STUDIO_MAX_ITEM_LEVEL ? null : STUDIO_ITEM_COSTS[level];

/** Fame for the next room level, or null at the top. */
export const roomUpgradeCost = (roomLevel: number): number | null =>
  roomLevel >= STUDIO_MAX_ROOM_LEVEL ? null : STUDIO_ROOM_COSTS[roomLevel - 1];

export const checkItemUpgrade = (
  studio: GuildStudio,
  id: string,
  bank: number,
): UpgradeCheck => {
  const level = itemLevel(studio, id);
  const cost = itemUpgradeCost(level);
  if (cost === null) return { ok: false, reason: "maxed" };
  if (level >= itemCap(studio.roomLevel))
    return { ok: false, reason: "room", cost, roomLevel: level + 1 };
  if (bank < cost)
    return { ok: false, reason: "bank", cost, short: cost - bank };
  return { ok: true, cost };
};

export const checkRoomUpgrade = (
  studio: GuildStudio,
  bank: number,
): UpgradeCheck => {
  const cost = roomUpgradeCost(studio.roomLevel);
  if (cost === null) return { ok: false, reason: "maxed" };
  if (bank < cost)
    return { ok: false, reason: "bank", cost, short: cost - bank };
  return { ok: true, cost };
};

export interface UpgradeResult {
  studio: GuildStudio;
  bank: number;
}

/** Applies an item upgrade, or returns null when the check refuses it. */
export const upgradeItem = (
  studio: GuildStudio,
  id: string,
  bank: number,
): UpgradeResult | null => {
  if (!STUDIO_ITEMS.some((item) => item.id === id)) return null;
  const check = checkItemUpgrade(studio, id, bank);
  if (!check.ok) return null;
  return {
    studio: {
      ...studio,
      items: { ...studio.items, [id]: itemLevel(studio, id) + 1 },
    },
    bank: bank - check.cost,
  };
};

export const upgradeRoom = (
  studio: GuildStudio,
  bank: number,
): UpgradeResult | null => {
  const check = checkRoomUpgrade(studio, bank);
  if (!check.ok) return null;
  return {
    studio: { ...studio, roomLevel: studio.roomLevel + 1 },
    bank: bank - check.cost,
  };
};

export const perkAt = (item: StudioItem, level: number): number =>
  item.perLevel * level;

/** What the whole studio pays every member, summed per perk. */
export const studioPerks = (
  studio: GuildStudio,
): Record<StudioPerk, number> => {
  const totals: Record<StudioPerk, number> = {
    fameRate: 0,
    questFame: 0,
    commissionDiscount: 0,
  };
  for (const item of STUDIO_ITEMS)
    totals[item.perk] += perkAt(item, itemLevel(studio, item.id));
  return totals;
};

/** A spot on the board's cork: its centre and width in frame pixels. */
export interface BoardSpot {
  x: number;
  y: number;
  width: number;
  rotate: number;
}

/** One member's week, as the host counts it (Monday to now). */
export interface WeeklyMemberStats<M> extends Record<StudioBoardStat, number> {
  member: M;
}

/** What the studio endpoint answers with. */
export interface GuildStudioView {
  studio: GuildStudio;
  /** The guild treasury's Fame, which is what the studio is bought with. */
  bank: number;
  week: WeeklyMemberStats<GuildMember>[];
  /** Monday 00:00 UTC, as an ISO string. */
  weekStart: string;
}

export interface BoardNote<M> extends BoardSpot {
  award: StudioBoardAward;
  /** Best first; only members with something to show, at most the podium. */
  podium: { member: M; value: number }[];
}

/** Sticky notes are square. */
export const BOARD_NOTE_RATIO = 1;

/** A small steady number from an id, so a note keeps its tilt between visits. */
const jitter = (id: string, salt: number): number => {
  let hash = salt;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash >>> 0) % 1000) / 1000 - 0.5;
};

/** One spot per id on the cork, on the grid that makes them biggest. */
const boardSpots = (ids: readonly string[], cork: StudioZone): BoardSpot[] => {
  const count = ids.length;
  const corkWidth = cork.right - cork.left;
  const corkHeight = cork.bottom - cork.top;
  let best = { cols: 1, rows: count, width: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const width = Math.min(
      corkWidth / cols,
      corkHeight / rows / BOARD_NOTE_RATIO,
    );
    if (width > best.width) best = { cols, rows, width };
  }
  const { cols, rows } = best;
  const cellWidth = corkWidth / cols;
  const cellHeight = corkHeight / rows;
  return ids.map((id, index) => {
    const row = Math.floor(index / cols);
    // A short last row sits in the middle rather than hugging the left edge.
    const inRow = row === rows - 1 ? count - row * cols : cols;
    const col = index - row * cols + (cols - inRow) / 2;
    return {
      x: cork.left + (col + 0.5) * cellWidth + jitter(id, 1) * cellWidth * 0.08,
      y:
        cork.top + (row + 0.5) * cellHeight + jitter(id, 2) * cellHeight * 0.08,
      width: best.width * 0.82,
      rotate: jitter(id, 3) * 8,
    };
  });
};

/** The week's best at one stat: nobody on zero, ties by name. */
export const podiumFor = <M extends { uid: string; displayName: string }>(
  week: readonly WeeklyMemberStats<M>[],
  stat: StudioBoardStat,
): { member: M; value: number }[] =>
  week
    .map((entry) => ({
      member: entry.member,
      value: Math.max(0, Number(entry[stat]) || 0),
    }))
    .filter((entry) => entry.value > 0)
    .sort(
      (a, b) =>
        b.value - a.value ||
        a.member.displayName.localeCompare(b.member.displayName, undefined, {
          sensitivity: "base",
        }) ||
        a.member.uid.localeCompare(b.member.uid),
    )
    .slice(0, STUDIO_BOARD_PODIUM);

/**
 * The weekly board at this level: one sticky note per category it has
 * unlocked (a level-n board has the first n), each with the week's podium,
 * laid out on the cork as big as it allows and a little crooked the way a
 * hand pins them. Empty below level 1.
 */
export const boardNotes = <M extends { uid: string; displayName: string }>(
  week: readonly WeeklyMemberStats<M>[],
  level: number,
): BoardNote<M>[] => {
  if (level < 1) return [];
  const cork = STUDIO_BOARD_CORK[Math.min(level, STUDIO_BOARD_CORK.length) - 1];
  const awards = STUDIO_BOARD_AWARDS.slice(0, level);
  const spots = boardSpots(
    awards.map((award) => award.stat),
    cork,
  );
  return awards.map((award, i) => ({
    award,
    podium: podiumFor(week, award.stat),
    ...spots[i],
  }));
};

/**
 * A stat's number as the board writes it: hours to the tenth, the rest whole,
 * with thousands grouped. The unit around it is the translation's business.
 */
export const awardNumber = (
  stat: StudioBoardStat,
  value: number,
  locale?: string,
): string =>
  (stat === "hours"
    ? Math.round(value * 10) / 10
    : Math.round(value)
  ).toLocaleString(locale);

/** Gear levels built out of every level there is, for the room's bar. */
export const studioProgress = (
  studio: GuildStudio,
): { built: number; total: number } => ({
  built: STUDIO_ITEMS.reduce(
    (sum, item) => sum + itemLevel(studio, item.id),
    0,
  ),
  total: STUDIO_ITEMS.length * STUDIO_MAX_ITEM_LEVEL,
});

const PERK_FORMAT: Record<StudioPerk, (amount: string) => string> = {
  fameRate: (amount) => `+${amount} Fame/h`,
  questFame: (amount) => `+${amount}% quest Fame`,
  commissionDiscount: (amount) => `−${amount}% commissions`,
};

export const formatPerk = (perk: StudioPerk, value: number): string =>
  PERK_FORMAT[perk](Number.isInteger(value) ? String(value) : value.toFixed(1));
