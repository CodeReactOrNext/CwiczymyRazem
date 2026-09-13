/**
 * What a second copy of the same pedal is worth on the board — and why less.
 *
 * Rig Level used to be a plain sum, so the cheapest way to raise it was to
 * stand the same pedal on the board as many times as the brick had outputs:
 * three drops of one Legendary reverb out-scored a board of five different
 * pedals, and nothing on the screen said why that was a poor rig. This makes a
 * varied board the one the score wants, with a rule short enough to print.
 *
 * Three decisions worth spelling out:
 *
 *  • **A duplicate is the same model, not the same kind.** Two different
 *    overdrives stacked is a real board — `signalChain` says so too, and never
 *    marks that cable wrong — so only a second copy of one *model* is a
 *    duplicate. Condition, vintage, rolled features and the workshop's
 *    promotion ladder all vary from copy to copy without making a copy a
 *    different pedal, and neither does a finish: a colourway or signature
 *    edition shares its model through `variantOf`, so three finishes of one
 *    reverb are one reverb three times. The Dex disagrees on purpose — it
 *    collects finishes — but the board is about what the signal goes through.
 *
 *  • **The best copy always counts in full.** Copies are ranked by Item Level
 *    before the shares are dealt, so a player never loses the value of their
 *    best pedal to the order the copies were dropped in, and taking a worse copy
 *    off the board can only ever raise the score.
 *
 *  • **Half, then nothing.** The second copy adds half its level; a third and
 *    anything after it add none. Two of one overdrive is a trick guitarists
 *    really use, so it is worth something; a third is padding, and paying it
 *    even a quarter would have kept the stack the best use of an output. The
 *    table is `DUPLICATE_LEVEL_SHARES`, so the numbers can move without the
 *    rule changing shape.
 *
 * Deliberately free of anything React, and the only place the rule is written:
 * `getRigLevel` reads its pedal half from here, so every API that saves a
 * `rigLevel` and every panel that previews one agree by construction.
 */

import type {
  EffectDefinition,
  EffectInventoryItem,
  PedalboardPlacement,
} from "../types/arsenal.types";
import { EFFECTS_BY_ID } from "./effectDefinitions";
import { getEffectLevel } from "./effectStats";

/**
 * Share of its Item Level each copy of one model adds to the rig, best copy
 * first. A copy past the end of the table gets the last entry.
 */
export const DUPLICATE_LEVEL_SHARES: readonly number[] = [1, 0.5, 0];

/** Share for the copy at `index` — 0 is the best copy, 1 the second, … */
export const duplicateShareOf = (index: number): number =>
  DUPLICATE_LEVEL_SHARES[
    Math.max(0, Math.min(index, DUPLICATE_LEVEL_SHARES.length - 1))
  ];

/** The model a definition is a finish of — itself, unless it says otherwise. */
export const modelOf = (
  def: Pick<EffectDefinition, "id" | "variantOf">,
): number | string => def.variantOf ?? def.id;

/** One powered pedal, and what its copy of the model is worth. */
export interface BoardCopy {
  itemId: string;
  /** The pedal's own name, finish and all. */
  name: string;
  /** Its Item Level — what it adds on its own. */
  level: number;
  /** 0 for the copy that counts in full, 1 for the second, … */
  index: number;
  share: number;
  /** What it actually adds to the rig. */
  counted: number;
}

/** A model with more than one powered copy on the board. */
export interface DuplicateModel {
  model: number | string;
  /** The base model's name — what the readout calls the whole group. */
  name: string;
  /** Best copy first. */
  copies: BoardCopy[];
  /** Levels the extra copies lost between them. */
  penalty: number;
}

export interface BoardLevel {
  /** What the powered board adds to Rig Level, after the rule. */
  level: number;
  /** What the same pedals would add if every copy counted in full. */
  fullLevel: number;
  /** `fullLevel - level`. What the readout shows. */
  penalty: number;
  /** Models with more than one powered copy, biggest loss first. */
  duplicates: DuplicateModel[];
  /** Every powered pedal's verdict by inventory id — what marks the tiles. */
  copies: Map<string, BoardCopy>;
}

const EMPTY_BOARD: BoardLevel = {
  level: 0,
  fullLevel: 0,
  penalty: 0,
  duplicates: [],
  copies: new Map(),
};

/**
 * Levels the powered board is worth, with the duplicate rule applied.
 *
 * `powered` decides which pedals are on the board at all — a pedal with no
 * cable to the brick is out of the rig (see `data/rigLevel`), so it is neither
 * counted nor a duplicate of anything. Omitting it counts everything, which is
 * the legacy board with no links stored.
 */
export const readBoardLevel = (
  items: PedalboardPlacement[] | null | undefined,
  effectInventory: EffectInventoryItem[] | null | undefined,
  powered?: (itemId: string) => boolean,
): BoardLevel => {
  if (!Array.isArray(items) || items.length === 0) return EMPTY_BOARD;

  // Every powered copy, bucketed by model, in board order.
  const byModel = new Map<
    number | string,
    Array<{ itemId: string; name: string; level: number }>
  >();
  for (const placement of items) {
    if (powered && !powered(placement.itemId)) continue;
    const item = effectInventory?.find((e) => e.id === placement.itemId);
    const def = item ? EFFECTS_BY_ID.get(item.effectId) : undefined;
    if (!item || !def) continue;
    const copy = {
      itemId: placement.itemId,
      name: def.name,
      level: getEffectLevel(item, def),
    };
    const group = byModel.get(modelOf(def));
    if (group) group.push(copy);
    else byModel.set(modelOf(def), [copy]);
  }

  let level = 0;
  let fullLevel = 0;
  const duplicates: DuplicateModel[] = [];
  const copies = new Map<string, BoardCopy>();

  for (const [model, group] of byModel) {
    // Best copy first; equal levels keep board order, so which of two identical
    // copies is "the extra one" never changes under the player's hand.
    const ranked = [...group].sort((a, b) => b.level - a.level);
    let penalty = 0;
    const verdicts = ranked.map((copy, index) => {
      const share = duplicateShareOf(index);
      const counted = Math.round(copy.level * share);
      level += counted;
      fullLevel += copy.level;
      penalty += copy.level - counted;
      const verdict: BoardCopy = { ...copy, index, share, counted };
      copies.set(copy.itemId, verdict);
      return verdict;
    });
    if (ranked.length > 1) {
      duplicates.push({
        model,
        name: EFFECTS_BY_ID.get(model)?.name ?? ranked[0].name,
        copies: verdicts,
        penalty,
      });
    }
  }

  duplicates.sort((a, b) => b.penalty - a.penalty);

  return { level, fullLevel, penalty: fullLevel - level, duplicates, copies };
};

/**
 * The share as the board prints it on a copy: "½" on the second, "0" on any
 * after it, nothing at all on the one that counts in full.
 */
export const formatDuplicateShare = (share: number): string | null => {
  if (share >= 1) return null;
  if (share === 0.5) return "½";
  if (share === 0.25) return "¼";
  if (share === 0) return "0";
  return `${Math.round(share * 100)}%`;
};

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

const ordinalOf = (index: number) => ORDINALS[index] ?? `${index + 1}th`;

/** One sentence for the tooltip on a marked copy: which one it is, and what it adds. */
export const describeDuplicateCopy = (
  copy: BoardCopy,
  modelName: string,
): string => {
  const worth =
    copy.share === 0
      ? "adds nothing to your Rig Level"
      : copy.share === 0.5
        ? "adds half its level to your Rig Level"
        : `adds ${Math.round(copy.share * 100)}% of its level to your Rig Level`;
  return `The ${ordinalOf(copy.index)} ${modelName} on the board — it ${worth} (Lv ${copy.level} → ${copy.counted}). Swap it for a different pedal and every level counts.`;
};

const shareWord = (share: number): string => {
  if (share === 0) return "nothing";
  if (share === 0.5) return "half";
  if (share === 0.25) return "a quarter";
  return `${Math.round(share * 100)}%`;
};

/**
 * The rule as one sentence, read off the table so the copy can never drift
 * from the numbers: "The best copy counts in full, the second half, any more
 * nothing."
 */
export const describeDuplicateRule = (): string => {
  const last = DUPLICATE_LEVEL_SHARES.length - 1;
  const parts = DUPLICATE_LEVEL_SHARES.slice(1).map((share, offset) => {
    const index = offset + 1;
    const who =
      index === last
        ? index === 1
          ? "any other"
          : "any more"
        : `the ${ordinalOf(index)}`;
    return `${who} ${shareWord(share)}`;
  });
  return `The best copy counts in full, ${parts.join(", ")}.`;
};
