import { describe, expect, it } from "vitest";

import type {
  ModOption,
  ModQuote,
  RecipeLine,
  WorkshopCheck,
} from "../data/workshop";
import type { PartId, PartTier } from "../types/arsenal.types";
import { describeBlocker, describeModBlocker } from "./workshopBlockers";

const line = (
  partId: PartId,
  tier: PartTier,
  need: number,
  have: number,
): RecipeLine => ({ partId, tier, need, have, ok: have >= need });

const check = (
  kind: WorkshopCheck["kind"],
  current: number,
  required: number,
): WorkshopCheck => ({
  kind,
  label: kind,
  current,
  required,
  ok: current >= required,
});

describe("describeBlocker", () => {
  it("says nothing when the job can run", () => {
    expect(
      describeBlocker([line("neck", "Epic", 2, 3)], [check("fame", 100, 10)]),
    ).toBeUndefined();
  });

  it("names the one missing part, pluralised", () => {
    expect(describeBlocker([line("neck", "Legendary", 4, 1)])).toBe(
      "3 more Legendary necks",
    );
    expect(describeBlocker([line("body", "Epic", 3, 1)])).toBe(
      "2 more Epic bodies",
    );
    expect(describeBlocker([line("screws", "Standard", 7, 6)])).toBe(
      "1 more Standard screw",
    );
  });

  it("leads with the biggest shortfall and counts the rest", () => {
    expect(
      describeBlocker([
        line("screws", "Standard", 8, 6),
        line("pickup", "Legendary", 6, 1),
      ]),
    ).toBe("5 more Legendary pickups, plus 1 other part");
  });

  it("puts the condition gate before the parts", () => {
    expect(
      describeBlocker(
        [line("neck", "Legendary", 4, 1)],
        [check("condition", 1, 3)],
      ),
    ).toMatch(/^restore it to /);
  });

  it("falls back to Fame once the parts are covered", () => {
    expect(
      describeBlocker([line("neck", "Epic", 1, 4)], [check("fame", 30, 80)]),
    ).toBe("needs 50 more fame");
  });
});

const modOption = (
  id: string,
  label: string,
  recipe: RecipeLine[],
): ModOption => ({
  id,
  label,
  min: 1,
  max: 7,
  parts: [],
  recipe,
  affordable: recipe.every((l) => l.ok),
});

const fittedMod = (
  id: string,
  label: string,
  recipe: RecipeLine[],
  points = 3,
): ModQuote["fitted"][number] => ({ ...modOption(id, label, recipe), points });

const modQuote = (over: Partial<ModQuote>): ModQuote => ({
  slots: { used: 0, max: 2, free: 2 },
  compatible: [],
  fitted: [],
  canReroll: false,
  canRemove: false,
  ...over,
});

describe("describeModBlocker", () => {
  it("says nothing while a re-roll is payable", () => {
    expect(describeModBlocker(modQuote({ canReroll: true }))).toBeUndefined();
  });

  it("sends the player to the stash when the instrument carries nothing", () => {
    // Fitting is not a parts problem any more, so there is no bill to name here.
    expect(describeModBlocker(modQuote({}))).toBe(
      "no mod in your stash fits this build",
    );
  });

  it("names the promotion when the slots are full and nothing is re-rollable", () => {
    // Slots used by features the pool no longer knows: nothing to re-roll, and
    // no room for anything out of the stash either.
    expect(
      describeModBlocker(modQuote({ slots: { used: 2, max: 2, free: 0 } })),
    ).toBe("no mod slots at this rarity — promote it first");
  });

  it("names the re-roll bill the player is closest to paying", () => {
    const blocker = describeModBlocker(
      modQuote({
        fitted: [
          fittedMod("plek", "Plek", [line("neck", "Legendary", 9, 0)]),
          fittedMod("bone-nut", "Bone nut", [line("neck", "Standard", 3, 2)]),
        ],
      }),
    );
    expect(blocker).toBe("re-rolling Bone nut needs 1 more Standard neck");
  });

  it("still names the re-roll bill once every slot is filled", () => {
    const blocker = describeModBlocker(
      modQuote({
        slots: { used: 2, max: 2, free: 0 },
        fitted: [fittedMod("plek", "Plek", [line("neck", "Epic", 4, 1)])],
      }),
    );
    expect(blocker).toBe("re-rolling Plek needs 3 more Epic necks");
  });
});
