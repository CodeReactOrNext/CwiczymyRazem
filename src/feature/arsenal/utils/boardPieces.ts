/**
 * What hangs on a stash board, independent of whose board it is.
 *
 * The arsenal's own cabinet and the guild's shared shelf show the same four
 * things — guitars, pedals, loose parts and rescued mods — so the shape of "one
 * socket's worth of stuff" lives here rather than inside either screen. Both
 * then feed the same `StashBoard`, the same `BoardPieceTile` and the same
 * layout maths, and a socket means the same thing wherever it is drawn.
 */

import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getPartLabel } from "feature/arsenal/data/partDefinitions";
import { getModDef } from "feature/arsenal/data/workshop";
import type {
  EffectInventoryItem,
  InventoryItem,
  SalvagedMod,
  ScrapPart,
} from "feature/arsenal/types/arsenal.types";

import { groupWalletByPart } from "./scrap";

/** One thing hanging on a board, with everything its socket needs to draw. */
export type BoardPiece =
  | {
      id: string;
      tall: true;
      kind: "guitar";
      item: InventoryItem;
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "effect";
      item: EffectInventoryItem;
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "part";
      part: ScrapPart;
      name: string;
    }
  | {
      id: string;
      tall: false;
      kind: "mod";
      mod: SalvagedMod;
      name: string;
    };

/** Part stacks get a stable id of their own — they have no inventory row. */
export const partPieceId = (partId: string, tier: string) =>
  `part:${partId}:${tier}`;

export const guitarPiece = (item: InventoryItem): BoardPiece => {
  const guitar = GUITARS_BY_ID.get(item.guitarId);
  return {
    id: item.id,
    tall: true,
    kind: "guitar",
    item,
    name: guitar ? `${guitar.brand} ${guitar.name}` : "",
  };
};

export const pedalPiece = (item: EffectInventoryItem): BoardPiece => {
  const effect = EFFECTS_BY_ID.get(item.effectId);
  return {
    id: item.id,
    tall: false,
    kind: "effect",
    item,
    name: effect ? `${effect.brand} ${effect.name}` : "",
  };
};

export const partPiece = (stack: ScrapPart): BoardPiece => ({
  id: partPieceId(stack.partId, stack.tier),
  tall: false,
  kind: "part",
  part: stack,
  name: `${stack.tier} ${getPartLabel(stack.partId)}`,
});

/** One socket per (part, tier) stack — parts are a currency, not instances. */
export const partPieces = (wallet: ScrapPart[]): BoardPiece[] =>
  groupWalletByPart(wallet).flatMap((row) =>
    row.tiers.map((tier) => partPiece({ partId: row.partId, ...tier })),
  );

export const modPiece = (mod: SalvagedMod): BoardPiece => ({
  id: mod.id,
  tall: false,
  kind: "mod",
  mod,
  name: getModDef(mod.kind, mod.featureId)?.label ?? mod.featureId,
});

export const modPieces = (mods: SalvagedMod[]): BoardPiece[] =>
  mods.map(modPiece);
