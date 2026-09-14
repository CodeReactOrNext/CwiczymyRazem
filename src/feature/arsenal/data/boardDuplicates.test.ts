import { describe, expect, it } from "vitest";

import type {
  EffectInventoryItem,
  PedalboardPlacement,
} from "../types/arsenal.types";
import {
  describeDuplicateCopy,
  describeDuplicateRule,
  DUPLICATE_LEVEL_SHARES,
  duplicateShareOf,
  formatDuplicateShare,
  modelOf,
  readBoardLevel,
} from "./boardDuplicates";
import { EFFECT_DEFINITIONS, EFFECTS_BY_ID } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";

/** A pedal minted in a fixed state, so its level is the same on every run. */
const pedal = (
  id: string,
  effectId: number | string,
  extra: Partial<EffectInventoryItem> = {},
): EffectInventoryItem => ({
  id,
  effectId,
  acquiredAt: 0,
  isNew: false,
  condition: 0.9,
  year: 2020,
  country: "Japan",
  ...extra,
});

const levelOf = (item: EffectInventoryItem) =>
  getEffectLevel(item, EFFECTS_BY_ID.get(item.effectId)!);

const boardOf = (ids: string[]): PedalboardPlacement[] =>
  ids.map((itemId, index) => ({ itemId, xPct: 80 - index * 12, yPct: 10 }));

// Three different pedals, two of them near-namesakes with their own art.
const TS808 = 2;
const STELLAR = 6;
const ASTRAL = 14;
const ASTRAL_VERDANT = 24;

describe("the share table", () => {
  it("counts the best copy in full, the second half, and the rest nothing", () => {
    expect(DUPLICATE_LEVEL_SHARES).toEqual([1, 0.5, 0]);
    expect(duplicateShareOf(0)).toBe(1);
    expect(duplicateShareOf(1)).toBe(0.5);
    expect(duplicateShareOf(2)).toBe(0);
    // Past the table, the last entry — a tenth copy is worth what a third is.
    expect(duplicateShareOf(9)).toBe(0);
    expect(duplicateShareOf(-1)).toBe(1);
  });

  it("prints the shares the way the board marks them", () => {
    expect(formatDuplicateShare(1)).toBeNull();
    expect(formatDuplicateShare(0.5)).toBe("½");
    expect(formatDuplicateShare(0)).toBe("0");
  });

  it("reads the rule off the table, so the copy cannot drift from it", () => {
    expect(describeDuplicateRule()).toBe(
      "The best copy counts in full, the second half, any more nothing.",
    );
  });
});

describe("modelOf", () => {
  it("is the definition's own id, so every catalogue entry is its own pedal", () => {
    expect(modelOf(EFFECTS_BY_ID.get(ASTRAL)!)).toBe(ASTRAL);
    expect(modelOf(EFFECTS_BY_ID.get(ASTRAL_VERDANT)!)).toBe(ASTRAL_VERDANT);
  });

  it("tells every pedal in the catalogue apart", () => {
    const models = new Set(EFFECT_DEFINITIONS.map(modelOf));
    expect(models.size).toBe(EFFECT_DEFINITIONS.length);
  });
});

describe("readBoardLevel", () => {
  it("scores a board of different models as a plain sum", () => {
    const stash = [pedal("a", TS808), pedal("b", STELLAR), pedal("c", ASTRAL)];
    const board = readBoardLevel(boardOf(["a", "b", "c"]), stash);
    const sum = stash.reduce((total, item) => total + levelOf(item), 0);
    expect(board.level).toBe(sum);
    expect(board.fullLevel).toBe(sum);
    expect(board.penalty).toBe(0);
    expect(board.duplicates).toEqual([]);
    for (const item of stash) {
      expect(board.copies.get(item.id)).toMatchObject({
        index: 0,
        share: 1,
        counted: levelOf(item),
      });
    }
  });

  it("counts the second copy of a model at half and the third at nothing", () => {
    const best = pedal("best", TS808, {
      stats: { tone: 9, headroom: 0, versatility: 0 },
    });
    const second = pedal("second", TS808, {
      stats: { tone: 4, headroom: 0, versatility: 0 },
    });
    const third = pedal("third", TS808);
    const board = readBoardLevel(
      // Dropped in the worst-first order, to show the ranking is by level.
      boardOf(["third", "second", "best"]),
      [best, second, third],
    );

    const halfOfSecond = Math.round(levelOf(second) / 2);
    expect(board.level).toBe(levelOf(best) + halfOfSecond);
    expect(board.fullLevel).toBe(
      levelOf(best) + levelOf(second) + levelOf(third),
    );
    expect(board.penalty).toBe(levelOf(second) - halfOfSecond + levelOf(third));

    expect(board.copies.get("best")).toMatchObject({ index: 0, share: 1 });
    expect(board.copies.get("second")).toMatchObject({
      index: 1,
      share: 0.5,
      counted: halfOfSecond,
    });
    expect(board.copies.get("third")).toMatchObject({
      index: 2,
      share: 0,
      counted: 0,
    });

    expect(board.duplicates).toHaveLength(1);
    expect(board.duplicates[0]).toMatchObject({
      model: TS808,
      name: "TS-808 Overdrive",
      penalty: board.penalty,
    });
    expect(board.duplicates[0].copies.map((copy) => copy.itemId)).toEqual([
      "best",
      "second",
      "third",
    ]);
  });

  it("never charges the first copy, so removing the extra restores the full sum", () => {
    const stash = [pedal("a", ASTRAL), pedal("b", ASTRAL)];
    const withTwin = readBoardLevel(boardOf(["a", "b"]), stash);
    const alone = readBoardLevel(boardOf(["a"]), stash);
    expect(withTwin.penalty).toBeGreaterThan(0);
    expect(alone.penalty).toBe(0);
    expect(alone.level).toBe(levelOf(stash[0]));
    // The twin is worth less than itself, never less than nothing.
    expect(withTwin.level).toBeGreaterThan(alone.level);
    expect(withTwin.level).toBeLessThan(alone.level + levelOf(stash[1]));
  });

  it("treats two near-namesakes with their own art as different pedals", () => {
    const stash = [pedal("green", ASTRAL_VERDANT), pedal("plain", ASTRAL)];
    const board = readBoardLevel(boardOf(["green", "plain"]), stash);
    expect(board.duplicates).toEqual([]);
    expect(board.penalty).toBe(0);
    expect(board.level).toBe(board.fullLevel);
  });

  it("treats a promoted copy as the same model, and as the better one", () => {
    // Nine builds is three promotions: a Common TS-808 minted as Common, now
    // Epic. The ladder changes what a copy is worth, never what it is.
    const promoted = pedal("promoted", TS808, { buildLevel: 9 });
    const plain = pedal("plain", TS808);
    const board = readBoardLevel(boardOf(["plain", "promoted"]), [
      promoted,
      plain,
    ]);
    expect(levelOf(promoted)).toBeGreaterThan(levelOf(plain));
    expect(board.copies.get("promoted")).toMatchObject({ index: 0, share: 1 });
    expect(board.copies.get("plain")).toMatchObject({ index: 1, share: 0.5 });
  });

  it("does not call two different models of one kind duplicates", () => {
    const stash = [pedal("a", TS808), pedal("b", STELLAR)];
    const board = readBoardLevel(boardOf(["a", "b"]), stash);
    expect(board.duplicates).toEqual([]);
    expect(board.penalty).toBe(0);
  });

  it("leaves an unpowered copy out of the count altogether", () => {
    // Two copies, one dark: the dark one is out of the rig, so the lit one is
    // the only copy — and counts in full.
    const stash = [pedal("a", TS808), pedal("b", TS808)];
    const board = readBoardLevel(
      boardOf(["a", "b"]),
      stash,
      (id) => id === "a",
    );
    expect(board.duplicates).toEqual([]);
    expect(board.level).toBe(levelOf(stash[0]));
    expect(board.copies.has("b")).toBe(false);
  });

  it("keeps board order between copies of equal level", () => {
    const stash = [pedal("first", TS808), pedal("later", TS808)];
    expect(levelOf(stash[0])).toBe(levelOf(stash[1]));
    const board = readBoardLevel(boardOf(["first", "later"]), stash);
    expect(board.copies.get("first")?.index).toBe(0);
    expect(board.copies.get("later")?.index).toBe(1);
  });

  it("lists the model that lost the most first", () => {
    const stash = [
      pedal("cheap-1", TS808),
      pedal("cheap-2", TS808),
      pedal("dear-1", ASTRAL),
      pedal("dear-2", ASTRAL),
    ];
    const board = readBoardLevel(
      boardOf(["cheap-1", "cheap-2", "dear-1", "dear-2"]),
      stash,
    );
    expect(board.duplicates.map((group) => group.model)).toEqual([
      ASTRAL,
      TS808,
    ]);
  });

  it("scores an empty or missing board as nothing", () => {
    expect(readBoardLevel([], []).level).toBe(0);
    expect(readBoardLevel(undefined, []).penalty).toBe(0);
    // A placement whose pedal has left the stash is skipped, not scored.
    expect(readBoardLevel(boardOf(["gone"]), []).level).toBe(0);
  });
});

describe("describeDuplicateCopy", () => {
  it("names the copy, the model and what it adds", () => {
    const stash = [pedal("a", TS808), pedal("b", TS808), pedal("c", TS808)];
    const board = readBoardLevel(boardOf(["a", "b", "c"]), stash);
    const second = board.copies.get("b")!;
    const third = board.copies.get("c")!;
    expect(describeDuplicateCopy(second, "TS-808 Overdrive")).toContain(
      "second TS-808 Overdrive on the board — it adds half its level",
    );
    expect(describeDuplicateCopy(third, "TS-808 Overdrive")).toContain(
      "third TS-808 Overdrive on the board — it adds nothing",
    );
  });

  it("tells the best copy it is the one to keep, not the one costing levels", () => {
    const stash = [pedal("a", TS808), pedal("b", TS808)];
    const board = readBoardLevel(boardOf(["a", "b"]), stash);
    const best = board.copies.get("a")!;

    const line = describeDuplicateCopy(best, "TS-808 Overdrive");
    expect(line).toContain("2 copies of TS-808 Overdrive");
    expect(line).toContain("counts in full");
  });
});

describe("what marks a copy", () => {
  it("carries the model and the size of its group on every copy", () => {
    const stash = [pedal("a", TS808), pedal("b", TS808), pedal("c", STELLAR)];
    const board = readBoardLevel(boardOf(["a", "b", "c"]), stash);

    expect(board.copies.get("a")).toMatchObject({ model: TS808, total: 2 });
    expect(board.copies.get("b")).toMatchObject({ model: TS808, total: 2 });
    // A pedal standing alone is its own group of one, so nothing marks it.
    expect(board.copies.get("c")).toMatchObject({ model: STELLAR, total: 1 });
  });

  it("counts only the powered copies towards the group", () => {
    const stash = [pedal("a", TS808), pedal("b", TS808)];
    const board = readBoardLevel(
      boardOf(["a", "b"]),
      stash,
      (itemId) => itemId === "a",
    );

    expect(board.copies.get("a")).toMatchObject({ total: 1 });
    expect(board.copies.has("b")).toBe(false);
  });
});
