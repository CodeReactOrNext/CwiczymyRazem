import type { SalvagedModOption } from "../data/salvage";

/** One choice in the slot dialog: a mod the stash holds, however many copies. */
export interface SlotChoice {
  featureId: string;
  label: string;
  /** What it goes on at — the copy with the highest value is the one offered. */
  points: number;
  /** The stash entry the install would consume: the best copy. */
  salvagedId: string;
  /** Copies in the stash, so the row can say "×2 owned". */
  owned: number;
}

/**
 * Folds the stash's offers for one instrument into one row per mod.
 *
 * The stash keeps a separate entry per rescued copy, so a player holding two
 * Copper shieldings would otherwise see the same mod listed twice. One row,
 * a count, and the best copy behind it — that is the row the player expects.
 * The search matches on the label only; a mod's provenance is trivia here.
 */
export const groupSlotChoices = (
  options: readonly SalvagedModOption[],
  query = "",
): SlotChoice[] => {
  const byFeature = new Map<string, SlotChoice>();
  for (const option of options) {
    const existing = byFeature.get(option.featureId);
    if (!existing) {
      byFeature.set(option.featureId, {
        featureId: option.featureId,
        label: option.label,
        points: option.points,
        salvagedId: option.salvagedId,
        owned: 1,
      });
      continue;
    }
    existing.owned += 1;
    if (option.points > existing.points) {
      existing.points = option.points;
      existing.salvagedId = option.salvagedId;
    }
  }

  const q = query.trim().toLowerCase();
  return Array.from(byFeature.values())
    .filter((choice) => !q || choice.label.toLowerCase().includes(q))
    .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label));
};

/** "12" -> "13", padded — slots are counted from one on the plate. */
export const formatModSlot = (index: number) =>
  String(index + 1).padStart(2, "0");
