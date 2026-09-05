import { PART_TIERS, PARTS_BY_ID } from "feature/arsenal/data/partDefinitions";
import { describe, expect, it } from "vitest";

import type { BpmProgressMap } from "../types/scaleTree.types";
import { SCALE_TREE_POSITIONS } from "./scaleTreeNodes";
import {
  BOX_LADDERS,
  boxRewardId,
  getBoxCompletion,
  getBoxNodes,
  getBoxReward,
  getScaleNodes,
  isFinaleBox,
} from "./scaleTreeRewards";

const SCALES = Object.keys(SCALE_TREE_POSITIONS);

const boxesOf = (scaleType: string) => SCALE_TREE_POSITIONS[scaleType];
const lastBoxOf = (scaleType: string) => boxesOf(scaleType).at(-1)!;

/** Every required exercise of one box, logged at exactly its target tempo. */
const clearedBox = (scaleType: string, position: number): BpmProgressMap => {
  const progress: BpmProgressMap = new Map();
  for (const node of getBoxNodes(scaleType, position)) {
    for (const req of node.requiredExercises) {
      progress.set(req.exerciseId, [req.requiredBpm]);
    }
  }
  return progress;
};

describe("getBoxReward", () => {
  it("prices every box of every tree", () => {
    for (const scaleType of SCALES) {
      for (const position of boxesOf(scaleType)) {
        expect(
          getBoxReward(scaleType, position),
          `${scaleType}@${position}`,
        ).not.toBeNull();
      }
    }
  });

  it("returns nothing for a fret the tree has no box at", () => {
    expect(getBoxReward("minor_pentatonic", 99)).toBeNull();
  });

  it("returns nothing for a scale with no tree", () => {
    expect(getBoxReward("not_a_scale", 8)).toBeNull();
  });

  it("pays the same thing every time it is asked", () => {
    const position = boxesOf("minor_pentatonic")[0];
    expect(getBoxReward("minor_pentatonic", position)).toEqual(
      getBoxReward("minor_pentatonic", position),
    );
  });

  it("climbs: every box is worth more than the one before it", () => {
    for (const scaleType of SCALES) {
      const fame = boxesOf(scaleType).map(
        (position) => getBoxReward(scaleType, position)!.fame,
      );
      expect(fame, scaleType).toEqual([...fame].sort((a, b) => a - b));
      expect(new Set(fame).size, scaleType).toBe(fame.length);
    }
  });

  it("pays one free case per tree, on the box that finishes it", () => {
    for (const scaleType of SCALES) {
      const withCase = boxesOf(scaleType).filter(
        (position) => getBoxReward(scaleType, position)!.caseTokens > 0,
      );
      expect(withCase, scaleType).toEqual([lastBoxOf(scaleType)]);
    }
  });

  it("gives each box of a tree its own parts", () => {
    const drawn = boxesOf("minor_pentatonic").map(
      (position) => getBoxReward("minor_pentatonic", position)!.parts[0].partId,
    );
    expect(new Set(drawn).size).toBeGreaterThan(1);
  });

  it("never hands out a part above the grade it can reach", () => {
    for (const scaleType of SCALES) {
      for (const position of boxesOf(scaleType)) {
        for (const part of getBoxReward(scaleType, position)!.parts) {
          const def = PARTS_BY_ID.get(part.partId);
          expect(def, `${part.partId} is not a real part`).toBeDefined();
          expect(PART_TIERS.indexOf(def!.maxTier)).toBeGreaterThanOrEqual(
            PART_TIERS.indexOf(part.tier),
          );
        }
      }
    }
  });

  it("saves its best parts for the box that finishes the tree", () => {
    const scaleType = "minor_pentatonic";
    const finale = getBoxReward(scaleType, lastBoxOf(scaleType))!;
    const first = getBoxReward(scaleType, boxesOf(scaleType)[0])!;

    const bestTier = (parts: typeof finale.parts) =>
      Math.max(...parts.map((part) => PART_TIERS.indexOf(part.tier)));

    expect(bestTier(finale.parts)).toBeGreaterThan(bestTier(first.parts));
  });

  it("runs on a ladder that starts every family at the same rung", () => {
    for (const scaleType of SCALES) {
      const firstBox = boxesOf(scaleType)[0];
      const family = getBoxNodes(scaleType, firstBox)[0].scaleFamily;
      expect(getBoxReward(scaleType, firstBox)!.fame).toBe(
        BOX_LADDERS[family].baseFame,
      );
    }
  });
});

describe("isFinaleBox", () => {
  it("is true only for the last box of a tree", () => {
    for (const scaleType of SCALES) {
      const positions = boxesOf(scaleType);
      expect(isFinaleBox(scaleType, positions.at(-1)!), scaleType).toBe(true);
      expect(isFinaleBox(scaleType, positions[0]), scaleType).toBe(false);
    }
  });

  it("is false for a fret with no box", () => {
    expect(isFinaleBox("minor_pentatonic", 99)).toBe(false);
  });
});

describe("boxRewardId", () => {
  it("is unique per box across every tree", () => {
    const ids = SCALES.flatMap((scaleType) =>
      boxesOf(scaleType).map((position) => boxRewardId(scaleType, position)),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  // The retired React Flow tree filed its row rewards under
  // `<scale>_pos<fret>_reward` in a different field; nothing collected there
  // may be read as one of these.
  it("does not reuse the retired node id", () => {
    expect(boxRewardId("min_pent", 8)).not.toBe("min_pent_pos8_reward");
  });
});

describe("getBoxNodes", () => {
  it("holds one box's worth of shapes, and not the gateway", () => {
    const boxNodes = getBoxNodes(
      "minor_pentatonic",
      boxesOf("minor_pentatonic")[0],
    );
    expect(boxNodes).toHaveLength(7);
    expect(boxNodes.some((node) => node.id.includes("single_string"))).toBe(
      false,
    );
  });

  it("splits the tree into its boxes and the gateway, with nothing left over", () => {
    for (const scaleType of SCALES) {
      const inBoxes = boxesOf(scaleType).reduce(
        (sum, position) => sum + getBoxNodes(scaleType, position).length,
        0,
      );
      expect(inBoxes + 1, scaleType).toBe(getScaleNodes(scaleType).length);
    }
  });
});

describe("getBoxCompletion", () => {
  it("is unfinished on a blank record", () => {
    const position = boxesOf("minor_pentatonic")[0];
    expect(getBoxCompletion("minor_pentatonic", position, new Map())).toEqual({
      done: 0,
      total: 7,
      isComplete: false,
    });
  });

  it("closes once every shape in the row has a clean run on record", () => {
    for (const scaleType of SCALES) {
      for (const position of boxesOf(scaleType)) {
        const completion = getBoxCompletion(
          scaleType,
          position,
          clearedBox(scaleType, position),
        );
        expect(completion.isComplete, `${scaleType}@${position}`).toBe(true);
        expect(completion.done).toBe(completion.total);
      }
    }
  });

  it("does not close a row on a shape with no clean run", () => {
    const scaleType = "minor_pentatonic";
    const position = boxesOf(scaleType)[0];
    const progress = clearedBox(scaleType, position);
    const [firstReq] = getBoxNodes(scaleType, position)[0].requiredExercises;
    progress.set(firstReq.exerciseId, []);

    const completion = getBoxCompletion(scaleType, position, progress);
    expect(completion.isComplete).toBe(false);
    expect(completion.done).toBeLessThan(completion.total);
  });

  // The bar is the lower of the current target and the one the exercise had
  // before the tempo bump, so a run logged under the old rules still clears it.
  it("still counts a run logged at a retired, lower target", () => {
    const scaleType = "minor_pentatonic";
    const position = boxesOf(scaleType).find((pos) =>
      getBoxNodes(scaleType, pos).some((node) =>
        node.requiredExercises.some((req) => req.legacyRequiredBpm != null),
      ),
    );
    expect(position, "no exercise carries a legacy target any more").toBeDefined();

    const progress = clearedBox(scaleType, position!);
    for (const node of getBoxNodes(scaleType, position!)) {
      for (const req of node.requiredExercises) {
        if (req.legacyRequiredBpm != null) {
          progress.set(req.exerciseId, [req.legacyRequiredBpm]);
        }
      }
    }

    expect(getBoxCompletion(scaleType, position!, progress).isComplete).toBe(
      true,
    );
  });

  it("knows nothing about a fret with no box", () => {
    expect(getBoxCompletion("minor_pentatonic", 99, new Map())).toEqual({
      done: 0,
      total: 0,
      isComplete: false,
    });
  });
});
