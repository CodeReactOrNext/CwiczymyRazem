import {
  STUDIO_BOARD_AWARDS,
  STUDIO_BOARD_CORK,
  STUDIO_BOARD_PODIUM,
  STUDIO_ITEM_COSTS,
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_ROOM_COSTS,
  STUDIO_ROOM_LEVELS,
} from "feature/guilds/data/guildStudio";
import type { GuildStudio } from "feature/guilds/utils/guildStudio.utils";
import {
  awardNumber,
  BOARD_NOTE_RATIO,
  boardNotes,
  checkItemUpgrade,
  checkRoomUpgrade,
  EMPTY_STUDIO,
  podiumFor,
  studioPerks,
  studioProgress,
  upgradeItem,
  upgradeRoom,
} from "feature/guilds/utils/guildStudio.utils";
import { describe, expect, it } from "vitest";

const at = (partial: Partial<GuildStudio>): GuildStudio => ({
  ...EMPTY_STUDIO,
  ...partial,
});

describe("guild studio catalog", () => {
  it("has unique ids and a name for every level", () => {
    const ids = STUDIO_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of STUDIO_ITEMS)
      expect(item.levels).toHaveLength(STUDIO_MAX_ITEM_LEVEL);
  });

  it("prices one step per level and one per room upgrade", () => {
    expect(STUDIO_ITEM_COSTS).toHaveLength(STUDIO_MAX_ITEM_LEVEL);
    expect(STUDIO_ROOM_COSTS).toHaveLength(STUDIO_ROOM_LEVELS.length - 1);
  });
});

describe("item upgrades", () => {
  it("builds a piece and takes the price from the bank", () => {
    const result = upgradeItem(EMPTY_STUDIO, "amp", 50_000);
    expect(result?.studio.items.amp).toBe(1);
    expect(result?.bank).toBe(50_000 - STUDIO_ITEM_COSTS[0]);
  });

  it("refuses when the bank is short and says by how much", () => {
    expect(checkItemUpgrade(EMPTY_STUDIO, "amp", 40)).toEqual({
      ok: false,
      reason: "bank",
      cost: STUDIO_ITEM_COSTS[0],
      short: STUDIO_ITEM_COSTS[0] - 40,
    });
    expect(upgradeItem(EMPTY_STUDIO, "amp", 40)).toBeNull();
  });

  it("caps gear at the room level", () => {
    const studio = at({ roomLevel: 1, items: { amp: 1 } });
    expect(checkItemUpgrade(studio, "amp", 1e6)).toMatchObject({
      ok: false,
      reason: "room",
      roomLevel: 2,
    });
    expect(checkItemUpgrade({ ...studio, roomLevel: 2 }, "amp", 1e6).ok).toBe(
      true,
    );
  });

  it("stops at the top level", () => {
    const studio = at({ roomLevel: 4, items: { amp: STUDIO_MAX_ITEM_LEVEL } });
    expect(checkItemUpgrade(studio, "amp", 1e6)).toEqual({
      ok: false,
      reason: "maxed",
    });
  });

  it("ignores unknown ids", () => {
    expect(upgradeItem(EMPTY_STUDIO, "kazoo", 1e6)).toBeNull();
  });
});

describe("room upgrades", () => {
  it("climbs to the last room and no further", () => {
    let state = { studio: EMPTY_STUDIO, bank: 1e8 };
    for (let i = 1; i < STUDIO_ROOM_LEVELS.length; i++) {
      const next = upgradeRoom(state.studio, state.bank);
      expect(next).not.toBeNull();
      state = next!;
    }
    expect(state.studio.roomLevel).toBe(STUDIO_ROOM_LEVELS.length);
    expect(checkRoomUpgrade(state.studio, state.bank)).toEqual({
      ok: false,
      reason: "maxed",
    });
  });
});

describe("perks and progress", () => {
  it("sums every piece into its perk", () => {
    const perks = studioPerks(
      at({ roomLevel: 4, items: { amp: 2, drums: 1, desk: 4, bench: 1 } }),
    );
    expect(perks).toEqual({
      fameRate: 3,
      questFame: 10,
      commissionDiscount: 2.5,
    });
  });

  it("counts built levels out of all of them", () => {
    expect(
      studioProgress(at({ roomLevel: 2, items: { amp: 2, mic: 1 } })),
    ).toEqual({ built: 3, total: STUDIO_ITEMS.length * STUDIO_MAX_ITEM_LEVEL });
  });
});

describe("weekly board", () => {
  const person = (
    name: string,
    stats: Partial<Record<string, number>> = {},
  ) => ({
    member: { uid: name.toLowerCase(), displayName: name },
    hours: 0,
    sessions: 0,
    streak: 0,
    points: 0,
    ...stats,
  });
  const week = [
    person("Ola", { hours: 3, sessions: 4, streak: 2, points: 120 }),
    person("Kasia", { hours: 6.5, sessions: 4, streak: 9, points: 340 }),
    person("Tom", { hours: 4.25, sessions: 7 }),
    person("Ben", { hours: 1 }),
    person("Idle"),
  ];

  it("pins nothing until the board is built", () => {
    expect(boardNotes(week, 0)).toEqual([]);
  });

  it("adds one category per level, in order", () => {
    for (let level = 1; level <= STUDIO_BOARD_AWARDS.length; level++)
      expect(boardNotes(week, level).map((note) => note.award.stat)).toEqual(
        STUDIO_BOARD_AWARDS.slice(0, level).map((award) => award.stat),
      );
  });

  it("ranks the week best first, drops zeros, breaks ties by name", () => {
    expect(
      podiumFor(week, "hours").map((entry) => entry.member.displayName),
    ).toEqual(["Kasia", "Tom", "Ola"]);
    expect(
      podiumFor(week, "sessions").map((entry) => entry.member.displayName),
    ).toEqual(["Tom", "Kasia", "Ola"]);
    expect(podiumFor(week, "points")).toHaveLength(2);
    expect(podiumFor([], "hours")).toEqual([]);
    expect(podiumFor(week, "hours").length).toBeLessThanOrEqual(
      STUDIO_BOARD_PODIUM,
    );
  });

  it("keeps every note on the cork", () => {
    for (let level = 1; level <= STUDIO_BOARD_AWARDS.length; level++) {
      const cork = STUDIO_BOARD_CORK[level - 1];
      for (const note of boardNotes(week, level)) {
        const halfWidth = note.width / 2;
        const halfHeight = (note.width * BOARD_NOTE_RATIO) / 2;
        expect(note.x - halfWidth).toBeGreaterThanOrEqual(cork.left);
        expect(note.x + halfWidth).toBeLessThanOrEqual(cork.right);
        expect(note.y - halfHeight).toBeGreaterThanOrEqual(cork.top);
        expect(note.y + halfHeight).toBeLessThanOrEqual(cork.bottom);
      }
    }
  });

  it("writes hours to the tenth and everything else whole", () => {
    expect(awardNumber("hours", 4.25, "en")).toBe("4.3");
    expect(awardNumber("streak", 9, "en")).toBe("9");
    expect(awardNumber("points", 12345.6, "en")).toBe("12,346");
  });
});
